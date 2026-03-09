import { getDCClient } from "./client.js";

const DMO_METADATA_PATH = "/services/data/v65.0/ssot/data-model-objects";

export interface DmoField {
  name: string;
  label?: string;
  type?: string;        // API returns "type" not "dataType"
  dataType?: string;    // kept for compatibility
  isPrimaryKey?: boolean;
  isDistinct?: boolean;
  creationType?: string;
  usageTag?: string;
  [key: string]: unknown;
}

export interface DmoObject {
  name?: string;
  label?: string;
  category?: string;
  creationType?: string;
  dataSpaceName?: string;
  fields?: DmoField[];
  [key: string]: unknown;
}

export interface DmoMetadataResponse {
  dataModelObject?: DmoObject[];
  metadata?: DmoObject[];
  data?: DmoObject[];
  [key: string]: unknown;
}

// ── In-memory cache ──────────────────────────────────────────────────────────
let _cache: DmoObject[] | null = null;

export async function fetchDmoMetadata(forceRefresh = false): Promise<DmoObject[]> {
  if (_cache && !forceRefresh) return _cache;

  const client = await getDCClient();
  const fullUrl = `${client.defaults.baseURL}${DMO_METADATA_PATH}`;
  console.error(`[dmo] GET ${fullUrl}`);
  try {
    const response = await client.get<DmoMetadataResponse>(DMO_METADATA_PATH);
    console.error(`[dmo] Response status: ${response.status}`);
    console.error(`[dmo] Response body: ${JSON.stringify(response.data).slice(0, 500)}`);
    // The API may return { metadata: [...] } or directly an array — handle both
    const raw = response.data;
    _cache = Array.isArray(raw)
      ? raw
      : ((raw.dataModelObject ?? raw.metadata ?? raw.data ?? []) as DmoObject[]);
    console.error(`[dmo] Cached ${_cache.length} DMO objects`);
    return _cache;
  } catch (err) {
    if ((err as { isAxiosError?: boolean }).isAxiosError) {
      const axiosErr = err as { response?: { data?: unknown; status?: number }; message: string };
      const status = axiosErr.response?.status;
      const detail = axiosErr.response?.data
        ? JSON.stringify(axiosErr.response.data)
        : axiosErr.message;
      throw new Error(`Failed to fetch DMO metadata (HTTP ${status ?? "unknown"}): ${detail}`);
    }
    throw err;
  }
}

export function getDmoCacheSnapshot(): DmoObject[] | null {
  return _cache;
}

export function invalidateDmoCache(): void {
  _cache = null;
}
