import { getDCClient } from "./client.js";

const DLO_PATH = "/services/data/v65.0/ssot/data-lake-objects";

// ── Types ────────────────────────────────────────────────────────────────────

export interface DloField {
  name?: string;
  label?: string;
  dataType?: string;
  isPrimaryKey?: boolean;
  [key: string]: unknown;
}

export interface DataSpaceInfo {
  name?: string;
  label?: string;
  [key: string]: unknown;
}

export interface DataLakeObject {
  id?: string;
  name?: string;
  label?: string;
  category?: string;
  status?: string;
  namespace?: string;
  fields?: DloField[];
  dataLakeFieldInfoRepresentation?: DloField[];
  dataSpaceInfo?: DataSpaceInfo[];
  recordModifiedFieldName?: string;
  orgUnitIdentifierFieldName?: string;
  capabilities?: Record<string, unknown>;
  [key: string]: unknown;
}

// ── GET list ─────────────────────────────────────────────────────────────────

export async function fetchDataLakeObjects(limit = 100, offset = 0): Promise<DataLakeObject[]> {
  const client = await getDCClient();
  console.error(`[dlo] GET ${client.defaults.baseURL}${DLO_PATH}`);

  try {
    const response = await client.get<unknown>(DLO_PATH, { params: { limit, offset } });
    console.error(`[dlo] HTTP ${response.status}`);
    console.error(`[dlo] body: ${JSON.stringify(response.data).slice(0, 800)}`);

    const raw = response.data;
    if (Array.isArray(raw)) return raw;

    if (raw && typeof raw === "object") {
      const obj = raw as Record<string, unknown>;
      for (const key of ["dataLakeObjects", "data", "items", "records", "results"]) {
        const val = obj[key];
        if (Array.isArray(val)) return val as DataLakeObject[];
      }
      return [obj as DataLakeObject];
    }

    return [];
  } catch (err) {
    if ((err as { isAxiosError?: boolean }).isAxiosError) {
      const e = err as { response?: { data?: unknown; status?: number }; message: string };
      throw new Error(
        `Failed to list data lake objects (HTTP ${e.response?.status ?? "unknown"}): ${JSON.stringify(e.response?.data ?? e.message)}`
      );
    }
    throw err;
  }
}

// ── GET one ──────────────────────────────────────────────────────────────────

export async function fetchDataLakeObject(nameOrId: string): Promise<DataLakeObject> {
  const client = await getDCClient();
  const url = `${DLO_PATH}/${encodeURIComponent(nameOrId)}`;
  console.error(`[dlo] GET ${client.defaults.baseURL}${url}`);

  try {
    const response = await client.get<DataLakeObject>(url);
    console.error(`[dlo] HTTP ${response.status}`);
    console.error(`[dlo] body: ${JSON.stringify(response.data).slice(0, 800)}`);
    return response.data;
  } catch (err) {
    if ((err as { isAxiosError?: boolean }).isAxiosError) {
      const e = err as { response?: { data?: unknown; status?: number }; message: string };
      throw new Error(
        `Failed to get data lake object "${nameOrId}" (HTTP ${e.response?.status ?? "unknown"}): ${JSON.stringify(e.response?.data ?? e.message)}`
      );
    }
    throw err;
  }
}
