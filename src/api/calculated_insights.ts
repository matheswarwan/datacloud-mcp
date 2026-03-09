import { getDCClient } from "./client.js";

const CI_PATH = "/services/data/v65.0/ssot/calculated-insights";

// ── Types ────────────────────────────────────────────────────────────────────

export interface CalculatedInsight {
  calculatedInsightName?: string;
  name?: string;
  label?: string;
  description?: string;
  status?: string;
  sql?: string;
  [key: string]: unknown;
}

interface CIListResponse {
  collection?: { count?: number };
  items?: CalculatedInsight[];
  nextPageToken?: string | null;
  nextPageUrl?: string | null;
  previousPageToken?: string | null;
  previousPageUrl?: string | null;
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

    // Check collection.count — if 0 or missing, no CIs exist
    const count = raw?.collection?.count;
    if (count !== undefined && count === 0) {
      console.error(`[ci] collection.count is 0 — no calculated insights`);
      return [];
    }

    // Primary path: items array
    if (Array.isArray(raw?.items) && raw.items.length > 0) {
      console.error(`[ci] Found ${raw.items.length} item(s) in response`);

      // Fetch full detail for each CI if items only contain summary fields
      const items = raw.items;
      const detailed = await Promise.all(
        items.map(async (ci) => {
          const ciName = ci.calculatedInsightName ?? ci.name;
          if (!ciName) return ci;
          try {
            return await fetchCalculatedInsight(ciName);
          } catch {
            return ci; // fall back to summary if detail fetch fails
          }
        })
      );
      return detailed;
    }

    console.error(`[ci] No items found in response`);
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
