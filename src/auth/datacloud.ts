import { getSalesforceAccessToken } from "./salesforce.js";
import { resetDCClient } from "../api/client.js";

// SF client_credentials tokens don't work with the /services/a360/token exchange
// (that endpoint requires a JWT-generated token as the assertion).
// The SF access token is accepted directly by Data Cloud REST APIs.
const EXPIRY_BUFFER_MS =
  Number(process.env.TOKEN_EXPIRY_BUFFER ?? 300) * 1000;

// SF client_credentials tokens expire in 2 hours; use that as fallback
const DEFAULT_EXPIRY_MS = 2 * 60 * 60 * 1000;

interface TokenCache {
  accessToken: string;
  instanceUrl: string;
  expiresAt: number; // epoch ms
}

let cache: TokenCache | null = null;

export async function getDataCloudToken(): Promise<TokenCache> {
  const now = Date.now();
  if (cache && now < cache.expiresAt - EXPIRY_BUFFER_MS) {
    return cache;
  }

  const sfToken = await getSalesforceAccessToken();
  console.error(`[auth] SF token obtained. instance_url: ${sfToken.instance_url}`);

  if (!sfToken.instance_url) {
    throw new Error(
      "Salesforce token response did not include instance_url. Check SF_LOGIN_URL and Connected App settings."
    );
  }

  cache = {
    accessToken: sfToken.access_token,
    instanceUrl: sfToken.instance_url,
    expiresAt: now + DEFAULT_EXPIRY_MS,
  };

  return cache;
}

export function invalidateDataCloudToken(): void {
  cache = null;
  resetDCClient();
}
