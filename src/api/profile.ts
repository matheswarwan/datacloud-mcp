import { getDCClient } from "./client.js";

const PROFILE_META_PATH = "/services/data/v65.0/ssot/profile/metadata";
const PROFILE_PATH = "/services/data/v65.0/ssot/profile";

// ── Types ────────────────────────────────────────────────────────────────────

export interface ProfileMetadata {
  name?: string;
  label?: string;
  [key: string]: unknown;
}

export interface ProfileRecord {
  id?: string;
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

// ── GET profile metadata (list) ───────────────────────────────────────────────

export async function fetchProfileMetadata(limit = 100): Promise<ProfileMetadata[]> {
  const client = await getDCClient();
  console.error(`[profile] GET ${client.defaults.baseURL}${PROFILE_META_PATH}`);

  try {
    const response = await client.get<unknown>(PROFILE_META_PATH, { params: { limit } });
    console.error(`[profile] HTTP ${response.status}`);
    console.error(`[profile] body: ${JSON.stringify(response.data).slice(0, 800)}`);
    return extractArray<ProfileMetadata>(response.data, ["metadata", "data", "items", "records", "results"]);
  } catch (err) {
    if ((err as { isAxiosError?: boolean }).isAxiosError) {
      const e = err as { response?: { data?: unknown; status?: number }; message: string };
      throw new Error(
        `Failed to list profile metadata (HTTP ${e.response?.status ?? "unknown"}): ${JSON.stringify(e.response?.data ?? e.message)}`
      );
    }
    throw err;
  }
}

// ── GET profile metadata by name ──────────────────────────────────────────────

export async function fetchProfileMetadataByName(dataModelName: string): Promise<ProfileMetadata> {
  const client = await getDCClient();
  const url = `${PROFILE_META_PATH}/${encodeURIComponent(dataModelName)}`;
  console.error(`[profile] GET ${client.defaults.baseURL}${url}`);

  try {
    const response = await client.get<ProfileMetadata>(url);
    console.error(`[profile] HTTP ${response.status}`);
    console.error(`[profile] body: ${JSON.stringify(response.data).slice(0, 800)}`);
    return response.data;
  } catch (err) {
    if ((err as { isAxiosError?: boolean }).isAxiosError) {
      const e = err as { response?: { data?: unknown; status?: number }; message: string };
      throw new Error(
        `Failed to get profile metadata "${dataModelName}" (HTTP ${e.response?.status ?? "unknown"}): ${JSON.stringify(e.response?.data ?? e.message)}`
      );
    }
    throw err;
  }
}

// ── GET profile records ───────────────────────────────────────────────────────

export async function fetchProfileRecords(dataModelName: string, filters?: string, limit = 100): Promise<ProfileRecord[]> {
  const client = await getDCClient();
  const url = `${PROFILE_PATH}/${encodeURIComponent(dataModelName)}`;
  console.error(`[profile] GET ${client.defaults.baseURL}${url}`);

  try {
    const params: Record<string, unknown> = { batchSize: limit };
    if (filters) params.filters = filters;

    const response = await client.get<unknown>(url, { params });
    console.error(`[profile] HTTP ${response.status}`);
    console.error(`[profile] body: ${JSON.stringify(response.data).slice(0, 800)}`);
    return extractArray<ProfileRecord>(response.data, ["data", "records", "items", "results"]);
  } catch (err) {
    if ((err as { isAxiosError?: boolean }).isAxiosError) {
      const e = err as { response?: { data?: unknown; status?: number }; message: string };
      throw new Error(
        `Failed to get profile records for "${dataModelName}" (HTTP ${e.response?.status ?? "unknown"}): ${JSON.stringify(e.response?.data ?? e.message)}`
      );
    }
    throw err;
  }
}

// ── GET single profile record ─────────────────────────────────────────────────

export async function fetchProfileRecord(dataModelName: string, id: string): Promise<ProfileRecord> {
  const client = await getDCClient();
  const url = `${PROFILE_PATH}/${encodeURIComponent(dataModelName)}/${encodeURIComponent(id)}`;
  console.error(`[profile] GET ${client.defaults.baseURL}${url}`);

  try {
    const response = await client.get<ProfileRecord>(url);
    console.error(`[profile] HTTP ${response.status}`);
    console.error(`[profile] body: ${JSON.stringify(response.data).slice(0, 800)}`);
    return response.data;
  } catch (err) {
    if ((err as { isAxiosError?: boolean }).isAxiosError) {
      const e = err as { response?: { data?: unknown; status?: number }; message: string };
      throw new Error(
        `Failed to get profile record "${id}" for "${dataModelName}" (HTTP ${e.response?.status ?? "unknown"}): ${JSON.stringify(e.response?.data ?? e.message)}`
      );
    }
    throw err;
  }
}
