import { getDCClient } from "./client.js";

const IDR_PATH = "/services/data/v65.0/ssot/identity-resolutions";

// ── Types ────────────────────────────────────────────────────────────────────

export interface IdentityResolutionMatchRule {
  matchFields?: Array<{ contactPointPath?: string; [key: string]: unknown }>;
  matchType?: string;            // "EXACT" | "FUZZY" etc.
  matchingAttributeType?: string; // "EMAIL" | "PHONE" etc.
  [key: string]: unknown;
}

export interface IdentityResolutionReconciliationRule {
  fieldApiName?: string;
  objectApiName?: string;
  reconciliationType?: string;   // "MOST_RECENT" | "SOURCE_PRIORITY" etc.
  sourceObjects?: Array<{ sourceObjectName?: string; priority?: number; [key: string]: unknown }>;
  [key: string]: unknown;
}

export interface IdentityResolution {
  name?: string;
  developerName?: string;
  status?: string;
  runStatus?: string;
  matchRules?: IdentityResolutionMatchRule[];
  reconciliationRules?: IdentityResolutionReconciliationRule[];
  createdDate?: string;
  lastModifiedDate?: string;
  [key: string]: unknown;
}

// ── GET list ─────────────────────────────────────────────────────────────────

export async function fetchIdentityResolutions(limit = 100): Promise<IdentityResolution[]> {
  const client = await getDCClient();
  console.error(`[idr] GET ${client.defaults.baseURL}${IDR_PATH}`);

  try {
    const response = await client.get<unknown>(IDR_PATH, { params: { limit } });
    console.error(`[idr] HTTP ${response.status}`);
    console.error(`[idr] body: ${JSON.stringify(response.data).slice(0, 800)}`);

    const raw = response.data;
    if (Array.isArray(raw)) return raw;

    if (raw && typeof raw === "object") {
      const obj = raw as Record<string, unknown>;

      // Common envelope keys
      for (const key of ["data", "items", "records", "results", "identityResolutions"]) {
        const val = obj[key];
        if (Array.isArray(val)) return val as IdentityResolution[];
      }

      // collection.items pattern (same as CIs)
      const collection = obj["collection"];
      if (collection && typeof collection === "object") {
        const items = (collection as Record<string, unknown>)["items"];
        if (Array.isArray(items)) return items as IdentityResolution[];
      }

      return [obj as IdentityResolution];
    }

    return [];
  } catch (err) {
    if ((err as { isAxiosError?: boolean }).isAxiosError) {
      const e = err as { response?: { data?: unknown; status?: number }; message: string };
      throw new Error(
        `Failed to list identity resolutions (HTTP ${e.response?.status ?? "unknown"}): ${JSON.stringify(e.response?.data ?? e.message)}`
      );
    }
    throw err;
  }
}

// ── GET one ──────────────────────────────────────────────────────────────────

export async function fetchIdentityResolution(developerName: string): Promise<IdentityResolution> {
  const client = await getDCClient();
  const url = `${IDR_PATH}/${encodeURIComponent(developerName)}`;
  console.error(`[idr] GET ${client.defaults.baseURL}${url}`);

  try {
    const response = await client.get<IdentityResolution>(url);
    console.error(`[idr] HTTP ${response.status}`);
    console.error(`[idr] body: ${JSON.stringify(response.data).slice(0, 800)}`);
    return response.data;
  } catch (err) {
    if ((err as { isAxiosError?: boolean }).isAxiosError) {
      const e = err as { response?: { data?: unknown; status?: number }; message: string };
      throw new Error(
        `Failed to get identity resolution "${developerName}" (HTTP ${e.response?.status ?? "unknown"}): ${JSON.stringify(e.response?.data ?? e.message)}`
      );
    }
    throw err;
  }
}
