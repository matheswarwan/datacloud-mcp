import crypto from "crypto";
import axios from "axios";
import {
  ProxyOAuthServerProvider,
} from "@modelcontextprotocol/sdk/server/auth/providers/proxyProvider.js";
import { OAuthTokensSchema } from "@modelcontextprotocol/sdk/shared/auth.js";
import type {
  OAuthClientInformationFull,
  OAuthTokens,
} from "@modelcontextprotocol/sdk/shared/auth.js";
import type { OAuthRegisteredClientsStore } from "@modelcontextprotocol/sdk/server/auth/clients.js";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import type { AuthorizationParams } from "@modelcontextprotocol/sdk/server/auth/provider.js";
import type { Response } from "express";
import { injectDataCloudToken } from "./datacloud.js";

// Per-process in-memory DCR store (keyed by our server-issued client_id)
const _clients = new Map<string, OAuthClientInformationFull>();

/**
 * OAuth2 proxy provider that delegates authentication to a Salesforce org.
 *
 * - Uses the server-level SF_CLIENT_ID / SF_CLIENT_SECRET (Connected App) for
 *   all token exchanges — individual MCP clients register via DCR to get a
 *   local client_id but do not need their own SF credentials.
 * - After a successful token verification the acquired SF access token is
 *   injected into the Data Cloud token cache so MCP tools can use it without
 *   any further configuration.
 */
export class SalesforceOAuthProvider extends ProxyOAuthServerProvider {
  private readonly _loginUrl: string;

  constructor(loginUrl: string) {
    super({
      endpoints: {
        authorizationUrl: `${loginUrl}/services/oauth2/authorize`,
        tokenUrl: `${loginUrl}/services/oauth2/token`,
        revocationUrl: `${loginUrl}/services/oauth2/revoke`,
      },
      verifyAccessToken: async (token: string): Promise<AuthInfo> => {
        const resp = await axios.get(
          `${this._loginUrl}/services/oauth2/userinfo`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        // Derive instance URL from the identity profile URL
        const profile: string = resp.data.profile ?? "";
        const instanceUrl = profile
          ? new URL(profile).origin
          : this._loginUrl;

        injectDataCloudToken(token, instanceUrl);

        return {
          token,
          clientId: resp.data.user_id ?? "sf-user",
          scopes: ["api"],
          extra: {
            username: resp.data.preferred_username,
            instanceUrl,
          },
        };
      },
      getClient: async (clientId: string) => _clients.get(clientId),
    });
    this._loginUrl = loginUrl;
  }

  // ── Redirect to Salesforce login using the server's Connected App ─────────

  override async authorize(
    _client: OAuthClientInformationFull,
    params: AuthorizationParams,
    res: Response
  ): Promise<void> {
    const sfClientId = process.env.SF_CLIENT_ID;
    if (!sfClientId) {
      res.status(500).json({ error: "server_error", error_description: "SF_CLIENT_ID is not configured" });
      return;
    }

    const target = new URL(`${this._loginUrl}/services/oauth2/authorize`);
    target.searchParams.set("response_type", "code");
    target.searchParams.set("client_id", sfClientId);
    target.searchParams.set("redirect_uri", params.redirectUri);
    target.searchParams.set("code_challenge", params.codeChallenge);
    target.searchParams.set("code_challenge_method", "S256");
    target.searchParams.set(
      "scope",
      (params.scopes?.length ? params.scopes : ["api", "refresh_token"]).join(" ")
    );
    if (params.state) target.searchParams.set("state", params.state);

    res.redirect(target.toString());
  }

  // ── Token exchange using server's SF credentials ──────────────────────────

  override async exchangeAuthorizationCode(
    _client: OAuthClientInformationFull,
    authorizationCode: string,
    codeVerifier?: string,
    redirectUri?: string,
    _resource?: URL
  ): Promise<OAuthTokens> {
    const sfClientId = process.env.SF_CLIENT_ID;
    const sfClientSecret = process.env.SF_CLIENT_SECRET;
    if (!sfClientId) throw new Error("SF_CLIENT_ID is not configured");

    const params = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: sfClientId,
      code: authorizationCode,
    });
    if (sfClientSecret) params.append("client_secret", sfClientSecret);
    if (codeVerifier) params.append("code_verifier", codeVerifier);
    if (redirectUri) params.append("redirect_uri", redirectUri);

    const resp = await axios.post(
      `${this._loginUrl}/services/oauth2/token`,
      params.toString(),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );
    return OAuthTokensSchema.parse(resp.data);
  }

  // ── Refresh token using server's SF credentials ───────────────────────────

  override async exchangeRefreshToken(
    _client: OAuthClientInformationFull,
    refreshToken: string,
    scopes?: string[],
    _resource?: URL
  ): Promise<OAuthTokens> {
    const sfClientId = process.env.SF_CLIENT_ID;
    const sfClientSecret = process.env.SF_CLIENT_SECRET;
    if (!sfClientId) throw new Error("SF_CLIENT_ID is not configured");

    const params = new URLSearchParams({
      grant_type: "refresh_token",
      client_id: sfClientId,
      refresh_token: refreshToken,
    });
    if (sfClientSecret) params.append("client_secret", sfClientSecret);
    if (scopes?.length) params.append("scope", scopes.join(" "));

    const resp = await axios.post(
      `${this._loginUrl}/services/oauth2/token`,
      params.toString(),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );
    return OAuthTokensSchema.parse(resp.data);
  }

  // ── Local DCR store (adds registerClient to the base read-only store) ─────

  override get clientsStore(): OAuthRegisteredClientsStore {
    return {
      getClient: async (clientId: string) => _clients.get(clientId),
      registerClient: async (
        client: Omit<OAuthClientInformationFull, "client_id" | "client_id_issued_at">
      ): Promise<OAuthClientInformationFull> => {
        const registered: OAuthClientInformationFull = {
          ...client,
          client_id: crypto.randomUUID(),
          client_id_issued_at: Math.floor(Date.now() / 1000),
        };
        _clients.set(registered.client_id, registered);
        console.error(`[oauth] Registered client: ${registered.client_name ?? registered.client_id}`);
        return registered;
      },
    };
  }
}
