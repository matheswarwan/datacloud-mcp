import { getDCClient } from "./client.js";

const DK_PATH = "/services/data/v65.0/ssot/data-kits";

// ── Types ────────────────────────────────────────────────────────────────────

export interface DataKitDependency {
  [key: string]: unknown;
}

export interface DataKitDeploymentStatus {
  status?: string;
  [key: string]: unknown;
}

// ── GET data kit component dependencies ───────────────────────────────────────

export async function fetchDataKitComponentDependencies(
  dataKitName: string,
  componentName: string,
  componentType?: string,
  dataspace?: string
): Promise<DataKitDependency[]> {
  const client = await getDCClient();
  const url = `${DK_PATH}/${encodeURIComponent(dataKitName)}/components/${encodeURIComponent(componentName)}/dependencies`;
  console.error(`[data_kits] GET ${client.defaults.baseURL}${url}`);

  try {
    const params: Record<string, unknown> = {};
    if (componentType) params.componentType = componentType;
    if (dataspace) params.dataspace = dataspace;

    const response = await client.get<unknown>(url, { params });
    console.error(`[data_kits] HTTP ${response.status}`);
    console.error(`[data_kits] body: ${JSON.stringify(response.data).slice(0, 800)}`);

    const raw = response.data;
    if (Array.isArray(raw)) return raw;

    if (raw && typeof raw === "object") {
      const obj = raw as Record<string, unknown>;
      for (const key of ["dependencies", "data", "items", "records", "results"]) {
        const val = obj[key];
        if (Array.isArray(val)) return val as DataKitDependency[];
      }
      return [obj as DataKitDependency];
    }

    return [];
  } catch (err) {
    if ((err as { isAxiosError?: boolean }).isAxiosError) {
      const e = err as { response?: { data?: unknown; status?: number }; message: string };
      throw new Error(
        `Failed to get dependencies for component "${componentName}" in kit "${dataKitName}" (HTTP ${e.response?.status ?? "unknown"}): ${JSON.stringify(e.response?.data ?? e.message)}`
      );
    }
    throw err;
  }
}

// ── GET data kit component deployment status ──────────────────────────────────

export async function fetchDataKitComponentDeploymentStatus(
  dataKitName: string,
  componentName: string
): Promise<DataKitDeploymentStatus> {
  const client = await getDCClient();
  const url = `${DK_PATH}/${encodeURIComponent(dataKitName)}/components/${encodeURIComponent(componentName)}/deployment-status`;
  console.error(`[data_kits] GET ${client.defaults.baseURL}${url}`);

  try {
    const response = await client.get<DataKitDeploymentStatus>(url);
    console.error(`[data_kits] HTTP ${response.status}`);
    console.error(`[data_kits] body: ${JSON.stringify(response.data).slice(0, 800)}`);
    return response.data;
  } catch (err) {
    if ((err as { isAxiosError?: boolean }).isAxiosError) {
      const e = err as { response?: { data?: unknown; status?: number }; message: string };
      throw new Error(
        `Failed to get deployment status for component "${componentName}" in kit "${dataKitName}" (HTTP ${e.response?.status ?? "unknown"}): ${JSON.stringify(e.response?.data ?? e.message)}`
      );
    }
    throw err;
  }
}
