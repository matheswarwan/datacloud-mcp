import http from "http";
import { exec } from "child_process";
import axios from "axios";
import { SalesforceTokenResponse } from "../salesforce.js";

const SF_TOKEN_ENDPOINT = "/services/oauth2/token";
const SF_AUTHORIZE_ENDPOINT = "/services/oauth2/authorize";

export interface OAuthCodeTokenResponse extends SalesforceTokenResponse {
  refresh_token: string;
}

// ── Token refresh ─────────────────────────────────────────────────────────────

export async function refreshOAuthToken(
  refreshToken: string
): Promise<OAuthCodeTokenResponse> {
  const clientId     = process.env.SF_CLIENT_ID;
  const clientSecret = process.env.SF_CLIENT_SECRET;
  const loginUrl     = process.env.SF_LOGIN_URL ?? "https://login.salesforce.com";

  if (!clientId || !clientSecret) {
    throw new Error("oauth_code refresh requires: SF_CLIENT_ID, SF_CLIENT_SECRET");
  }

  const params = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
  });

  try {
    const response = await axios.post<OAuthCodeTokenResponse>(
      `${loginUrl}${SF_TOKEN_ENDPOINT}`,
      params.toString(),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );
    return response.data;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      throw new Error(`Token refresh failed: ${JSON.stringify(err.response?.data ?? err.message)}`);
    }
    throw err;
  }
}

// ── Full authorization code flow ──────────────────────────────────────────────

function openBrowser(url: string): void {
  const platform = process.platform;
  const cmd =
    platform === "darwin" ? `open "${url}"` :
    platform === "win32"  ? `start "" "${url}"` :
                            `xdg-open "${url}"`;
  exec(cmd, (err) => {
    if (err) console.error("[oauth] Could not open browser automatically:", err.message);
  });
}

function waitForCode(callbackPort: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const urlObj = new URL(req.url ?? "/", `http://localhost:${callbackPort}`);

      if (urlObj.pathname !== "/callback") {
        res.writeHead(404);
        res.end("Not found");
        return;
      }

      const code  = urlObj.searchParams.get("code");
      const error = urlObj.searchParams.get("error");
      const errorDesc = urlObj.searchParams.get("error_description");

      if (error) {
        res.writeHead(400, { "Content-Type": "text/html" });
        res.end(`<h2>Auth error: ${error}</h2><p>${errorDesc ?? ""}</p><p>You can close this tab.</p>`);
        server.close();
        reject(new Error(`Salesforce auth error: ${error} — ${errorDesc ?? ""}`));
        return;
      }

      if (code) {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(`<h2>Authenticated successfully!</h2><p>You can close this tab and return to your terminal.</p>`);
        server.close();
        resolve(code);
      }
    });

    server.listen(callbackPort, () => {
      console.error(`[oauth] Callback server listening on http://localhost:${callbackPort}/callback`);
    });

    // Timeout after 5 minutes
    setTimeout(() => {
      server.close();
      reject(new Error("OAuth timeout: no callback received within 5 minutes."));
    }, 5 * 60 * 1000);
  });
}

export async function oauthCodeAuth(): Promise<OAuthCodeTokenResponse> {
  const clientId     = process.env.SF_CLIENT_ID;
  const clientSecret = process.env.SF_CLIENT_SECRET;
  const loginUrl     = process.env.SF_LOGIN_URL ?? "https://login.salesforce.com";
  const callbackPort = Number(process.env.SF_CALLBACK_PORT ?? 3456);
  const redirectUri  = `http://localhost:${callbackPort}/callback`;

  if (!clientId || !clientSecret) {
    throw new Error("oauth_code requires: SF_CLIENT_ID, SF_CLIENT_SECRET, SF_LOGIN_URL");
  }

  // Step 1 — build the authorization URL and open the browser
  const authUrl =
    `${loginUrl}${SF_AUTHORIZE_ENDPOINT}` +
    `?response_type=code` +
    `&client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${encodeURIComponent("api refresh_token")}`;

  console.error("\n[oauth] Opening Salesforce login in your browser...");
  console.error(`[oauth] If the browser does not open, visit:\n  ${authUrl}\n`);
  openBrowser(authUrl);

  // Step 2 — wait for the authorization code on the callback server
  const code = await waitForCode(callbackPort);
  console.error("[oauth] Authorization code received. Exchanging for tokens...");

  // Step 3 — exchange the code for access + refresh tokens
  const params = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
  });

  try {
    const response = await axios.post<OAuthCodeTokenResponse>(
      `${loginUrl}${SF_TOKEN_ENDPOINT}`,
      params.toString(),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );
    console.error("[oauth] Tokens obtained successfully.");
    return response.data;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      throw new Error(`OAuth code exchange failed: ${JSON.stringify(err.response?.data ?? err.message)}`);
    }
    throw err;
  }
}
