import { getDCClient } from "./client.js";

const QUERY_V2_PATH = "/api/v2/query";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface QueryV2FieldMeta {
  type: string;
  placeInOrder: number;
  typeCode: number;
}

export interface QueryV2Response {
  data: Record<string, unknown>[];
  startTime?: string;
  endTime?: string;
  rowCount?: number;
  queryId?: string;
  done: boolean;
  nextBatchId?: string;
  metadata?: Record<string, QueryV2FieldMeta>;
}

export interface QueryV2Result {
  rows: Record<string, unknown>[];
  metadata: Record<string, QueryV2FieldMeta>;
  queryId?: string;
  truncated: boolean;
}

// ── Execute synchronous V2 query ──────────────────────────────────────────────
// Automatically paginates through nextBatchId until done=true or maxRows is reached.

export async function executeQueryV2(
  sql: string,
  maxRows = 2000
): Promise<QueryV2Result> {
  const client = await getDCClient();
  console.error(`[query_v2] POST ${QUERY_V2_PATH} | maxRows=${maxRows}`);
  console.error(`[query_v2] SQL: ${sql}`);

  try {
    const response = await client.post<QueryV2Response>(QUERY_V2_PATH, { sql });
    console.error(`[query_v2] HTTP ${response.status}`);

    let allRows: Record<string, unknown>[] = [...(response.data.data ?? [])];
    let metadata: Record<string, QueryV2FieldMeta> = response.data.metadata ?? {};
    const queryId = response.data.queryId;
    let done = response.data.done;
    let nextBatchId = response.data.nextBatchId;

    // Paginate through batches up to maxRows
    while (!done && nextBatchId && allRows.length < maxRows) {
      const batchUrl = `${QUERY_V2_PATH}/${encodeURIComponent(nextBatchId)}`;
      console.error(`[query_v2] GET next batch (rows so far: ${allRows.length})`);
      const batchResp = await client.get<QueryV2Response>(batchUrl);
      allRows = allRows.concat(batchResp.data.data ?? []);
      if (batchResp.data.metadata) {
        metadata = { ...metadata, ...batchResp.data.metadata };
      }
      done = batchResp.data.done;
      nextBatchId = batchResp.data.nextBatchId;
    }

    const truncated = allRows.length > maxRows;
    return {
      rows: allRows.slice(0, maxRows),
      metadata,
      queryId,
      truncated,
    };
  } catch (err) {
    if ((err as { isAxiosError?: boolean }).isAxiosError) {
      const e = err as {
        response?: { data?: unknown; status?: number };
        message: string;
      };
      throw new Error(
        `Query V2 failed (HTTP ${e.response?.status ?? "unknown"}): ${JSON.stringify(
          e.response?.data ?? e.message
        )}`
      );
    }
    throw err;
  }
}
