import { getSalesforceAccessToken, getAuthMethod } from "./salesforce.js";
import { refreshOAuthToken } from "./strategies/oauth_code.js";
import { resetDCClient } from "../api/client.js";

const EXPIRY_BUFFER_MS  = Number(process.env.TOKEN_EXPIRY_BUFFER ?? 300) * 1000;
const DEFAULT_EXPIRY_MS = 2 * 60 * 60 * 1000; // 2 hours fallback

interface TokenCache {
  accessToken: string;
  instanceUrl: string;
  expiresAt: number;
  refreshToken?: string; // only populated for oauth_code
}

let cache: TokenCache | null = null;

export async function getDataCloudToken(): Promise<TokenCache> {
  const now = Date.now();

  // Return cached token if still valid
  if (cache && now < cache.expiresAt - EXPIRY_BUFFER_MS) {
    return cache;
  }

  // If we have a refresh token (oauth_code), use it silently instead of re-opening the browser
  if (cache?.refreshToken) {
    try {
      console.error("[auth] Refreshing access token using refresh token...");
      const refreshed = await refreshOAuthToken(cache.refreshToken);
      cache = {
        accessToken: refreshed.access_token,
        instanceUrl: refreshed.instance_url,
        expiresAt: now + DEFAULT_EXPIRY_MS,
        refreshToken: refreshed.refresh_token ?? cache.refreshToken,
      };
      console.error(`[auth] Token refreshed. instance_url: ${cache.instanceUrl}`);
      return cache;
    } catch (err) {
      console.error("[auth] Refresh token failed, falling back to full re-auth:", err);
      cache = null;
    }
  }

  // Full authentication
  const sfToken = await getSalesforceAccessToken();
  console.error(`[auth] SF token obtained (${getAuthMethod()}). instance_url: ${sfToken.instance_url}`);

  if (!sfToken.instance_url) {
    throw new Error(
      "Salesforce token response did not include instance_url. Check SF_LOGIN_URL and Connected App settings."
    );
  }

  cache = {
    accessToken: sfToken.access_token,
    instanceUrl: sfToken.instance_url,
    expiresAt: now + DEFAULT_EXPIRY_MS,
    refreshToken: sfToken.refresh_token, // present only for oauth_code
  };

  return cache;
}

export function invalidateDataCloudToken(): void {
  cache = null;
  resetDCClient();
}
