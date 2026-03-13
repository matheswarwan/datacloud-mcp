import { getDCClient } from "./client.js";

const SEGMENTS_PATH = "/services/data/v65.0/ssot/segments";

export interface PublishSegmentResponse {
  success?: boolean;
  status?: string;
  message?: string;
  [key: string]: unknown;
}

export type Segment = Record<string, unknown>;

export async function publishSegment(segmentId: string): Promise<PublishSegmentResponse> {
  const client = await getDCClient();
  const url = `${SEGMENTS_PATH}/${encodeURIComponent(segmentId)}/actions/publish`;
  console.error(`[segments] POST ${client.defaults.baseURL}${url}`);

  try {
    const response = await client.post<PublishSegmentResponse>(url);
    console.error(`[segments] publish HTTP ${response.status}`);
    return response.data ?? {};
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
      throw new Error(`Failed to publish segment (HTTP ${status ?? "unknown"}): ${detail}`);
    }
    throw err;
  }
}

export async function fetchSegments(limit = 100): Promise<Segment[]> {
  const client = await getDCClient();
  const fullUrl = `${client.defaults.baseURL}${SEGMENTS_PATH}?limit=${limit}`;
  console.error(`[segments] GET ${fullUrl}`);

  try {
    const response = await client.get<unknown>(SEGMENTS_PATH, {
      params: { limit },
    });
    console.error(`[segments] HTTP ${response.status}`);
    console.error(`[segments] body: ${JSON.stringify(response.data).slice(0, 800)}`);

    const raw = response.data;
    if (Array.isArray(raw)) return raw;
    if (raw && typeof raw === "object") {
      for (const key of ["data", "segments", "items", "records", "results"]) {
        const val = (raw as Record<string, unknown>)[key];
        if (Array.isArray(val)) return val;
      }
      return [raw as Segment];
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
      throw new Error(`Failed to fetch segments (HTTP ${status ?? "unknown"}): ${detail}`);
    }
    throw err;
  }
}
