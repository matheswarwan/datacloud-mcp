import { getDCClient } from "./client.js";

const DCR_PATH = "/services/data/v65.0/ssot/data-clean-room";

// ── Types ────────────────────────────────────────────────────────────────────

export interface CleanRoomCollaboration {
  id?: string;
  name?: string;
  label?: string;
  status?: string;
  [key: string]: unknown;
}

export interface CleanRoomProvider {
  id?: string;
  name?: string;
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

// ── GET collaborations (list) ─────────────────────────────────────────────────

export async function fetchCleanRoomCollaborations(limit = 100): Promise<CleanRoomCollaboration[]> {
  const url = `${DCR_PATH}/collaborations`;
  const client = await getDCClient();
  console.error(`[dcr] GET ${client.defaults.baseURL}${url}`);

  try {
    const response = await client.get<unknown>(url, { params: { limit } });
    console.error(`[dcr] HTTP ${response.status}`);
    console.error(`[dcr] body: ${JSON.stringify(response.data).slice(0, 800)}`);
    return extractArray<CleanRoomCollaboration>(response.data, ["collaborations", "data", "items", "records", "results"]);
  } catch (err) {
    if ((err as { isAxiosError?: boolean }).isAxiosError) {
      const e = err as { response?: { data?: unknown; status?: number }; message: string };
      throw new Error(
        `Failed to list clean room collaborations (HTTP ${e.response?.status ?? "unknown"}): ${JSON.stringify(e.response?.data ?? e.message)}`
      );
    }
    throw err;
  }
}

// ── GET collaboration jobs ────────────────────────────────────────────────────

export async function fetchCleanRoomCollaborationJobs(collaborationId: string, limit = 100): Promise<unknown[]> {
  const client = await getDCClient();
  const url = `${DCR_PATH}/collaborations/${encodeURIComponent(collaborationId)}/jobs`;
  console.error(`[dcr] GET ${client.defaults.baseURL}${url}`);

  try {
    const response = await client.get<unknown>(url, { params: { limit } });
    console.error(`[dcr] HTTP ${response.status}`);
    console.error(`[dcr] body: ${JSON.stringify(response.data).slice(0, 800)}`);
    return extractArray<unknown>(response.data, ["jobs", "data", "items", "records", "results"]);
  } catch (err) {
    if ((err as { isAxiosError?: boolean }).isAxiosError) {
      const e = err as { response?: { data?: unknown; status?: number }; message: string };
      throw new Error(
        `Failed to get collaboration jobs for "${collaborationId}" (HTTP ${e.response?.status ?? "unknown"}): ${JSON.stringify(e.response?.data ?? e.message)}`
      );
    }
    throw err;
  }
}

// ── GET providers (list) ──────────────────────────────────────────────────────

export async function fetchCleanRoomProviders(limit = 100): Promise<CleanRoomProvider[]> {
  const url = `${DCR_PATH}/providers`;
  const client = await getDCClient();
  console.error(`[dcr] GET ${client.defaults.baseURL}${url}`);

  try {
    const response = await client.get<unknown>(url, { params: { limit } });
    console.error(`[dcr] HTTP ${response.status}`);
    console.error(`[dcr] body: ${JSON.stringify(response.data).slice(0, 800)}`);
    return extractArray<CleanRoomProvider>(response.data, ["providers", "data", "items", "records", "results"]);
  } catch (err) {
    if ((err as { isAxiosError?: boolean }).isAxiosError) {
      const e = err as { response?: { data?: unknown; status?: number }; message: string };
      throw new Error(
        `Failed to list clean room providers (HTTP ${e.response?.status ?? "unknown"}): ${JSON.stringify(e.response?.data ?? e.message)}`
      );
    }
    throw err;
  }
}

// ── GET provider (single) ─────────────────────────────────────────────────────

export async function fetchCleanRoomProvider(providerIdOrName: string): Promise<CleanRoomProvider> {
  const client = await getDCClient();
  const url = `${DCR_PATH}/providers/${encodeURIComponent(providerIdOrName)}`;
  console.error(`[dcr] GET ${client.defaults.baseURL}${url}`);

  try {
    const response = await client.get<CleanRoomProvider>(url);
    console.error(`[dcr] HTTP ${response.status}`);
    console.error(`[dcr] body: ${JSON.stringify(response.data).slice(0, 800)}`);
    return response.data;
  } catch (err) {
    if ((err as { isAxiosError?: boolean }).isAxiosError) {
      const e = err as { response?: { data?: unknown; status?: number }; message: string };
      throw new Error(
        `Failed to get clean room provider "${providerIdOrName}" (HTTP ${e.response?.status ?? "unknown"}): ${JSON.stringify(e.response?.data ?? e.message)}`
      );
    }
    throw err;
  }
}

// ── GET specifications (list) ─────────────────────────────────────────────────

export async function fetchCleanRoomSpecifications(limit = 100): Promise<unknown[]> {
  const url = `${DCR_PATH}/specifications`;
  const client = await getDCClient();
  console.error(`[dcr] GET ${client.defaults.baseURL}${url}`);

  try {
    const response = await client.get<unknown>(url, { params: { limit } });
    console.error(`[dcr] HTTP ${response.status}`);
    console.error(`[dcr] body: ${JSON.stringify(response.data).slice(0, 800)}`);
    return extractArray<unknown>(response.data, ["specifications", "data", "items", "records", "results"]);
  } catch (err) {
    if ((err as { isAxiosError?: boolean }).isAxiosError) {
      const e = err as { response?: { data?: unknown; status?: number }; message: string };
      throw new Error(
        `Failed to list clean room specifications (HTTP ${e.response?.status ?? "unknown"}): ${JSON.stringify(e.response?.data ?? e.message)}`
      );
    }
    throw err;
  }
}

// ── GET templates (list) ──────────────────────────────────────────────────────

export async function fetchCleanRoomTemplates(limit = 100): Promise<unknown[]> {
  const url = `${DCR_PATH}/templates`;
  const client = await getDCClient();
  console.error(`[dcr] GET ${client.defaults.baseURL}${url}`);

  try {
    const response = await client.get<unknown>(url, { params: { limit } });
    console.error(`[dcr] HTTP ${response.status}`);
    console.error(`[dcr] body: ${JSON.stringify(response.data).slice(0, 800)}`);
    return extractArray<unknown>(response.data, ["templates", "data", "items", "records", "results"]);
  } catch (err) {
    if ((err as { isAxiosError?: boolean }).isAxiosError) {
      const e = err as { response?: { data?: unknown; status?: number }; message: string };
      throw new Error(
        `Failed to list clean room templates (HTTP ${e.response?.status ?? "unknown"}): ${JSON.stringify(e.response?.data ?? e.message)}`
      );
    }
    throw err;
  }
}
