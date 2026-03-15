import { getDCClient } from "./client.js";

const QUERY_PATH = "/services/data/v65.0/ssot/query-sql";

// ── Types ────────────────────────────────────────────────────────────────────

export interface QueryJob {
  queryId?: string;
  id?: string;
  status?: string;
  [key: string]: unknown;
}

export interface QueryResult {
  rows?: unknown[];
  data?: unknown[];
  [key: string]: unknown;
}

// ── POST submit SQL query ─────────────────────────────────────────────────────

export async function submitSqlQuery(sql: string, dataspace?: string): Promise<QueryJob> {
  const client = await getDCClient();
  console.error(`[query] POST ${client.defaults.baseURL}${QUERY_PATH}`);

  try {
    const body: Record<string, unknown> = { sql };
    if (dataspace) body.dataspace = dataspace;

    const response = await client.post<QueryJob>(QUERY_PATH, body);
    console.error(`[query] HTTP ${response.status}`);
    console.error(`[query] body: ${JSON.stringify(response.data).slice(0, 800)}`);
    return response.data;
  } catch (err) {
    if ((err as { isAxiosError?: boolean }).isAxiosError) {
      const e = err as { response?: { data?: unknown; status?: number }; message: string };
      throw new Error(
        `Failed to submit SQL query (HTTP ${e.response?.status ?? "unknown"}): ${JSON.stringify(e.response?.data ?? e.message)}`
      );
    }
    throw err;
  }
}

// ── GET SQL query status ──────────────────────────────────────────────────────

export async function fetchSqlQueryStatus(queryId: string, dataspace?: string): Promise<QueryJob> {
  const client = await getDCClient();
  const url = `${QUERY_PATH}/${encodeURIComponent(queryId)}`;
  console.error(`[query] GET ${client.defaults.baseURL}${url}`);

  try {
    const params: Record<string, unknown> = {};
    if (dataspace) params.dataspace = dataspace;

    const response = await client.get<QueryJob>(url, { params });
    console.error(`[query] HTTP ${response.status}`);
    console.error(`[query] body: ${JSON.stringify(response.data).slice(0, 800)}`);
    return response.data;
  } catch (err) {
    if ((err as { isAxiosError?: boolean }).isAxiosError) {
      const e = err as { response?: { data?: unknown; status?: number }; message: string };
      throw new Error(
        `Failed to get query status "${queryId}" (HTTP ${e.response?.status ?? "unknown"}): ${JSON.stringify(e.response?.data ?? e.message)}`
      );
    }
    throw err;
  }
}

// ── GET SQL query rows ────────────────────────────────────────────────────────

export async function fetchSqlQueryRows(queryId: string, rowLimit = 1000, offset = 0, dataspace?: string): Promise<QueryResult> {
  const client = await getDCClient();
  const url = `${QUERY_PATH}/${encodeURIComponent(queryId)}/rows`;
  console.error(`[query] GET ${client.defaults.baseURL}${url}`);

  try {
    const params: Record<string, unknown> = { rowLimit, offset };
    if (dataspace) params.dataspace = dataspace;

    const response = await client.get<QueryResult>(url, { params });
    console.error(`[query] HTTP ${response.status}`);
    console.error(`[query] body: ${JSON.stringify(response.data).slice(0, 800)}`);
    return response.data;
  } catch (err) {
    if ((err as { isAxiosError?: boolean }).isAxiosError) {
      const e = err as { response?: { data?: unknown; status?: number }; message: string };
      throw new Error(
        `Failed to get query rows for "${queryId}" (HTTP ${e.response?.status ?? "unknown"}): ${JSON.stringify(e.response?.data ?? e.message)}`
      );
    }
    throw err;
  }
}
