import { getDCClient } from "./client.js";

const DATA_TRANSFORMS_PATH = "/services/data/v65.0/ssot/data-transforms";

export type DataTransform = Record<string, unknown>;

export interface SqlDefinition {
  type: "SQL";
  version: string;
  expression: string;
  targetDlo: string;
}

export interface StlNode {
  action: string;
  parameters: Record<string, unknown>;
  sources: string[];
}

export interface StlDefinition {
  type: "STL";
  version: string;
  nodes: Record<string, StlNode>;
}

export type DataTransformDefinition = SqlDefinition | StlDefinition;

export interface DataTransformPayload {
  name: string;
  label: string;
  type: "STREAMING" | "BATCH";
  definition: DataTransformDefinition;
}

export interface DataTransformsResponse {
  data?: DataTransform[];
  dataTransforms?: DataTransform[];
  items?: DataTransform[];
  [key: string]: unknown;
}

function extractTransforms(raw: unknown): DataTransform[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object") {
    const r = raw as Record<string, unknown>;
    for (const key of ["data", "dataTransforms", "items", "records", "results"]) {
      if (Array.isArray(r[key])) return r[key] as DataTransform[];
    }
    return [r as DataTransform];
  }
  return [];
}

export async function createDataTransform(payload: DataTransformPayload): Promise<DataTransform> {
  const client = await getDCClient();
  console.error(`[data_transforms] POST ${client.defaults.baseURL}${DATA_TRANSFORMS_PATH}`);

  try {
    const response = await client.post<DataTransform>(DATA_TRANSFORMS_PATH, payload);
    console.error(`[data_transforms] POST HTTP ${response.status}`);
    return response.data;
  } catch (err) {
    if ((err as { isAxiosError?: boolean }).isAxiosError) {
      const axiosErr = err as { response?: { data?: unknown; status?: number }; message: string };
      const status = axiosErr.response?.status;
      const detail = axiosErr.response?.data
        ? JSON.stringify(axiosErr.response.data)
        : axiosErr.message;
      throw new Error(`Failed to create data transform (HTTP ${status ?? "unknown"}): ${detail}`);
    }
    throw err;
  }
}

export async function updateDataTransform(nameOrId: string, payload: DataTransformPayload): Promise<DataTransform> {
  const client = await getDCClient();
  const url = `${DATA_TRANSFORMS_PATH}/${encodeURIComponent(nameOrId)}`;
  console.error(`[data_transforms] PUT ${client.defaults.baseURL}${url}`);

  try {
    const response = await client.put<DataTransform>(url, payload);
    console.error(`[data_transforms] PUT HTTP ${response.status}`);
    return response.data;
  } catch (err) {
    if ((err as { isAxiosError?: boolean }).isAxiosError) {
      const axiosErr = err as { response?: { data?: unknown; status?: number }; message: string };
      const status = axiosErr.response?.status;
      const detail = axiosErr.response?.data
        ? JSON.stringify(axiosErr.response.data)
        : axiosErr.message;
      throw new Error(`Failed to update data transform "${nameOrId}" (HTTP ${status ?? "unknown"}): ${detail}`);
    }
    throw err;
  }
}

export async function fetchDataTransforms(limit = 100): Promise<DataTransform[]> {
  const client = await getDCClient();
  const url = `${DATA_TRANSFORMS_PATH}?limit=${limit}`;
  console.error(`[data_transforms] GET ${client.defaults.baseURL}${url}`);

  try {
    const response = await client.get<unknown>(DATA_TRANSFORMS_PATH, { params: { limit } });
    console.error(`[data_transforms] HTTP ${response.status}`);
    return extractTransforms(response.data);
  } catch (err) {
    if ((err as { isAxiosError?: boolean }).isAxiosError) {
      const axiosErr = err as { response?: { data?: unknown; status?: number }; message: string };
      const status = axiosErr.response?.status;
      const detail = axiosErr.response?.data
        ? JSON.stringify(axiosErr.response.data)
        : axiosErr.message;
      throw new Error(`Failed to fetch data transforms (HTTP ${status ?? "unknown"}): ${detail}`);
    }
    throw err;
  }
}

export async function fetchDataTransform(nameOrId: string): Promise<DataTransform> {
  const client = await getDCClient();
  const url = `${DATA_TRANSFORMS_PATH}/${encodeURIComponent(nameOrId)}`;
  console.error(`[data_transforms] GET ${client.defaults.baseURL}${url}`);

  try {
    const response = await client.get<unknown>(url);
    console.error(`[data_transforms] HTTP ${response.status}`);
    const results = extractTransforms(response.data);
    return results.length > 0 ? results[0] : (response.data as DataTransform);
  } catch (err) {
    if ((err as { isAxiosError?: boolean }).isAxiosError) {
      const axiosErr = err as { response?: { data?: unknown; status?: number }; message: string };
      const status = axiosErr.response?.status;
      const detail = axiosErr.response?.data
        ? JSON.stringify(axiosErr.response.data)
        : axiosErr.message;
      throw new Error(`Failed to fetch data transform "${nameOrId}" (HTTP ${status ?? "unknown"}): ${detail}`);
    }
    throw err;
  }
}
