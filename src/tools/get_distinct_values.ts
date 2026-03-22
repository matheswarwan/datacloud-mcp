import { z } from "zod";
import { executeQueryV2 } from "../api/query_v2.js";

// ── Schema ────────────────────────────────────────────────────────────────────

export const GetDistinctValuesInputSchema = z.object({
  target: z
    .string()
    .describe("Data stream or DMO API name to query (e.g. 'Contact__dlm', 'MyStream__dll')."),
  fields: z
    .array(z.string())
    .min(1)
    .max(5)
    .describe(
      "One or more field API names to get distinct values for (max 5). " +
      "Single field returns a simple list; multiple fields return distinct combinations."
    ),
  limit: z
    .number()
    .int()
    .min(1)
    .max(1000)
    .optional()
    .describe("Max distinct value combinations to return (default: 100, max: 1000)."),
  where: z
    .string()
    .optional()
    .describe(
      "Optional SQL WHERE clause to pre-filter rows before computing distinct values " +
      "(e.g. \"Country__c = 'US'\"). Do not include the WHERE keyword."
    ),
});

export type GetDistinctValuesInput = z.infer<typeof GetDistinctValuesInputSchema>;

// ── Tool definition ───────────────────────────────────────────────────────────

export const GET_DISTINCT_VALUES_TOOL = {
  name: "get_distinct_values",
  description:
    "Get distinct/unique values for one or more fields in a Salesforce Data Cloud data stream or DMO. " +
    "Use this for data profiling: enumerating categories, checking cardinality, or exploring field values. " +
    "Examples: 'show all unique countries in the Contact stream', " +
    "'what product categories exist', 'list distinct status values'. " +
    "Supports up to 5 fields at once for cross-tabulation of distinct combinations.",
  inputSchema: {
    type: "object" as const,
    properties: {
      target: {
        type: "string",
        description: "Data stream or DMO API name to query.",
      },
      fields: {
        type: "array",
        items: { type: "string" },
        description: "Field API names to get distinct values for (max 5).",
        minItems: 1,
        maxItems: 5,
      },
      limit: {
        type: "number",
        description: "Max distinct combinations to return (default: 100, max: 1000).",
      },
      where: {
        type: "string",
        description:
          "Optional SQL WHERE clause (without the WHERE keyword) to pre-filter rows.",
      },
    },
    required: ["target", "fields"],
  },
};

// ── Handler ───────────────────────────────────────────────────────────────────

export async function handleGetDistinctValues(
  input: GetDistinctValuesInput
): Promise<string> {
  const limit = input.limit ?? 100;
  const cleanFields = input.fields.map((f) => f.trim());
  const fieldList = cleanFields.join(", ");

  // Build SQL safely — field and table names come from the LLM/user but we
  // only allow identifiers (no semicolons or string literals in those slots).
  const safeName = (n: string) => n.replace(/[^a-zA-Z0-9_$.]/g, "");
  const safeTarget = safeName(input.target);
  const safeFields = cleanFields.map(safeName).join(", ");

  let sql = `SELECT DISTINCT ${safeFields} FROM ${safeTarget}`;
  if (input.where) {
    // WHERE clause is free-form — log but pass through as-is since it's a
    // SQL filter expression (values, operators, etc. are all legitimate)
    sql += ` WHERE ${input.where}`;
  }
  sql += ` LIMIT ${limit}`;

  const lines: string[] = [];
  lines.push(`## Distinct Values: \`${fieldList}\` from \`${input.target}\`\n`);
  lines.push(`\`\`\`sql\n${sql}\n\`\`\`\n`);

  try {
    const { rows, metadata, truncated } = await executeQueryV2(sql, limit);

    if (rows.length === 0) {
      lines.push(
        "*No results returned. The table may be empty, the stream/field names may be incorrect, " +
        "or the WHERE filter excluded all rows.*"
      );
      return lines.join("\n");
    }

    lines.push(`**${rows.length} distinct combination(s) found:**\n`);

    // Determine column display order from response metadata
    const colOrder =
      Object.keys(metadata).length > 0
        ? Object.entries(metadata)
            .sort((a, b) => a[1].placeInOrder - b[1].placeInOrder)
            .map(([k]) => k)
        : cleanFields;

    if (colOrder.length === 1) {
      // Single field — render as a numbered list for readability
      const col = colOrder[0];
      lines.push("| # | Value |");
      lines.push("|---|-------|");
      rows.forEach((row, i) => {
        // Try the exact name, then the safeField variant
        const val = row[col] ?? row[safeName(col)] ?? Object.values(row)[0];
        const display =
          val === null || val === undefined ? "*null*" : String(val);
        lines.push(`| ${i + 1} | ${display} |`);
      });
    } else {
      // Multiple fields — render as a table
      lines.push("| # | " + colOrder.join(" | ") + " |");
      lines.push("|---|" + colOrder.map(() => "---").join("|") + "|");
      rows.forEach((row, i) => {
        const cells = colOrder.map((col) => {
          const val = row[col];
          if (val === null || val === undefined) return "*null*";
          const str = String(val);
          return str.length > 60 ? str.slice(0, 57) + "…" : str;
        });
        lines.push(`| ${i + 1} | ${cells.join(" | ")} |`);
      });
    }

    if (truncated || rows.length >= limit) {
      lines.push(
        `\n*Results capped at ${limit}. Increase \`limit\` (max 1000) to see more values.*`
      );
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    lines.push(`**Error executing query:** ${msg}\n`);
    lines.push(
      "*Tips:*\n" +
      "- Verify `target` is the API/developer name of the stream or DMO\n" +
      "- Verify `fields` are valid API field names (check with `describe_data_stream`)\n" +
      "- `DISTINCT` may not be supported on all field types (e.g. large text fields)\n" +
      "- Rate limits: if you see 429 errors, wait a moment before retrying"
    );
  }

  return lines.join("\n");
}
