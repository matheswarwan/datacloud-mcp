import { z } from "zod";
import {
  fetchInsightMetadata,
  fetchInsightMetadataByName,
  fetchInsightData,
  InsightMetadata,
  InsightData,
} from "../api/insights.js";

export const GetInsightDataInputSchema = z.object({
  action: z
    .enum(["metadata", "data"])
    .optional()
    .describe("Action: 'metadata' (default) to list/get insight metadata, 'data' to fetch computed insight data."),
  ciName: z
    .string()
    .optional()
    .describe("Calculated insight name. For metadata: get single entry. For data: required."),
  dimensions: z
    .string()
    .optional()
    .describe("Comma-separated dimension fields to include in data results."),
  measures: z
    .string()
    .optional()
    .describe("Comma-separated measure fields to include in data results."),
  filters: z
    .string()
    .optional()
    .describe("Filter expression for insight data."),
  limit: z
    .number()
    .int()
    .min(1)
    .max(1000)
    .optional()
    .describe("Max number of results to return (default: 100)."),
});

export type GetInsightDataInput = z.infer<typeof GetInsightDataInputSchema>;

export const GET_INSIGHT_DATA_TOOL = {
  name: "get_insight_data",
  description:
    "Access Salesforce Data Cloud calculated insight metadata or data. " +
    "Use action='metadata' (default) to list or get insight definitions, " +
    "or action='data' with ciName to fetch computed insight rows. " +
    "Use this when asked about calculated insights, insight data, or insight metrics.",
  inputSchema: {
    type: "object" as const,
    properties: {
      action: {
        type: "string",
        enum: ["metadata", "data"],
        description: "Action: 'metadata' (default) or 'data' to fetch insight records.",
      },
      ciName: {
        type: "string",
        description: "Calculated insight name. Required for action='data'.",
      },
      dimensions: {
        type: "string",
        description: "Comma-separated dimension fields.",
      },
      measures: {
        type: "string",
        description: "Comma-separated measure fields.",
      },
      filters: {
        type: "string",
        description: "Filter expression.",
      },
      limit: {
        type: "number",
        description: "Max number of results to return (default: 100).",
      },
    },
    required: [],
  },
};

// ── Formatters ────────────────────────────────────────────────────────────────

function formatMetadata(m: InsightMetadata): string {
  const name = (m.name ?? "—") as string;
  const label = (m.label ?? "—") as string;
  const lines = [`• ${label} (name: ${name})`];
  const shown = new Set(["name", "label"]);
  Object.entries(m).filter(([k]) => !shown.has(k)).forEach(([k, v]) => {
    lines.push(`  ${k}: ${JSON.stringify(v)}`);
  });
  return lines.join("\n");
}

function formatInsightRow(row: InsightData, index: number): string {
  return `Row ${index + 1}:\n${Object.entries(row).map(([k, v]) => `  ${k}: ${JSON.stringify(v)}`).join("\n")}`;
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function handleGetInsightData(input: GetInsightDataInput): Promise<string> {
  const limit = input.limit ?? 100;
  const action = input.action ?? "metadata";

  if (action === "data") {
    if (!input.ciName) return "Error: ciName is required for action='data'.";
    const rows = await fetchInsightData(input.ciName, input.dimensions, input.measures, input.filters, limit);
    if (rows.length === 0) return `No insight data found for "${input.ciName}".`;
    return `Insight data for "${input.ciName}" (${rows.length} row(s)):\n\n${rows.map(formatInsightRow).join("\n\n")}`;
  }

  // metadata (default)
  if (input.ciName) {
    const meta = await fetchInsightMetadataByName(input.ciName);
    return `Insight Metadata:\n\n${formatMetadata(meta)}`;
  }

  const metaList = await fetchInsightMetadata(limit);
  if (metaList.length === 0) return "No insight metadata found.";
  return `Found ${metaList.length} insight metadata entry/entries:\n\n${metaList.map(formatMetadata).join("\n\n")}`;
}
