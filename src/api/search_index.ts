import { getDCClient } from "./client.js";

const SI_PATH = "/services/data/v65.0/ssot/search-index";

// ── Types ────────────────────────────────────────────────────────────────────

export interface SearchIndex {
  id?: string;
  apiName?: string;
  name?: string;
  label?: string;
  status?: string;
  [key: string]: unknown;
}

// ── Helper ───────────────────────────────────────────────────────────────────

function extractArray<T>(raw: unknown, keys: string[]): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    for (const key of keys) {
      const val = obj[key];
      if (Array.isArray(val)) return val as T[];
    }
    return [obj as T];
  }
  return [];
}

// ── GET search indexes (list) ─────────────────────────────────────────────────

export async function fetchSearchIndexes(limit = 100): Promise<SearchIndex[]> {
  const client = await getDCClient();
  console.error(`[search_index] GET ${client.defaults.baseURL}${SI_PATH}`);

  try {
    const response = await client.get<unknown>(SI_PATH, { params: { limit } });
    console.error(`[search_index] HTTP ${response.status}`);
    console.error(`[search_index] body: ${JSON.stringify(response.data).slice(0, 800)}`);
    return extractArray<SearchIndex>(response.data, ["searchIndexes", "data", "items", "records", "results"]);
  } catch (err) {
    if ((err as { isAxiosError?: boolean }).isAxiosError) {
      const e = err as { response?: { data?: unknown; status?: number }; message: string };
      throw new Error(
        `Failed to list search indexes (HTTP ${e.response?.status ?? "unknown"}): ${JSON.stringify(e.response?.data ?? e.message)}`
      );
    }
    throw err;
  }
}

// ── GET search index config ───────────────────────────────────────────────────

export async function fetchSearchIndexConfig(): Promise<unknown> {
  const client = await getDCClient();
  const url = `${SI_PATH}/config`;
  console.error(`[search_index] GET ${client.defaults.baseURL}${url}`);

  try {
    const response = await client.get<unknown>(url);
    console.error(`[search_index] HTTP ${response.status}`);
    console.error(`[search_index] body: ${JSON.stringify(response.data).slice(0, 800)}`);
    return response.data;
  } catch (err) {
    if ((err as { isAxiosError?: boolean }).isAxiosError) {
      const e = err as { response?: { data?: unknown; status?: number }; message: string };
      throw new Error(
        `Failed to get search index config (HTTP ${e.response?.status ?? "unknown"}): ${JSON.stringify(e.response?.data ?? e.message)}`
      );
    }
    throw err;
  }
}

// ── GET search index (single) ─────────────────────────────────────────────────

export async function fetchSearchIndex(apiNameOrId: string): Promise<SearchIndex> {
  const client = await getDCClient();
  const url = `${SI_PATH}/${encodeURIComponent(apiNameOrId)}`;
  console.error(`[search_index] GET ${client.defaults.baseURL}${url}`);

  try {
    const response = await client.get<SearchIndex>(url);
    console.error(`[search_index] HTTP ${response.status}`);
    console.error(`[search_index] body: ${JSON.stringify(response.data).slice(0, 800)}`);
    return response.data;
  } catch (err) {
    if ((err as { isAxiosError?: boolean }).isAxiosError) {
      const e = err as { response?: { data?: unknown; status?: number }; message: string };
      throw new Error(
        `Failed to get search index "${apiNameOrId}" (HTTP ${e.response?.status ?? "unknown"}): ${JSON.stringify(e.response?.data ?? e.message)}`
      );
    }
    throw err;
  }
}
