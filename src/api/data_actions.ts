import { getDCClient } from "./client.js";

const DA_PATH = "/services/data/v65.0/ssot/data-actions";
const DAT_PATH = "/services/data/v65.0/ssot/data-action-targets";

// ── Types ────────────────────────────────────────────────────────────────────

export interface DataAction {
  apiName?: string;
  developerName?: string;
  masterLabel?: string;
  description?: string;
  dataspace?: string;
  dataActionTargetNames?: string[];
  dataActionSources?: Array<{ sourceName?: string; [key: string]: unknown }>;
  status?: string;
  createdDate?: string;
  lastModifiedDate?: string;
  [key: string]: unknown;
}

export interface DataActionTarget {
  apiName?: string;
  label?: string;
  type?: string;   // "WebHook" etc.
  config?: Record<string, unknown>;
  status?: string;
  createdDate?: string;
  lastModifiedDate?: string;
  [key: string]: unknown;
}

// ── GET data actions ──────────────────────────────────────────────────────────

export async function fetchDataActions(
  limit = 100,
  dataspace?: string
): Promise<DataAction[]> {
  const client = await getDCClient();
  console.error(`[da] GET ${client.defaults.baseURL}${DA_PATH}`);

  try {
    const params: Record<string, unknown> = { batchSize: limit };
    if (dataspace) params.dataspace = dataspace;

    const response = await client.get<unknown>(DA_PATH, { params });
    console.error(`[da] HTTP ${response.status}`);
    console.error(`[da] body: ${JSON.stringify(response.data).slice(0, 800)}`);

    const raw = response.data;
    if (Array.isArray(raw)) return raw;

    if (raw && typeof raw === "object") {
      const obj = raw as Record<string, unknown>;
      for (const key of ["dataActions", "data", "items", "records", "results"]) {
        const val = obj[key];
        if (Array.isArray(val)) return val as DataAction[];
      }
      return [obj as DataAction];
    }

    return [];
  } catch (err) {
    if ((err as { isAxiosError?: boolean }).isAxiosError) {
      const e = err as { response?: { data?: unknown; status?: number }; message: string };
      throw new Error(
        `Failed to list data actions (HTTP ${e.response?.status ?? "unknown"}): ${JSON.stringify(e.response?.data ?? e.message)}`
      );
    }
    throw err;
  }
}

// ── GET data action targets (list) ────────────────────────────────────────────

export async function fetchDataActionTargets(limit = 100): Promise<DataActionTarget[]> {
  const client = await getDCClient();
  console.error(`[dat] GET ${client.defaults.baseURL}${DAT_PATH}`);

  try {
    const response = await client.get<unknown>(DAT_PATH, { params: { batchSize: limit } });
    console.error(`[dat] HTTP ${response.status}`);
    console.error(`[dat] body: ${JSON.stringify(response.data).slice(0, 800)}`);

    const raw = response.data;
    if (Array.isArray(raw)) return raw;

    if (raw && typeof raw === "object") {
      const obj = raw as Record<string, unknown>;
      for (const key of ["dataActionTargets", "data", "items", "records", "results"]) {
        const val = obj[key];
        if (Array.isArray(val)) return val as DataActionTarget[];
      }
      return [obj as DataActionTarget];
    }

    return [];
  } catch (err) {
    if ((err as { isAxiosError?: boolean }).isAxiosError) {
      const e = err as { response?: { data?: unknown; status?: number }; message: string };
      throw new Error(
        `Failed to list data action targets (HTTP ${e.response?.status ?? "unknown"}): ${JSON.stringify(e.response?.data ?? e.message)}`
      );
    }
    throw err;
  }
}

// ── GET single data action target ─────────────────────────────────────────────

export async function fetchDataActionTarget(apiName: string): Promise<DataActionTarget> {
  const client = await getDCClient();
  const url = `${DAT_PATH}/${encodeURIComponent(apiName)}`;
  console.error(`[dat] GET ${client.defaults.baseURL}${url}`);

  try {
    const response = await client.get<DataActionTarget>(url);
    console.error(`[dat] HTTP ${response.status}`);
    console.error(`[dat] body: ${JSON.stringify(response.data).slice(0, 800)}`);
    return response.data;
  } catch (err) {
    if ((err as { isAxiosError?: boolean }).isAxiosError) {
      const e = err as { response?: { data?: unknown; status?: number }; message: string };
      throw new Error(
        `Failed to get data action target "${apiName}" (HTTP ${e.response?.status ?? "unknown"}): ${JSON.stringify(e.response?.data ?? e.message)}`
      );
    }
    throw err;
  }
}
