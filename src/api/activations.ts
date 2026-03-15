import { getDCClient } from "./client.js";

const ACT_PATH = "/services/data/v65.0/ssot/activations";
const ACT_TARGETS_PATH = "/services/data/v65.0/ssot/activation-targets";
const ACT_PLATFORMS_PATH = "/services/data/v65.0/ssot/activation-external-platforms";

// ── Types ────────────────────────────────────────────────────────────────────

export interface Activation {
  id?: string;
  name?: string;
  label?: string;
  status?: string;
  activationTargetId?: string;
  [key: string]: unknown;
}

export interface ActivationTarget {
  id?: string;
  name?: string;
  label?: string;
  type?: string;
  status?: string;
  [key: string]: unknown;
}

export interface ActivationExternalPlatform {
  name?: string;
  label?: string;
  type?: string;
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

// ── GET activations (list) ────────────────────────────────────────────────────

export async function fetchActivations(limit = 100): Promise<Activation[]> {
  const client = await getDCClient();
  console.error(`[activations] GET ${client.defaults.baseURL}${ACT_PATH}`);

  try {
    const response = await client.get<unknown>(ACT_PATH, { params: { batchSize: limit } });
    console.error(`[activations] HTTP ${response.status}`);
    console.error(`[activations] body: ${JSON.stringify(response.data).slice(0, 800)}`);
    return extractArray<Activation>(response.data, ["activations", "data", "items", "records", "results"]);
  } catch (err) {
    if ((err as { isAxiosError?: boolean }).isAxiosError) {
      const e = err as { response?: { data?: unknown; status?: number }; message: string };
      throw new Error(
        `Failed to list activations (HTTP ${e.response?.status ?? "unknown"}): ${JSON.stringify(e.response?.data ?? e.message)}`
      );
    }
    throw err;
  }
}

// ── GET activation (single) ───────────────────────────────────────────────────

export async function fetchActivation(activationId: string): Promise<Activation> {
  const client = await getDCClient();
  const url = `${ACT_PATH}/${encodeURIComponent(activationId)}`;
  console.error(`[activations] GET ${client.defaults.baseURL}${url}`);

  try {
    const response = await client.get<Activation>(url);
    console.error(`[activations] HTTP ${response.status}`);
    console.error(`[activations] body: ${JSON.stringify(response.data).slice(0, 800)}`);
    return response.data;
  } catch (err) {
    if ((err as { isAxiosError?: boolean }).isAxiosError) {
      const e = err as { response?: { data?: unknown; status?: number }; message: string };
      throw new Error(
        `Failed to get activation "${activationId}" (HTTP ${e.response?.status ?? "unknown"}): ${JSON.stringify(e.response?.data ?? e.message)}`
      );
    }
    throw err;
  }
}

// ── GET activation data ───────────────────────────────────────────────────────

export async function fetchActivationData(activationId: string, limit = 100): Promise<unknown[]> {
  const client = await getDCClient();
  const url = `${ACT_PATH}/${encodeURIComponent(activationId)}/data`;
  console.error(`[activations] GET ${client.defaults.baseURL}${url}`);

  try {
    const response = await client.get<unknown>(url, { params: { batchSize: limit } });
    console.error(`[activations] HTTP ${response.status}`);
    console.error(`[activations] body: ${JSON.stringify(response.data).slice(0, 800)}`);
    return extractArray<unknown>(response.data, ["data", "items", "records", "results"]);
  } catch (err) {
    if ((err as { isAxiosError?: boolean }).isAxiosError) {
      const e = err as { response?: { data?: unknown; status?: number }; message: string };
      throw new Error(
        `Failed to get activation data for "${activationId}" (HTTP ${e.response?.status ?? "unknown"}): ${JSON.stringify(e.response?.data ?? e.message)}`
      );
    }
    throw err;
  }
}

// ── GET activation targets (list) ─────────────────────────────────────────────

export async function fetchActivationTargets(limit = 100): Promise<ActivationTarget[]> {
  const client = await getDCClient();
  console.error(`[activations] GET ${client.defaults.baseURL}${ACT_TARGETS_PATH}`);

  try {
    const response = await client.get<unknown>(ACT_TARGETS_PATH, { params: { batchSize: limit } });
    console.error(`[activations] HTTP ${response.status}`);
    console.error(`[activations] body: ${JSON.stringify(response.data).slice(0, 800)}`);
    return extractArray<ActivationTarget>(response.data, ["activationTargets", "data", "items", "records", "results"]);
  } catch (err) {
    if ((err as { isAxiosError?: boolean }).isAxiosError) {
      const e = err as { response?: { data?: unknown; status?: number }; message: string };
      throw new Error(
        `Failed to list activation targets (HTTP ${e.response?.status ?? "unknown"}): ${JSON.stringify(e.response?.data ?? e.message)}`
      );
    }
    throw err;
  }
}

// ── GET activation target (single) ────────────────────────────────────────────

export async function fetchActivationTarget(activationTargetId: string): Promise<ActivationTarget> {
  const client = await getDCClient();
  const url = `${ACT_TARGETS_PATH}/${encodeURIComponent(activationTargetId)}`;
  console.error(`[activations] GET ${client.defaults.baseURL}${url}`);

  try {
    const response = await client.get<ActivationTarget>(url);
    console.error(`[activations] HTTP ${response.status}`);
    console.error(`[activations] body: ${JSON.stringify(response.data).slice(0, 800)}`);
    return response.data;
  } catch (err) {
    if ((err as { isAxiosError?: boolean }).isAxiosError) {
      const e = err as { response?: { data?: unknown; status?: number }; message: string };
      throw new Error(
        `Failed to get activation target "${activationTargetId}" (HTTP ${e.response?.status ?? "unknown"}): ${JSON.stringify(e.response?.data ?? e.message)}`
      );
    }
    throw err;
  }
}

// ── GET external platforms ────────────────────────────────────────────────────

export async function fetchActivationExternalPlatforms(limit = 100): Promise<ActivationExternalPlatform[]> {
  const client = await getDCClient();
  console.error(`[activations] GET ${client.defaults.baseURL}${ACT_PLATFORMS_PATH}`);

  try {
    const response = await client.get<unknown>(ACT_PLATFORMS_PATH, { params: { limit } });
    console.error(`[activations] HTTP ${response.status}`);
    console.error(`[activations] body: ${JSON.stringify(response.data).slice(0, 800)}`);
    return extractArray<ActivationExternalPlatform>(response.data, ["platforms", "data", "items", "records", "results"]);
  } catch (err) {
    if ((err as { isAxiosError?: boolean }).isAxiosError) {
      const e = err as { response?: { data?: unknown; status?: number }; message: string };
      throw new Error(
        `Failed to list activation external platforms (HTTP ${e.response?.status ?? "unknown"}): ${JSON.stringify(e.response?.data ?? e.message)}`
      );
    }
    throw err;
  }
}
