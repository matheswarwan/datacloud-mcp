import { getDCClient } from "./client.js";

const CI_PATH = "/services/data/v65.0/ssot/calculated-insights";

// ── Types ────────────────────────────────────────────────────────────────────

export interface CalculatedInsightField {
  apiName: string;
  displayName?: string;
  dataType?: string;
  fieldRole?: string;        // "DIMENSION" | "MEASURE"
  formula?: string;
  dateGranularity?: string | null;
  fieldAggregationType?: string;
  dataSource?: { sourceApiName?: string; type?: string };
  creationType?: string;
  [key: string]: unknown;
}

export interface CalculatedInsight {
  apiName?: string;
  displayName?: string;
  description?: string;
  calculatedInsightStatus?: string;  // "ACTIVE" | "INACTIVE" etc.
  definitionStatus?: string;         // "IN_USE" | "DRAFT" etc.
  definitionType?: string;           // "HISTORY_METRIC" | "METRIC" etc.
  expression?: string;               // the SQL query
  isEnabled?: boolean;
  dataSpace?: string;
  creationType?: string;
  dimensions?: CalculatedInsightField[];
  measures?: CalculatedInsightField[];
  lastRunStatus?: string;
  lastRunDateTime?: string;
  lastRunStatusDateTime?: string;
  lastRunStatusErrorCode?: string | null;
  publishScheduleInterval?: string;
  [key: string]: unknown;
}

interface CICollection {
  count?: number;
  total?: number;
  currentPageToken?: string;
  currentPageUrl?: string;
  items?: CalculatedInsight[];
  nextPageToken?: string | null;
  nextPageUrl?: string | null;
  previousPageToken?: string | null;
  previousPageUrl?: string | null;
}

interface CIListResponse {
  collection?: CICollection;
  [key: string]: unknown;
}

export interface CreateCIPayload {
  calculatedInsightName: string;
  label?: string;
  description?: string;
  sql: string;
}

// ── GET all ──────────────────────────────────────────────────────────────────

export async function fetchCalculatedInsights(): Promise<CalculatedInsight[]> {
  const client = await getDCClient();
  console.error(`[ci] GET ${client.defaults.baseURL}${CI_PATH}`);

  try {
    const response = await client.get<CIListResponse>(CI_PATH);
    console.error(`[ci] HTTP ${response.status}`);
    console.error(`[ci] body: ${JSON.stringify(response.data).slice(0, 800)}`);

    const raw = response.data;
    const collection = raw?.collection;

    // Check count — if 0, no CIs exist
    const count = collection?.count ?? collection?.total;
    if (count !== undefined && count === 0) {
      console.error(`[ci] collection.count is 0 — no calculated insights`);
      return [];
    }

    // Items live at collection.items
    const items = collection?.items;
    if (Array.isArray(items) && items.length > 0) {
      console.error(`[ci] Found ${items.length} of ${count ?? "?"} calculated insight(s)`);
      return items;
    }

    console.error(`[ci] No items found in collection`);
    return [];
  } catch (err) {
    if ((err as { isAxiosError?: boolean }).isAxiosError) {
      const e = err as { response?: { data?: unknown; status?: number }; message: string };
      throw new Error(`Failed to list calculated insights (HTTP ${e.response?.status ?? "unknown"}): ${JSON.stringify(e.response?.data ?? e.message)}`);
    }
    throw err;
  }
}

// ── GET one ──────────────────────────────────────────────────────────────────

export async function fetchCalculatedInsight(name: string): Promise<CalculatedInsight> {
  const client = await getDCClient();
  const url = `${CI_PATH}/${encodeURIComponent(name)}`;
  console.error(`[ci] GET ${client.defaults.baseURL}${url}`);

  try {
    const response = await client.get<CalculatedInsight>(url);
    console.error(`[ci] HTTP ${response.status}`);
    console.error(`[ci] body: ${JSON.stringify(response.data).slice(0, 800)}`);
    return response.data;
  } catch (err) {
    if ((err as { isAxiosError?: boolean }).isAxiosError) {
      const e = err as { response?: { data?: unknown; status?: number }; message: string };
      throw new Error(`Failed to get calculated insight "${name}" (HTTP ${e.response?.status ?? "unknown"}): ${JSON.stringify(e.response?.data ?? e.message)}`);
    }
    throw err;
  }
}

// ── POST create ──────────────────────────────────────────────────────────────

export async function createCalculatedInsight(
  payload: CreateCIPayload
): Promise<CalculatedInsight> {
  const client = await getDCClient();
  console.error(`[ci] POST ${client.defaults.baseURL}${CI_PATH}`);
  console.error(`[ci] body: ${JSON.stringify(payload)}`);

  try {
    const response = await client.post<CalculatedInsight>(CI_PATH, payload);
    console.error(`[ci] HTTP ${response.status}`);
    console.error(`[ci] response: ${JSON.stringify(response.data).slice(0, 800)}`);
    return response.data;
  } catch (err) {
    if ((err as { isAxiosError?: boolean }).isAxiosError) {
      const e = err as { response?: { data?: unknown; status?: number }; message: string };
      throw new Error(`Failed to create calculated insight (HTTP ${e.response?.status ?? "unknown"}): ${JSON.stringify(e.response?.data ?? e.message)}`);
    }
    throw err;
  }
}

// ── POST run ─────────────────────────────────────────────────────────────────
// Tries the most common run/publish patterns for Data Cloud CIs.
// We'll log the raw response so we can adjust if the endpoint name differs.

export async function runCalculatedInsight(name: string): Promise<unknown> {
  const client = await getDCClient();
  const runUrl = `${CI_PATH}/${encodeURIComponent(name)}/versions`;
  console.error(`[ci] POST ${client.defaults.baseURL}${runUrl}`);

  try {
    const response = await client.post<unknown>(runUrl, {});
    console.error(`[ci] HTTP ${response.status}`);
    console.error(`[ci] response: ${JSON.stringify(response.data).slice(0, 800)}`);
    return response.data;
  } catch (err) {
    if ((err as { isAxiosError?: boolean }).isAxiosError) {
      const e = err as { response?: { data?: unknown; status?: number }; message: string };
      throw new Error(`Failed to run calculated insight "${name}" (HTTP ${e.response?.status ?? "unknown"}): ${JSON.stringify(e.response?.data ?? e.message)}`);
    }
    throw err;
  }
}
