import { getSalesforceAccessToken, getAuthMethod } from "./salesforce.js";
import { resetDCClient } from "../api/client.js";

const EXPIRY_BUFFER_MS  = Number(process.env.TOKEN_EXPIRY_BUFFER ?? 300) * 1000;
const DEFAULT_EXPIRY_MS = 2 * 60 * 60 * 1000; // 2 hours fallback

interface TokenCache {
  accessToken: string;
  instanceUrl: string;
  expiresAt: number;
}

let cache: TokenCache | null = null;

export async function getDataCloudToken(): Promise<TokenCache> {
  const now = Date.now();

  if (cache && now < cache.expiresAt - EXPIRY_BUFFER_MS) {
    return cache;
  }

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
  };

  return cache;
}

export function invalidateDataCloudToken(): void {
  cache = null;
  resetDCClient();
}
