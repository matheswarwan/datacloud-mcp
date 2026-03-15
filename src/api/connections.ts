import { getDCClient } from "./client.js";

const CONN_PATH = "/services/data/v65.0/ssot/connections";
const CONNECTORS_PATH = "/services/data/v65.0/ssot/connectors";

// ── Types ────────────────────────────────────────────────────────────────────

export interface Connection {
  id?: string;
  name?: string;
  label?: string;
  connectorType?: string;
  status?: string;
  [key: string]: unknown;
}

export interface Connector {
  type?: string;
  name?: string;
  label?: string;
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

// ── GET connections (list) ────────────────────────────────────────────────────

export async function fetchConnections(limit = 100): Promise<Connection[]> {
  const client = await getDCClient();
  console.error(`[connections] GET ${client.defaults.baseURL}${CONN_PATH}`);

  try {
    const response = await client.get<unknown>(CONN_PATH, { params: { limit } });
    console.error(`[connections] HTTP ${response.status}`);
    console.error(`[connections] body: ${JSON.stringify(response.data).slice(0, 800)}`);
    return extractArray<Connection>(response.data, ["connections", "data", "items", "records", "results"]);
  } catch (err) {
    if ((err as { isAxiosError?: boolean }).isAxiosError) {
      const e = err as { response?: { data?: unknown; status?: number }; message: string };
      throw new Error(
        `Failed to list connections (HTTP ${e.response?.status ?? "unknown"}): ${JSON.stringify(e.response?.data ?? e.message)}`
      );
    }
    throw err;
  }
}

// ── GET connection (single) ───────────────────────────────────────────────────

export async function fetchConnection(connectionId: string): Promise<Connection> {
  const client = await getDCClient();
  const url = `${CONN_PATH}/${encodeURIComponent(connectionId)}`;
  console.error(`[connections] GET ${client.defaults.baseURL}${url}`);

  try {
    const response = await client.get<Connection>(url);
    console.error(`[connections] HTTP ${response.status}`);
    console.error(`[connections] body: ${JSON.stringify(response.data).slice(0, 800)}`);
    return response.data;
  } catch (err) {
    if ((err as { isAxiosError?: boolean }).isAxiosError) {
      const e = err as { response?: { data?: unknown; status?: number }; message: string };
      throw new Error(
        `Failed to get connection "${connectionId}" (HTTP ${e.response?.status ?? "unknown"}): ${JSON.stringify(e.response?.data ?? e.message)}`
      );
    }
    throw err;
  }
}

// ── GET connection endpoints ──────────────────────────────────────────────────

export async function fetchConnectionEndpoints(connectionId: string): Promise<unknown> {
  const client = await getDCClient();
  const url = `${CONN_PATH}/${encodeURIComponent(connectionId)}/endpoints`;
  console.error(`[connections] GET ${client.defaults.baseURL}${url}`);

  try {
    const response = await client.get<unknown>(url);
    console.error(`[connections] HTTP ${response.status}`);
    console.error(`[connections] body: ${JSON.stringify(response.data).slice(0, 800)}`);
    return response.data;
  } catch (err) {
    if ((err as { isAxiosError?: boolean }).isAxiosError) {
      const e = err as { response?: { data?: unknown; status?: number }; message: string };
      throw new Error(
        `Failed to get endpoints for connection "${connectionId}" (HTTP ${e.response?.status ?? "unknown"}): ${JSON.stringify(e.response?.data ?? e.message)}`
      );
    }
    throw err;
  }
}

// ── GET connection schema ─────────────────────────────────────────────────────

export async function fetchConnectionSchema(connectionId: string): Promise<unknown> {
  const client = await getDCClient();
  const url = `${CONN_PATH}/${encodeURIComponent(connectionId)}/schema`;
  console.error(`[connections] GET ${client.defaults.baseURL}${url}`);

  try {
    const response = await client.get<unknown>(url);
    console.error(`[connections] HTTP ${response.status}`);
    console.error(`[connections] body: ${JSON.stringify(response.data).slice(0, 800)}`);
    return response.data;
  } catch (err) {
    if ((err as { isAxiosError?: boolean }).isAxiosError) {
      const e = err as { response?: { data?: unknown; status?: number }; message: string };
      throw new Error(
        `Failed to get schema for connection "${connectionId}" (HTTP ${e.response?.status ?? "unknown"}): ${JSON.stringify(e.response?.data ?? e.message)}`
      );
    }
    throw err;
  }
}

// ── GET connectors (list) ─────────────────────────────────────────────────────

export async function fetchConnectors(limit = 100): Promise<Connector[]> {
  const client = await getDCClient();
  console.error(`[connections] GET ${client.defaults.baseURL}${CONNECTORS_PATH}`);

  try {
    const response = await client.get<unknown>(CONNECTORS_PATH, { params: { limit } });
    console.error(`[connections] HTTP ${response.status}`);
    console.error(`[connections] body: ${JSON.stringify(response.data).slice(0, 800)}`);
    return extractArray<Connector>(response.data, ["connectors", "data", "items", "records", "results"]);
  } catch (err) {
    if ((err as { isAxiosError?: boolean }).isAxiosError) {
      const e = err as { response?: { data?: unknown; status?: number }; message: string };
      throw new Error(
        `Failed to list connectors (HTTP ${e.response?.status ?? "unknown"}): ${JSON.stringify(e.response?.data ?? e.message)}`
      );
    }
    throw err;
  }
}

// ── GET connector (single) ────────────────────────────────────────────────────

export async function fetchConnector(connectorType: string): Promise<Connector> {
  const client = await getDCClient();
  const url = `${CONNECTORS_PATH}/${encodeURIComponent(connectorType)}`;
  console.error(`[connections] GET ${client.defaults.baseURL}${url}`);

  try {
    const response = await client.get<Connector>(url);
    console.error(`[connections] HTTP ${response.status}`);
    console.error(`[connections] body: ${JSON.stringify(response.data).slice(0, 800)}`);
    return response.data;
  } catch (err) {
    if ((err as { isAxiosError?: boolean }).isAxiosError) {
      const e = err as { response?: { data?: unknown; status?: number }; message: string };
      throw new Error(
        `Failed to get connector "${connectorType}" (HTTP ${e.response?.status ?? "unknown"}): ${JSON.stringify(e.response?.data ?? e.message)}`
      );
    }
    throw err;
  }
}
