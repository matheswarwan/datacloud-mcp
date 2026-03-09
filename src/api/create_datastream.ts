import { getDCClient } from "./client.js";

const DATA_STREAMS_PATH = "/services/data/v65.0/ssot/data-streams";

export interface FieldMapping {
  sourceFieldName: string;
  targetFieldName: string;
}

export interface CreateDataStreamPayload {
  name: string;
  dataSpaceName?: string;   // defaults to "default"
  targetObjectName: string; // DMO name to map to
  fields: Array<{
    name: string;
    label?: string;
    type: string;           // "Text", "Number", "Date", "DateTime", "Boolean"
    isPrimaryKey?: boolean;
  }>;
  fieldMappings: FieldMapping[];
}

export interface CreateDataStreamResponse {
  id?: string;
  name?: string;
  status?: string;
  [key: string]: unknown;
}

export async function createDataStream(
  payload: CreateDataStreamPayload
): Promise<CreateDataStreamResponse> {
  const client = await getDCClient();

  const body = {
    name: payload.name,
    dataSpaceName: payload.dataSpaceName ?? "default",
    targetObjectName: payload.targetObjectName,
    fields: payload.fields,
    fieldMappings: payload.fieldMappings,
  };

  console.error(`[create_datastream] POST ${client.defaults.baseURL}${DATA_STREAMS_PATH}`);
  console.error(`[create_datastream] body: ${JSON.stringify(body)}`);

  try {
    const response = await client.post<CreateDataStreamResponse>(
      DATA_STREAMS_PATH,
      body
    );
    console.error(`[create_datastream] HTTP ${response.status}`);
    console.error(`[create_datastream] response: ${JSON.stringify(response.data).slice(0, 500)}`);
    return response.data;
  } catch (err) {
    if ((err as { isAxiosError?: boolean }).isAxiosError) {
      const axiosErr = err as {
        response?: { data?: unknown; status?: number };
        message: string;
      };
      const status = axiosErr.response?.status;
      const detail = axiosErr.response?.data
        ? JSON.stringify(axiosErr.response.data)
        : axiosErr.message;
      throw new Error(`Failed to create data stream (HTTP ${status ?? "unknown"}): ${detail}`);
    }
    throw err;
  }
}
