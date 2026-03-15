import { z } from "zod";
import {
  submitSqlQuery,
  fetchSqlQueryStatus,
  fetchSqlQueryRows,
  QueryJob,
  QueryResult,
} from "../api/query.js";

export const QueryDataInputSchema = z.object({
  sql: z
    .string()
    .optional()
    .describe("SQL query string to submit. Providing this implies action='submit'."),
  queryId: z
    .string()
    .optional()
    .describe("Query job ID for checking status or fetching rows."),
  action: z
    .enum(["submit", "status", "rows"])
    .optional()
    .describe("Action: 'submit' to run a SQL query, 'status' to check job status, 'rows' to fetch results."),
  rowLimit: z
    .number()
    .int()
    .min(1)
    .max(50000)
    .optional()
    .describe("Max rows to return when fetching results (default: 1000)."),
  offset: z
    .number()
    .int()
    .min(0)
    .optional()
    .describe("Row offset for pagination when fetching results (default: 0)."),
  dataspace: z
    .string()
    .optional()
    .describe("Data space name to scope the query."),
});

export type QueryDataInput = z.infer<typeof QueryDataInputSchema>;

export const QUERY_DATA_TOOL = {
  name: "query_data",
  description:
    "Submit and manage SQL queries against Salesforce Data Cloud. " +
    "Use action='submit' (or provide sql) to run a query and get a queryId, " +
    "action='status' to check query job status, " +
    "action='rows' to fetch result rows for a completed query. " +
    "Use this when asked to query data, run SQL, or fetch query results.",
  inputSchema: {
    type: "object" as const,
    properties: {
      sql: {
        type: "string",
        description: "SQL query string to submit.",
      },
      queryId: {
        type: "string",
        description: "Query job ID for status/rows actions.",
      },
      action: {
        type: "string",
        enum: ["submit", "status", "rows"],
        description: "Action to perform.",
      },
      rowLimit: {
        type: "number",
        description: "Max rows to return when fetching results (default: 1000).",
      },
      offset: {
        type: "number",
        description: "Row offset for pagination (default: 0).",
      },
      dataspace: {
        type: "string",
        description: "Data space name to scope the query.",
      },
    },
    required: [],
  },
};

// ── Formatters ────────────────────────────────────────────────────────────────

function formatQueryJob(job: QueryJob): string {
  const id = (job.queryId ?? job.id ?? "—") as string;
  const status = (job.status ?? "—") as string;
  const lines = [`  queryId: ${id}`, `  status: ${status}`];
  const shown = new Set(["queryId", "id", "status"]);
  Object.entries(job).filter(([k]) => !shown.has(k)).forEach(([k, v]) => {
    lines.push(`  ${k}: ${JSON.stringify(v)}`);
  });
  return lines.join("\n");
}

function formatQueryResult(result: QueryResult): string {
  const rows = result.rows ?? result.data ?? [];
  if (!Array.isArray(rows) || rows.length === 0) return "No rows returned.";
  const lines = [`${rows.length} row(s):`];
  rows.slice(0, 50).forEach((row, i) => {
    lines.push(`\nRow ${i + 1}: ${JSON.stringify(row)}`);
  });
  if (rows.length > 50) lines.push(`\n... and ${rows.length - 50} more rows`);
  return lines.join("\n");
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function handleQueryData(input: QueryDataInput): Promise<string> {
  const action = input.action ?? (input.sql ? "submit" : input.queryId ? "status" : "submit");

  if (action === "submit" || input.sql) {
    if (!input.sql) return "Error: sql is required for action='submit'.";
    const job = await submitSqlQuery(input.sql, input.dataspace);
    return `Query submitted:\n${formatQueryJob(job)}\n\nUse action='status' with this queryId to check progress, or action='rows' once complete.`;
  }

  if (action === "status") {
    if (!input.queryId) return "Error: queryId is required for action='status'.";
    const job = await fetchSqlQueryStatus(input.queryId, input.dataspace);
    return `Query status:\n${formatQueryJob(job)}`;
  }

  if (action === "rows") {
    if (!input.queryId) return "Error: queryId is required for action='rows'.";
    const result = await fetchSqlQueryRows(input.queryId, input.rowLimit ?? 1000, input.offset ?? 0, input.dataspace);
    return `Query results for "${input.queryId}":\n\n${formatQueryResult(result)}`;
  }

  return "Error: Provide sql or queryId with an appropriate action.";
}
