import { getDCClient } from "./client.js";

const ML_PATH = "/services/data/v65.0/ssot/machine-learning";

// ── Types ────────────────────────────────────────────────────────────────────

export interface ConfiguredModel {
  id?: string;
  name?: string;
  label?: string;
  modelType?: string;
  status?: string;
  [key: string]: unknown;
}

export interface ModelArtifact {
  id?: string;
  name?: string;
  label?: string;
  modelType?: string;
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

// ── GET configured models (list) ──────────────────────────────────────────────

export async function fetchConfiguredModels(limit = 100): Promise<ConfiguredModel[]> {
  const url = `${ML_PATH}/configured-models`;
  const client = await getDCClient();
  console.error(`[ml] GET ${client.defaults.baseURL}${url}`);

  try {
    const response = await client.get<unknown>(url, { params: { limit } });
    console.error(`[ml] HTTP ${response.status}`);
    console.error(`[ml] body: ${JSON.stringify(response.data).slice(0, 800)}`);
    return extractArray<ConfiguredModel>(response.data, ["configuredModels", "data", "items", "records", "results"]);
  } catch (err) {
    if ((err as { isAxiosError?: boolean }).isAxiosError) {
      const e = err as { response?: { data?: unknown; status?: number }; message: string };
      throw new Error(
        `Failed to list configured models (HTTP ${e.response?.status ?? "unknown"}): ${JSON.stringify(e.response?.data ?? e.message)}`
      );
    }
    throw err;
  }
}

// ── GET configured model (single) ─────────────────────────────────────────────

export async function fetchConfiguredModel(idOrName: string): Promise<ConfiguredModel> {
  const client = await getDCClient();
  const url = `${ML_PATH}/configured-models/${encodeURIComponent(idOrName)}`;
  console.error(`[ml] GET ${client.defaults.baseURL}${url}`);

  try {
    const response = await client.get<ConfiguredModel>(url);
    console.error(`[ml] HTTP ${response.status}`);
    console.error(`[ml] body: ${JSON.stringify(response.data).slice(0, 800)}`);
    return response.data;
  } catch (err) {
    if ((err as { isAxiosError?: boolean }).isAxiosError) {
      const e = err as { response?: { data?: unknown; status?: number }; message: string };
      throw new Error(
        `Failed to get configured model "${idOrName}" (HTTP ${e.response?.status ?? "unknown"}): ${JSON.stringify(e.response?.data ?? e.message)}`
      );
    }
    throw err;
  }
}

// ── GET model artifacts (list) ────────────────────────────────────────────────

export async function fetchModelArtifacts(limit = 100): Promise<ModelArtifact[]> {
  const url = `${ML_PATH}/model-artifacts`;
  const client = await getDCClient();
  console.error(`[ml] GET ${client.defaults.baseURL}${url}`);

  try {
    const response = await client.get<unknown>(url, { params: { limit } });
    console.error(`[ml] HTTP ${response.status}`);
    console.error(`[ml] body: ${JSON.stringify(response.data).slice(0, 800)}`);
    return extractArray<ModelArtifact>(response.data, ["modelArtifacts", "data", "items", "records", "results"]);
  } catch (err) {
    if ((err as { isAxiosError?: boolean }).isAxiosError) {
      const e = err as { response?: { data?: unknown; status?: number }; message: string };
      throw new Error(
        `Failed to list model artifacts (HTTP ${e.response?.status ?? "unknown"}): ${JSON.stringify(e.response?.data ?? e.message)}`
      );
    }
    throw err;
  }
}

// ── GET model artifact (single) ───────────────────────────────────────────────

export async function fetchModelArtifact(idOrName: string): Promise<ModelArtifact> {
  const client = await getDCClient();
  const url = `${ML_PATH}/model-artifacts/${encodeURIComponent(idOrName)}`;
  console.error(`[ml] GET ${client.defaults.baseURL}${url}`);

  try {
    const response = await client.get<ModelArtifact>(url);
    console.error(`[ml] HTTP ${response.status}`);
    console.error(`[ml] body: ${JSON.stringify(response.data).slice(0, 800)}`);
    return response.data;
  } catch (err) {
    if ((err as { isAxiosError?: boolean }).isAxiosError) {
      const e = err as { response?: { data?: unknown; status?: number }; message: string };
      throw new Error(
        `Failed to get model artifact "${idOrName}" (HTTP ${e.response?.status ?? "unknown"}): ${JSON.stringify(e.response?.data ?? e.message)}`
      );
    }
    throw err;
  }
}

// ── GET model setup versions ──────────────────────────────────────────────────

export async function fetchModelSetupVersions(modelSetupId: string, limit = 100): Promise<unknown[]> {
  const client = await getDCClient();
  const url = `${ML_PATH}/model-setups/${encodeURIComponent(modelSetupId)}/setup-versions`;
  console.error(`[ml] GET ${client.defaults.baseURL}${url}`);

  try {
    const response = await client.get<unknown>(url, { params: { limit } });
    console.error(`[ml] HTTP ${response.status}`);
    console.error(`[ml] body: ${JSON.stringify(response.data).slice(0, 800)}`);
    return extractArray<unknown>(response.data, ["setupVersions", "data", "items", "records", "results"]);
  } catch (err) {
    if ((err as { isAxiosError?: boolean }).isAxiosError) {
      const e = err as { response?: { data?: unknown; status?: number }; message: string };
      throw new Error(
        `Failed to get model setup versions for "${modelSetupId}" (HTTP ${e.response?.status ?? "unknown"}): ${JSON.stringify(e.response?.data ?? e.message)}`
      );
    }
    throw err;
  }
}
