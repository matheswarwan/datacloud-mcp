import { z } from "zod";
import { fetchMetadata, MetadataEntry } from "../api/metadata.js";

export const GetMetadataInputSchema = z.object({
  entityType: z
    .string()
    .optional()
    .describe("Filter by entity type (e.g., 'DataModelObject', 'Segment')."),
  entityName: z
    .string()
    .optional()
    .describe("Filter by specific entity name."),
  entityCategory: z
    .string()
    .optional()
    .describe("Filter by entity category."),
  dataspace: z
    .string()
    .optional()
    .describe("Data space name to scope the query."),
});

export type GetMetadataInput = z.infer<typeof GetMetadataInputSchema>;

export const GET_METADATA_TOOL = {
  name: "get_metadata",
  description:
    "Fetch general SSOT metadata from Salesforce Data Cloud with optional filters. " +
    "Use this to discover entities, their types, and categories within the org. " +
    "Supports filtering by entityType, entityName, entityCategory, and dataspace.",
  inputSchema: {
    type: "object" as const,
    properties: {
      entityType: {
        type: "string",
        description: "Filter by entity type.",
      },
      entityName: {
        type: "string",
        description: "Filter by entity name.",
      },
      entityCategory: {
        type: "string",
        description: "Filter by entity category.",
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

function formatEntry(entry: MetadataEntry, index: number): string {
  const lines = [`Entry ${index + 1}:`];
  Object.entries(entry).slice(0, 15).forEach(([k, v]) => {
    lines.push(`  ${k}: ${JSON.stringify(v)}`);
  });
  const total = Object.keys(entry).length;
  if (total > 15) lines.push(`  ... and ${total - 15} more fields`);
  return lines.join("\n");
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function handleGetMetadata(input: GetMetadataInput): Promise<string> {
  const entries = await fetchMetadata(input.entityType, input.entityName, input.entityCategory, input.dataspace);

  if (entries.length === 0) return "No metadata entries found matching the given filters.";

  const filters: string[] = [];
  if (input.entityType) filters.push(`entityType="${input.entityType}"`);
  if (input.entityName) filters.push(`entityName="${input.entityName}"`);
  if (input.entityCategory) filters.push(`entityCategory="${input.entityCategory}"`);
  if (input.dataspace) filters.push(`dataspace="${input.dataspace}"`);

  const filterStr = filters.length > 0 ? ` (${filters.join(", ")})` : "";
  return `Found ${entries.length} metadata entry/entries${filterStr}:\n\n${entries.map(formatEntry).join("\n\n")}`;
}
