import { getDCClient } from "./client.js";

const DMO_METADATA_PATH = "/services/data/v65.0/ssot/data-model-objects";
const PAGE_SIZE = 50;

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

function extractPage(raw: DmoMetadataResponse | DmoObject[]): DmoObject[] {
  return Array.isArray(raw)
    ? raw
    : ((raw.dataModelObject ?? raw.metadata ?? raw.data ?? []) as DmoObject[]);
}

export async function fetchDmoMetadata(forceRefresh = false): Promise<DmoObject[]> {
  if (_cache && !forceRefresh) return _cache;

  const client = await getDCClient();
  const all: DmoObject[] = [];
  let offset = 0;

  try {
    while (true) {
      const url = `${DMO_METADATA_PATH}?offset=${offset}`;
      console.error(`[dmo] GET ${client.defaults.baseURL}${url}`);
      const response = await client.get<DmoMetadataResponse>(url);
      console.error(`[dmo] Response status: ${response.status}`);

      const page = extractPage(response.data);
      all.push(...page);
      console.error(`[dmo] Fetched ${page.length} DMOs at offset ${offset} (total so far: ${all.length})`);

      if (page.length < PAGE_SIZE) break;
      offset += PAGE_SIZE;
    }

    _cache = all;
    console.error(`[dmo] Cached ${_cache.length} DMO objects total`);
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
