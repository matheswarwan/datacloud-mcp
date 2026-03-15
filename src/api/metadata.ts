import { getDCClient } from "./client.js";

const META_PATH = "/services/data/v65.0/ssot/metadata";

// ── Types ────────────────────────────────────────────────────────────────────

export interface MetadataEntry {
  [key: string]: unknown;
}

// ── GET metadata ──────────────────────────────────────────────────────────────

export async function fetchMetadata(
  entityType?: string,
  entityName?: string,
  entityCategory?: string,
  dataspace?: string
): Promise<MetadataEntry[]> {
  const client = await getDCClient();
  console.error(`[metadata] GET ${client.defaults.baseURL}${META_PATH}`);

  try {
    const params: Record<string, unknown> = {};
    if (entityType) params.entityType = entityType;
    if (entityName) params.entityName = entityName;
    if (entityCategory) params.entityCategory = entityCategory;
    if (dataspace) params.dataspace = dataspace;

    const response = await client.get<unknown>(META_PATH, { params });
    console.error(`[metadata] HTTP ${response.status}`);
    console.error(`[metadata] body: ${JSON.stringify(response.data).slice(0, 800)}`);

    const raw = response.data;
    if (Array.isArray(raw)) return raw;

    if (raw && typeof raw === "object") {
      const obj = raw as Record<string, unknown>;
      for (const key of ["metadata", "data", "items", "records", "results"]) {
        const val = obj[key];
        if (Array.isArray(val)) return val as MetadataEntry[];
      }
      return [obj as MetadataEntry];
    }

    return [];
  } catch (err) {
    if ((err as { isAxiosError?: boolean }).isAxiosError) {
      const e = err as { response?: { data?: unknown; status?: number }; message: string };
      throw new Error(
        `Failed to fetch metadata (HTTP ${e.response?.status ?? "unknown"}): ${JSON.stringify(e.response?.data ?? e.message)}`
      );
    }
    throw err;
  }
}
