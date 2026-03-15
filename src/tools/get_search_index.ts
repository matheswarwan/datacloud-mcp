import { z } from "zod";
import {
  fetchSearchIndexes,
  fetchSearchIndexConfig,
  fetchSearchIndex,
  SearchIndex,
} from "../api/search_index.js";

export const GetSearchIndexInputSchema = z.object({
  apiNameOrId: z
    .string()
    .optional()
    .describe("API name or ID of a specific search index. Omit to list all."),
  action: z
    .enum(["list", "config"])
    .optional()
    .describe("Action: 'list' (default) to list search indexes, 'config' to get global search index config."),
});

export type GetSearchIndexInput = z.infer<typeof GetSearchIndexInputSchema>;

export const GET_SEARCH_INDEX_TOOL = {
  name: "get_search_index",
  description:
    "List search indexes, get a specific search index, or retrieve the global search index configuration " +
    "in Salesforce Data Cloud. Use action='config' for global config.",
  inputSchema: {
    type: "object" as const,
    properties: {
      apiNameOrId: {
        type: "string",
        description: "API name or ID of a specific search index. Omit to list all.",
      },
      action: {
        type: "string",
        enum: ["list", "config"],
        description: "Action: 'list' (default) or 'config' for global config.",
      },
    },
    required: [],
  },
};

// ── Formatters ────────────────────────────────────────────────────────────────

function formatSearchIndex(si: SearchIndex): string {
  const name = (si.name ?? si.apiName ?? si.label ?? "—") as string;
  const label = (si.label ?? "—") as string;
  const id = (si.id ?? "—") as string;
  const apiName = (si.apiName ?? "—") as string;
  const status = (si.status ?? "—") as string;
  return `• ${label} (name: ${name})\n  id: ${id} | apiName: ${apiName} | status: ${status}`;
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function handleGetSearchIndex(input: GetSearchIndexInput): Promise<string> {
  if (input.action === "config") {
    const config = await fetchSearchIndexConfig();
    return `Search Index Global Config:\n\n${JSON.stringify(config, null, 2)}`;
  }

  if (input.apiNameOrId) {
    const si = await fetchSearchIndex(input.apiNameOrId);
    return `Search Index:\n\n${formatSearchIndex(si)}`;
  }

  const indexes = await fetchSearchIndexes();
  if (indexes.length === 0) return "No search indexes found.";
  return `Found ${indexes.length} search index(es):\n\n${indexes.map(formatSearchIndex).join("\n\n")}`;
}
