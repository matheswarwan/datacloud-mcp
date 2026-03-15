import { getDCClient } from "./client.js";

const DP_PATH = "/services/data/v65.0/ssot/document-processing";

// ── Types ────────────────────────────────────────────────────────────────────

export interface DocumentProcessingConfig {
  id?: string;
  apiName?: string;
  name?: string;
  label?: string;
  status?: string;
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

// ── GET document processing configs (list) ────────────────────────────────────

export async function fetchDocumentProcessingConfigs(limit = 100): Promise<DocumentProcessingConfig[]> {
  const url = `${DP_PATH}/configurations`;
  const client = await getDCClient();
  console.error(`[doc_proc] GET ${client.defaults.baseURL}${url}`);

  try {
    const response = await client.get<unknown>(url, { params: { limit } });
    console.error(`[doc_proc] HTTP ${response.status}`);
    console.error(`[doc_proc] body: ${JSON.stringify(response.data).slice(0, 800)}`);
    return extractArray<DocumentProcessingConfig>(response.data, ["configurations", "data", "items", "records", "results"]);
  } catch (err) {
    if ((err as { isAxiosError?: boolean }).isAxiosError) {
      const e = err as { response?: { data?: unknown; status?: number }; message: string };
      throw new Error(
        `Failed to list document processing configurations (HTTP ${e.response?.status ?? "unknown"}): ${JSON.stringify(e.response?.data ?? e.message)}`
      );
    }
    throw err;
  }
}

// ── GET document processing config (single) ───────────────────────────────────

export async function fetchDocumentProcessingConfig(idOrApiName: string): Promise<DocumentProcessingConfig> {
  const client = await getDCClient();
  const url = `${DP_PATH}/configurations/${encodeURIComponent(idOrApiName)}`;
  console.error(`[doc_proc] GET ${client.defaults.baseURL}${url}`);

  try {
    const response = await client.get<DocumentProcessingConfig>(url);
    console.error(`[doc_proc] HTTP ${response.status}`);
    console.error(`[doc_proc] body: ${JSON.stringify(response.data).slice(0, 800)}`);
    return response.data;
  } catch (err) {
    if ((err as { isAxiosError?: boolean }).isAxiosError) {
      const e = err as { response?: { data?: unknown; status?: number }; message: string };
      throw new Error(
        `Failed to get document processing configuration "${idOrApiName}" (HTTP ${e.response?.status ?? "unknown"}): ${JSON.stringify(e.response?.data ?? e.message)}`
      );
    }
    throw err;
  }
}

// ── GET document processing global config ─────────────────────────────────────

export async function fetchDocumentProcessingGlobalConfig(): Promise<unknown> {
  const client = await getDCClient();
  const url = `${DP_PATH}/global-config`;
  console.error(`[doc_proc] GET ${client.defaults.baseURL}${url}`);

  try {
    const response = await client.get<unknown>(url);
    console.error(`[doc_proc] HTTP ${response.status}`);
    console.error(`[doc_proc] body: ${JSON.stringify(response.data).slice(0, 800)}`);
    return response.data;
  } catch (err) {
    if ((err as { isAxiosError?: boolean }).isAxiosError) {
      const e = err as { response?: { data?: unknown; status?: number }; message: string };
      throw new Error(
        `Failed to get document processing global config (HTTP ${e.response?.status ?? "unknown"}): ${JSON.stringify(e.response?.data ?? e.message)}`
      );
    }
    throw err;
  }
}
