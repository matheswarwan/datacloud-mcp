import { z } from "zod";
import { fetchDataStreamDetail } from "../api/datastreams.js";
import { fetchDmoMetadata } from "../api/dmo.js";
import { executeQueryV2, QueryV2FieldMeta } from "../api/query_v2.js";

// ── Schema ────────────────────────────────────────────────────────────────────

export const DescribeDataStreamInputSchema = z.object({
  stream_name: z
    .string()
    .describe("Developer name (API name) of the data stream to describe."),
  sample_rows: z
    .number()
    .int()
    .min(1)
    .max(50)
    .optional()
    .describe("Number of sample data rows to fetch (default: 10, max: 50)."),
});

export type DescribeDataStreamInput = z.infer<typeof DescribeDataStreamInputSchema>;

// ── Tool definition ───────────────────────────────────────────────────────────

export const DESCRIBE_DATA_STREAM_TOOL = {
  name: "describe_data_stream",
  description:
    "Describe a Salesforce Data Cloud data stream: returns its full field schema and a small " +
    "sample of actual data rows. Use this when the user asks to 'describe', 'show schema', " +
    "'preview', 'explore', or 'what fields does X have'. " +
    "Returns field names, types, and up to 50 sample rows.",
  inputSchema: {
    type: "object" as const,
    properties: {
      stream_name: {
        type: "string",
        description: "Developer name (API name) of the data stream.",
      },
      sample_rows: {
        type: "number",
        description: "Number of sample rows to include (default: 10, max: 50).",
      },
    },
    required: ["stream_name"],
  },
};

// ── Handler ───────────────────────────────────────────────────────────────────

export async function handleDescribeDataStream(
  input: DescribeDataStreamInput
): Promise<string> {
  const sampleRows = input.sample_rows ?? 10;
  const lines: string[] = [];
  lines.push(`## Data Stream: ${input.stream_name}\n`);

  // 1. Fetch schema from the data stream detail endpoint
  type SchemaField = { name: string; label?: string; type?: string; dataType?: string; [key: string]: unknown };
  let fields: SchemaField[] = [];
  let schemaSource = "";

  try {
    const detail = await fetchDataStreamDetail(input.stream_name);
    const raw = detail.fields ?? detail.dataStreamFields ?? [];
    fields = raw as SchemaField[];
    schemaSource = "data stream metadata";
  } catch {
    // Fall back to DMO metadata cache
    try {
      const dmos = await fetchDmoMetadata();
      const match = dmos.find(
        (d) =>
          d.name?.toLowerCase() === input.stream_name.toLowerCase() ||
          d.label?.toLowerCase() === input.stream_name.toLowerCase()
      );
      if (match?.fields) {
        fields = match.fields as SchemaField[];
        schemaSource = "DMO metadata cache";
      }
    } catch {
      // Schema will be derived from query metadata below
    }
  }

  if (fields.length > 0) {
    lines.push(`### Schema — ${fields.length} field(s) *(source: ${schemaSource})*\n`);
    lines.push("| Field | Label | Type |");
    lines.push("|-------|-------|------|");
    for (const f of fields) {
      lines.push(
        `| \`${f.name ?? "—"}\` | ${f.label ?? "—"} | ${f.type ?? f.dataType ?? "—"} |`
      );
    }
    lines.push("");
  }

  // 2. Fetch sample data via Query V2
  lines.push(`### Sample Data (up to ${sampleRows} rows)\n`);
  try {
    const sql = `SELECT * FROM ${input.stream_name} LIMIT ${sampleRows}`;
    lines.push(`\`\`\`sql\n${sql}\n\`\`\`\n`);

    const { rows, metadata, truncated } = await executeQueryV2(sql, sampleRows);

    // If schema was unavailable, derive from query response metadata
    if (fields.length === 0 && Object.keys(metadata).length > 0) {
      const sorted = Object.entries(metadata).sort(
        (a, b) => a[1].placeInOrder - b[1].placeInOrder
      );
      lines.push("### Schema — derived from query response\n");
      lines.push("| Field | Type |");
      lines.push("|-------|------|");
      for (const [col, meta] of sorted) {
        lines.push(`| \`${col}\` | ${(meta as QueryV2FieldMeta).type} |`);
      }
      lines.push("");
    }

    if (rows.length === 0) {
      lines.push("*No data rows returned — the stream may be empty.*");
    } else {
      // Determine column order from metadata or first row
      const colOrder =
        Object.keys(metadata).length > 0
          ? Object.entries(metadata)
              .sort((a, b) => a[1].placeInOrder - b[1].placeInOrder)
              .map(([k]) => k)
          : Object.keys(rows[0]);

      lines.push("| # | " + colOrder.join(" | ") + " |");
      lines.push("|---|" + colOrder.map(() => "---").join("|") + "|");
      rows.forEach((row, i) => {
        const cells = colOrder.map((col) => {
          const val = row[col];
          if (val === null || val === undefined) return "*null*";
          const str = String(val);
          return str.length > 80 ? str.slice(0, 77) + "…" : str;
        });
        lines.push(`| ${i + 1} | ${cells.join(" | ")} |`);
      });

      if (truncated) {
        lines.push(`\n*Results truncated at ${sampleRows} rows.*`);
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    lines.push(`*Could not fetch sample data: ${msg}*`);
    lines.push(
      "\n*Tip: Verify the stream name is the API/developer name, not the display label.*"
    );
  }

  return lines.join("\n");
}
