import { getDCClient } from "./client.js";

const DS_PATH = "/services/data/v65.0/ssot/data-spaces";

// ── Types ────────────────────────────────────────────────────────────────────

export interface DataSpace {
  id?: string;
  name?: string;
  label?: string;
  description?: string;
  status?: string;
  [key: string]: unknown;
}

export interface DataSpaceMember {
  name?: string;
  label?: string;
  type?: string;
  [key: string]: unknown;
}

// ── GET list ─────────────────────────────────────────────────────────────────

export async function fetchDataSpaces(limit = 100): Promise<DataSpace[]> {
  const client = await getDCClient();
  console.error(`[data_spaces] GET ${client.defaults.baseURL}${DS_PATH}`);

  try {
    const response = await client.get<unknown>(DS_PATH, { params: { limit } });
    console.error(`[data_spaces] HTTP ${response.status}`);
    console.error(`[data_spaces] body: ${JSON.stringify(response.data).slice(0, 800)}`);

    const raw = response.data;
    if (Array.isArray(raw)) return raw;

    if (raw && typeof raw === "object") {
      const obj = raw as Record<string, unknown>;
      for (const key of ["dataSpaces", "data", "items", "records", "results"]) {
        const val = obj[key];
        if (Array.isArray(val)) return val as DataSpace[];
      }
      return [obj as DataSpace];
    }

    return [];
  } catch (err) {
    if ((err as { isAxiosError?: boolean }).isAxiosError) {
      const e = err as { response?: { data?: unknown; status?: number }; message: string };
      throw new Error(
        `Failed to list data spaces (HTTP ${e.response?.status ?? "unknown"}): ${JSON.stringify(e.response?.data ?? e.message)}`
      );
    }
    throw err;
  }
}

// ── GET one ──────────────────────────────────────────────────────────────────

export async function fetchDataSpace(idOrName: string): Promise<DataSpace> {
  const client = await getDCClient();
  const url = `${DS_PATH}/${encodeURIComponent(idOrName)}`;
  console.error(`[data_spaces] GET ${client.defaults.baseURL}${url}`);

  try {
    const response = await client.get<DataSpace>(url);
    console.error(`[data_spaces] HTTP ${response.status}`);
    console.error(`[data_spaces] body: ${JSON.stringify(response.data).slice(0, 800)}`);
    return response.data;
  } catch (err) {
    if ((err as { isAxiosError?: boolean }).isAxiosError) {
      const e = err as { response?: { data?: unknown; status?: number }; message: string };
      throw new Error(
        `Failed to get data space "${idOrName}" (HTTP ${e.response?.status ?? "unknown"}): ${JSON.stringify(e.response?.data ?? e.message)}`
      );
    }
    throw err;
  }
}

// ── GET members ──────────────────────────────────────────────────────────────

export async function fetchDataSpaceMembers(idOrName: string, limit = 100): Promise<DataSpaceMember[]> {
  const client = await getDCClient();
  const url = `${DS_PATH}/${encodeURIComponent(idOrName)}/members`;
  console.error(`[data_spaces] GET ${client.defaults.baseURL}${url}`);

  try {
    const response = await client.get<unknown>(url, { params: { limit } });
    console.error(`[data_spaces] HTTP ${response.status}`);
    console.error(`[data_spaces] body: ${JSON.stringify(response.data).slice(0, 800)}`);

    const raw = response.data;
    if (Array.isArray(raw)) return raw;

    if (raw && typeof raw === "object") {
      const obj = raw as Record<string, unknown>;
      for (const key of ["members", "data", "items", "records", "results"]) {
        const val = obj[key];
        if (Array.isArray(val)) return val as DataSpaceMember[];
      }
      return [obj as DataSpaceMember];
    }

    return [];
  } catch (err) {
    if ((err as { isAxiosError?: boolean }).isAxiosError) {
      const e = err as { response?: { data?: unknown; status?: number }; message: string };
      throw new Error(
        `Failed to get data space members for "${idOrName}" (HTTP ${e.response?.status ?? "unknown"}): ${JSON.stringify(e.response?.data ?? e.message)}`
      );
    }
    throw err;
  }
}
