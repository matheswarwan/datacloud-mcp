import { getDCClient } from "./client.js";

const DATA_STREAMS_PATH = "/services/data/v65.0/ssot/data-streams";

export type DataStream = Record<string, unknown>;

export async function fetchDataStreams(limit = 100): Promise<DataStream[]> {
  const client = await getDCClient();
  const fullUrl = `${client.defaults.baseURL}${DATA_STREAMS_PATH}?limit=${limit}`;
  console.error(`[datastreams] GET ${fullUrl}`);

  try {
    const response = await client.get<unknown>(DATA_STREAMS_PATH, {
      params: { limit },
    });
    console.error(`[datastreams] HTTP ${response.status}`);
    console.error(`[datastreams] body: ${JSON.stringify(response.data).slice(0, 800)}`);

    const raw = response.data;
    if (Array.isArray(raw)) return raw;
    if (raw && typeof raw === "object") {
      for (const key of ["data", "dataStreams", "items", "records", "results"]) {
        const val = (raw as Record<string, unknown>)[key];
        if (Array.isArray(val)) return val;
      }
      return [raw as DataStream];
    }
    return [];
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
      throw new Error(`Failed to fetch data streams (HTTP ${status ?? "unknown"}): ${detail}`);
    }
    throw err;
  }
}
