import { getDCClient } from "./client.js";

const INSIGHT_META_PATH = "/services/data/v65.0/ssot/insight/metadata";
const INSIGHT_DATA_PATH = "/services/data/v65.0/ssot/insight/calculated-insights";

// ── Types ────────────────────────────────────────────────────────────────────

export interface InsightMetadata {
  name?: string;
  label?: string;
  [key: string]: unknown;
}

export interface InsightData {
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

// ── GET insight metadata (list) ───────────────────────────────────────────────

export async function fetchInsightMetadata(limit = 100): Promise<InsightMetadata[]> {
  const client = await getDCClient();
  console.error(`[insights] GET ${client.defaults.baseURL}${INSIGHT_META_PATH}`);

  try {
    const response = await client.get<unknown>(INSIGHT_META_PATH, { params: { limit } });
    console.error(`[insights] HTTP ${response.status}`);
    console.error(`[insights] body: ${JSON.stringify(response.data).slice(0, 800)}`);
    return extractArray<InsightMetadata>(response.data, ["metadata", "calculatedInsights", "data", "items", "records", "results"]);
  } catch (err) {
    if ((err as { isAxiosError?: boolean }).isAxiosError) {
      const e = err as { response?: { data?: unknown; status?: number }; message: string };
      throw new Error(
        `Failed to list insight metadata (HTTP ${e.response?.status ?? "unknown"}): ${JSON.stringify(e.response?.data ?? e.message)}`
      );
    }
    throw err;
  }
}

// ── GET insight metadata by name ──────────────────────────────────────────────

export async function fetchInsightMetadataByName(ciName: string): Promise<InsightMetadata> {
  const client = await getDCClient();
  const url = `${INSIGHT_META_PATH}/${encodeURIComponent(ciName)}`;
  console.error(`[insights] GET ${client.defaults.baseURL}${url}`);

  try {
    const response = await client.get<InsightMetadata>(url);
    console.error(`[insights] HTTP ${response.status}`);
    console.error(`[insights] body: ${JSON.stringify(response.data).slice(0, 800)}`);
    return response.data;
  } catch (err) {
    if ((err as { isAxiosError?: boolean }).isAxiosError) {
      const e = err as { response?: { data?: unknown; status?: number }; message: string };
      throw new Error(
        `Failed to get insight metadata "${ciName}" (HTTP ${e.response?.status ?? "unknown"}): ${JSON.stringify(e.response?.data ?? e.message)}`
      );
    }
    throw err;
  }
}

// ── GET insight data ──────────────────────────────────────────────────────────

export async function fetchInsightData(
  ciName: string,
  dimensions?: string,
  measures?: string,
  filters?: string,
  limit = 100
): Promise<InsightData[]> {
  const client = await getDCClient();
  const url = `${INSIGHT_DATA_PATH}/${encodeURIComponent(ciName)}`;
  console.error(`[insights] GET ${client.defaults.baseURL}${url}`);

  try {
    const params: Record<string, unknown> = { batchSize: limit };
    if (dimensions) params.dimensions = dimensions;
    if (measures) params.measures = measures;
    if (filters) params.filters = filters;

    const response = await client.get<unknown>(url, { params });
    console.error(`[insights] HTTP ${response.status}`);
    console.error(`[insights] body: ${JSON.stringify(response.data).slice(0, 800)}`);
    return extractArray<InsightData>(response.data, ["data", "records", "items", "results"]);
  } catch (err) {
    if ((err as { isAxiosError?: boolean }).isAxiosError) {
      const e = err as { response?: { data?: unknown; status?: number }; message: string };
      throw new Error(
        `Failed to get insight data for "${ciName}" (HTTP ${e.response?.status ?? "unknown"}): ${JSON.stringify(e.response?.data ?? e.message)}`
      );
    }
    throw err;
  }
}
