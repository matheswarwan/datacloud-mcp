import { z } from "zod";
import { fetchDmoMetadata, DmoObject } from "../api/dmo.js";

export const GetDmoSchemaInputSchema = z.object({
  dmo_name: z
    .string()
    .optional()
    .describe(
      "Optional: return schema for a single DMO by exact name (e.g. 'UnifiedIndividual__dlm'). " +
        "If omitted, all DMOs and their fields are returned."
    ),
  search: z
    .string()
    .optional()
    .describe(
      "Optional: case-insensitive substring to filter DMO names (e.g. 'order'). " +
        "Ignored if dmo_name is provided."
    ),
});

export type GetDmoSchemaInput = z.infer<typeof GetDmoSchemaInputSchema>;

export const GET_DMO_SCHEMA_TOOL = {
  name: "get_dmo_schema",
  description:
    "Return the schema (fields and data types) for Data Model Objects (DMOs) in Data Cloud. " +
    "Results come from a startup cache — call with no arguments to see everything, " +
    "or narrow by dmo_name (exact) or search (substring). " +
    "Use this before proposing field mappings or writing SOQL-style queries.",
  inputSchema: {
    type: "object" as const,
    properties: {
      dmo_name: {
        type: "string",
        description:
          "Exact DMO name to look up (e.g. 'UnifiedIndividual__dlm'). Returns only that DMO.",
      },
      search: {
        type: "string",
        description:
          "Case-insensitive substring to filter DMO names. Ignored if dmo_name is provided.",
      },
    },
    required: [],
  },
};

function formatDmo(dmo: DmoObject): string {
  const displayName = dmo.name ?? dmo.label ?? "(unnamed)";
  const meta = [dmo.category, dmo.dataSpaceName].filter(Boolean).join(" / ");
  const header = `### ${displayName}${meta ? ` (${meta})` : ""}`;
  if (!dmo.fields || dmo.fields.length === 0) {
    return `${header}\n  (no fields returned)`;
  }
  const fieldLines = dmo.fields.map((f) => {
    const type = f.type ?? f.dataType;
    const typeStr = type ? ` [${type}]` : "";
    const label = f.label && f.label !== f.name ? ` — ${f.label}` : "";
    const pk = f.isPrimaryKey ? " 🔑" : "";
    return `  • ${f.name}${typeStr}${label}${pk}`;
  });
  return `${header}\n${fieldLines.join("\n")}`;
}

export async function handleGetDmoSchema(
  input: GetDmoSchemaInput
): Promise<string> {
  // Use the cache; fetchDmoMetadata returns it immediately if already loaded
  const all = await fetchDmoMetadata();

  let results: DmoObject[];

  if (input.dmo_name) {
    const match = all.find((d) => d.name === input.dmo_name);
    if (!match) {
      const names = all.map((d) => d.name).slice(0, 10).join(", ");
      return (
        `No DMO named "${input.dmo_name}" found. ` +
        `Available DMOs (first 10): ${names}${all.length > 10 ? `, … (${all.length} total)` : ""}`
      );
    }
    results = [match];
  } else if (input.search) {
    const needle = input.search.toLowerCase();
    results = all.filter((d) => (d.name ?? d.label ?? "").toLowerCase().includes(needle));
    if (results.length === 0) {
      return `No DMOs matched search term "${input.search}".`;
    }
  } else {
    results = all;
  }

  const body = results.map(formatDmo).join("\n\n");
  return `${results.length} DMO(s):\n\n${body}`;
}
