import { getDCClient } from "./client.js";

const DMO_MAPPING_PATH = "/services/data/v65.0/ssot/data-model-object-mappings";

export interface FieldMapping {
  developerName: string;
  sourceFieldDeveloperName: string;
  targetFieldDeveloperName: string;
  [key: string]: unknown;
}

export interface ObjectSourceTargetMap {
  developerName: string;
  sourceEntityDeveloperName: string;
  targetEntityDeveloperName: string;
  status: string;
  fieldMappings: FieldMapping[];
  [key: string]: unknown;
}

export interface DmoMappingResponse {
  objectSourceTargetMaps?: ObjectSourceTargetMap[];
  [key: string]: unknown;
}

export interface FieldMappingPair {
  sourceFieldDeveloperName: string;
  targetFieldDeveloperName: string;
}

export interface DeleteFieldMappingPair {
  developerName: string;
  sourceFieldDeveloperName: string;
  targetFieldDeveloperName: string;
}

export interface DeleteMappingPayload {
  sourceEntityDeveloperName: string;
  fieldMappings: DeleteFieldMappingPair[];
}

export interface ApplyMappingPayload {
  objectSourceTargetMapDeveloperName: string;
  sourceEntityDeveloperName: string;
  targetEntityDeveloperName: string;
  fieldMappings: FieldMappingPair[];
}

export async function fetchDmoMapping(dmoDeveloperName: string): Promise<ObjectSourceTargetMap[]> {
  const client = await getDCClient();
  const url = `${DMO_MAPPING_PATH}?dmoDeveloperName=${encodeURIComponent(dmoDeveloperName)}`;
  console.error(`[dmo_mapping] GET ${client.defaults.baseURL}${url}`);

  try {
    const response = await client.get<DmoMappingResponse>(url);
    console.error(`[dmo_mapping] Response status: ${response.status}`);
    return response.data.objectSourceTargetMaps ?? [];
  } catch (err) {
    if ((err as { isAxiosError?: boolean }).isAxiosError) {
      const axiosErr = err as { response?: { data?: unknown; status?: number }; message: string };
      const status = axiosErr.response?.status;
      const detail = axiosErr.response?.data
        ? JSON.stringify(axiosErr.response.data)
        : axiosErr.message;
      throw new Error(`Failed to fetch DMO mapping (HTTP ${status ?? "unknown"}): ${detail}`);
    }
    throw err;
  }
}

export async function deleteDmoFieldMappings(payload: DeleteMappingPayload): Promise<void> {
  const client = await getDCClient();
  const { sourceEntityDeveloperName, fieldMappings } = payload;
  const url = `${DMO_MAPPING_PATH}/${encodeURIComponent(sourceEntityDeveloperName)}/field-mappings`;

  console.error(`[dmo_mapping] DELETE ${client.defaults.baseURL}${url}`);

  try {
    const response = await client.delete(url, {
      data: { fieldMappings },
    });
    console.error(`[dmo_mapping] DELETE status: ${response.status}`);
  } catch (err) {
    if ((err as { isAxiosError?: boolean }).isAxiosError) {
      const axiosErr = err as { response?: { data?: unknown; status?: number }; message: string };
      const status = axiosErr.response?.status;
      const detail = axiosErr.response?.data
        ? JSON.stringify(axiosErr.response.data)
        : axiosErr.message;
      throw new Error(`Failed to delete DMO field mappings (HTTP ${status ?? "unknown"}): ${detail}`);
    }
    throw err;
  }
}

export async function applyDmoFieldMapping(payload: ApplyMappingPayload): Promise<unknown> {
  const client = await getDCClient();
  const { objectSourceTargetMapDeveloperName, sourceEntityDeveloperName, targetEntityDeveloperName, fieldMappings } = payload;
  const url = `${DMO_MAPPING_PATH}/${encodeURIComponent(objectSourceTargetMapDeveloperName)}/field-mappings/${encodeURIComponent(targetEntityDeveloperName)}`;

  console.error(`[dmo_mapping] PATCH ${client.defaults.baseURL}${url}`);

  try {
    const response = await client.patch<unknown>(url, {
      sourceEntityDeveloperName,
      targetEntityDeveloperName,
      fieldMapping: fieldMappings,
    });
    console.error(`[dmo_mapping] PATCH status: ${response.status}`);
    return response.data;
  } catch (err) {
    if ((err as { isAxiosError?: boolean }).isAxiosError) {
      const axiosErr = err as { response?: { data?: unknown; status?: number }; message: string };
      const status = axiosErr.response?.status;
      const detail = axiosErr.response?.data
        ? JSON.stringify(axiosErr.response.data)
        : axiosErr.message;
      throw new Error(`Failed to apply DMO field mapping (HTTP ${status ?? "unknown"}): ${detail}`);
    }
    throw err;
  }
}
