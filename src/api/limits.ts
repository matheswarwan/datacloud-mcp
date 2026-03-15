import { getDCClient } from "./client.js";

// ── Types ────────────────────────────────────────────────────────────────────

export interface LimitsInfo {
  [key: string]: unknown;
}

export interface UserInfo {
  [key: string]: unknown;
}

// ── GET limits ────────────────────────────────────────────────────────────────

export async function fetchLimits(): Promise<LimitsInfo> {
  const client = await getDCClient();
  const url = "/services/data/v65.0/limits";
  console.error(`[limits] GET ${client.defaults.baseURL}${url}`);

  try {
    const response = await client.get<LimitsInfo>(url);
    console.error(`[limits] HTTP ${response.status}`);
    console.error(`[limits] body: ${JSON.stringify(response.data).slice(0, 800)}`);
    return response.data;
  } catch (err) {
    if ((err as { isAxiosError?: boolean }).isAxiosError) {
      const e = err as { response?: { data?: unknown; status?: number }; message: string };
      throw new Error(
        `Failed to fetch limits (HTTP ${e.response?.status ?? "unknown"}): ${JSON.stringify(e.response?.data ?? e.message)}`
      );
    }
    throw err;
  }
}

// ── GET user info ─────────────────────────────────────────────────────────────

export async function fetchUserInfo(): Promise<UserInfo> {
  const client = await getDCClient();
  const url = "/services/oauth2/userinfo";
  console.error(`[limits] GET ${client.defaults.baseURL}${url}`);

  try {
    const response = await client.get<UserInfo>(url);
    console.error(`[limits] HTTP ${response.status}`);
    console.error(`[limits] body: ${JSON.stringify(response.data).slice(0, 800)}`);
    return response.data;
  } catch (err) {
    if ((err as { isAxiosError?: boolean }).isAxiosError) {
      const e = err as { response?: { data?: unknown; status?: number }; message: string };
      throw new Error(
        `Failed to fetch user info (HTTP ${e.response?.status ?? "unknown"}): ${JSON.stringify(e.response?.data ?? e.message)}`
      );
    }
    throw err;
  }
}
