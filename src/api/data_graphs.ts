import { getDCClient } from "./client.js";

const DG_PATH = "/services/data/v65.0/ssot/data-graphs";

// ── Types ────────────────────────────────────────────────────────────────────

export interface DataGraphField {
  developerName?: string;
  name?: string;
  label?: string;
  dataType?: string;
  data_type?: string;
  isKeyColumn?: boolean;
  isProjected?: boolean;
  sourceFieldLabel?: string;
  sourceFieldName?: string;
  usageTag?: string;
  lookupCol?: string;
  length?: string;
  keyCol?: string;
  [key: string]: unknown;
}

export interface DataGraphRelatedObject {
  developerName?: string;
  type?: string;
  memberDmoName?: string;
  paths?: Array<{ fieldName?: string; parentFieldName?: string; cardinality?: string; [key: string]: unknown }>;
  fields?: DataGraphField[];
  recencyCriteria?: Record<string, unknown>;
  relatedObjects?: DataGraphRelatedObject[];
  [key: string]: unknown;
}

export interface DataGraphObject {
  developerName?: string;
  type?: string;
  fields?: DataGraphField[];
  relatedObjects?: DataGraphRelatedObject[];
  [key: string]: unknown;
}

export interface DataGraphMetadata {
  developerName?: string;
  description?: string;
  valuesDmoName?: string;
  idDmoName?: string;
  dataspaceName?: string;
  status?: string;
  primaryObjectName?: string;
  primaryObjectType?: string;
  dgObject?: DataGraphObject;
  extendedProperties?: string;
  version?: string;
  [key: string]: unknown;
}

export interface DataGraph {
  id?: string;
  name?: string;
  label?: string;
  description?: string;
  dataspaceName?: string;
  status?: string;
  kind?: string;
  type?: string;
  version?: string;
  lastRunStatus?: string;
  primaryObjectName?: string;
  primaryObjectLabel?: string;
  idDmoName?: string;
  idDmoLabel?: string;
  valuesDmoName?: string;
  valuesDmoLabel?: string;
  sourceObject?: Record<string, unknown>;
  createdBy?: string;
  createdDate?: string;
  modifiedBy?: string;
  modifiedDate?: string;
  [key: string]: unknown;
}

// ── GET metadata list ─────────────────────────────────────────────────────────

export async function fetchDataGraphsMetadata(
  dataspace?: string,
  dataGraphEntityName?: string
): Promise<DataGraphMetadata[]> {
  const client = await getDCClient();
  const url = `${DG_PATH}/metadata`;
  console.error(`[dg] GET ${client.defaults.baseURL}${url}`);

  try {
    const params: Record<string, string> = {};
    if (dataspace) params.dataspace = dataspace;
    if (dataGraphEntityName) params.dataGraphEntityName = dataGraphEntityName;

    const response = await client.get<unknown>(url, { params });
    console.error(`[dg] HTTP ${response.status}`);
    console.error(`[dg] body: ${JSON.stringify(response.data).slice(0, 800)}`);

    const raw = response.data;
    if (Array.isArray(raw)) return raw;

    if (raw && typeof raw === "object") {
      const obj = raw as Record<string, unknown>;
      for (const key of ["dataGraphs", "data", "items", "records", "results"]) {
        const val = obj[key];
        if (Array.isArray(val)) return val as DataGraphMetadata[];
      }
      // Single object returned
      return [obj as DataGraphMetadata];
    }

    return [];
  } catch (err) {
    if ((err as { isAxiosError?: boolean }).isAxiosError) {
      const e = err as { response?: { data?: unknown; status?: number }; message: string };
      throw new Error(
        `Failed to list data graph metadata (HTTP ${e.response?.status ?? "unknown"}): ${JSON.stringify(e.response?.data ?? e.message)}`
      );
    }
    throw err;
  }
}

// ── GET single ────────────────────────────────────────────────────────────────

export async function fetchDataGraph(dataGraphName: string): Promise<DataGraph> {
  const client = await getDCClient();
  const url = `${DG_PATH}/${encodeURIComponent(dataGraphName)}`;
  console.error(`[dg] GET ${client.defaults.baseURL}${url}`);

  try {
    const response = await client.get<DataGraph>(url);
    console.error(`[dg] HTTP ${response.status}`);
    console.error(`[dg] body: ${JSON.stringify(response.data).slice(0, 800)}`);
    return response.data;
  } catch (err) {
    if ((err as { isAxiosError?: boolean }).isAxiosError) {
      const e = err as { response?: { data?: unknown; status?: number }; message: string };
      throw new Error(
        `Failed to get data graph "${dataGraphName}" (HTTP ${e.response?.status ?? "unknown"}): ${JSON.stringify(e.response?.data ?? e.message)}`
      );
    }
    throw err;
  }
}

// ── GET data graph data by lookup ─────────────────────────────────────────────

export async function fetchDataGraphDataByLookup(entityName: string, lookupKeys: string[]): Promise<unknown> {
  const client = await getDCClient();
  const url = `${DG_PATH}/data/${encodeURIComponent(entityName)}`;
  console.error(`[dg] GET ${client.defaults.baseURL}${url}`);

  try {
    const params = new URLSearchParams();
    for (const key of lookupKeys) {
      params.append("lookupKeys", key);
    }
    const response = await client.get<unknown>(url, { params });
    console.error(`[dg] HTTP ${response.status}`);
    console.error(`[dg] body: ${JSON.stringify(response.data).slice(0, 800)}`);
    return response.data;
  } catch (err) {
    if ((err as { isAxiosError?: boolean }).isAxiosError) {
      const e = err as { response?: { data?: unknown; status?: number }; message: string };
      throw new Error(
        `Failed to get data graph data by lookup for "${entityName}" (HTTP ${e.response?.status ?? "unknown"}): ${JSON.stringify(e.response?.data ?? e.message)}`
      );
    }
    throw err;
  }
}

// ── GET data graph data by ID ─────────────────────────────────────────────────

export async function fetchDataGraphDataById(
  entityName: string,
  id: string,
  dataspace?: string,
  live = false
): Promise<unknown> {
  const client = await getDCClient();
  const url = `${DG_PATH}/data/${encodeURIComponent(entityName)}/${encodeURIComponent(id)}`;
  console.error(`[dg] GET ${client.defaults.baseURL}${url}`);

  try {
    const params: Record<string, unknown> = { live };
    if (dataspace) params.dataspace = dataspace;

    const response = await client.get<unknown>(url, { params });
    console.error(`[dg] HTTP ${response.status}`);
    console.error(`[dg] body: ${JSON.stringify(response.data).slice(0, 800)}`);
    return response.data;
  } catch (err) {
    if ((err as { isAxiosError?: boolean }).isAxiosError) {
      const e = err as { response?: { data?: unknown; status?: number }; message: string };
      throw new Error(
        `Failed to get data graph data by ID "${id}" for "${entityName}" (HTTP ${e.response?.status ?? "unknown"}): ${JSON.stringify(e.response?.data ?? e.message)}`
      );
    }
    throw err;
  }
}
