import { z } from "zod";
import {
  fetchDataActions,
  fetchDataActionTargets,
  fetchDataActionTarget,
  DataAction,
  DataActionTarget,
} from "../api/data_actions.js";

export const GetDataActionsInputSchema = z.object({
  type: z
    .enum(["actions", "targets"])
    .optional()
    .describe('What to list: "actions" for Data Actions, "targets" for Data Action Targets. Defaults to "actions".'),
  apiName: z
    .string()
    .optional()
    .describe("API name of a specific Data Action Target to fetch details for."),
  dataspace: z
    .string()
    .optional()
    .describe("Filter data actions by data space name."),
  limit: z
    .number()
    .int()
    .min(1)
    .max(1000)
    .optional()
    .describe("Max number of items to return (default: 100)."),
});

export type GetDataActionsInput = z.infer<typeof GetDataActionsInputSchema>;

export const GET_DATA_ACTIONS_TOOL = {
  name: "get_data_actions",
  description:
    "List Data Actions or Data Action Targets in the connected Salesforce Data Cloud org. " +
    'Use type="actions" (default) for Data Actions, type="targets" for Data Action Targets. ' +
    "Provide apiName to fetch a specific Data Action Target.",
  inputSchema: {
    type: "object" as const,
    properties: {
      type: {
        type: "string",
        enum: ["actions", "targets"],
        description: 'What to list: "actions" or "targets". Defaults to "actions".',
      },
      apiName: {
        type: "string",
        description: "API name of a specific Data Action Target to fetch.",
      },
      dataspace: {
        type: "string",
        description: "Filter data actions by data space name.",
      },
      limit: {
        type: "number",
        description: "Max number of items to return (default: 100).",
      },
    },
    required: [],
  },
};

// ── Formatters ────────────────────────────────────────────────────────────────

function formatDataAction(a: DataAction, index: number): string {
  const name = (a.masterLabel ?? a.developerName ?? a.apiName ?? `Action #${index + 1}`) as string;
  const apiName = (a.apiName ?? a.developerName ?? "—") as string;
  const status = (a.status ?? "—") as string;
  const space = (a.dataspace ?? "—") as string;
  const targets = Array.isArray(a.dataActionTargetNames)
    ? a.dataActionTargetNames.join(", ")
    : "—";

  const lines = [
    `• ${name} (apiName: ${apiName}) — status: ${status} | dataspace: ${space}`,
    `  targets: ${targets}`,
  ];
  if (a.description) lines.push(`  ${a.description}`);
  return lines.join("\n");
}

function formatDataActionTarget(t: DataActionTarget, index: number): string {
  const label = (t.label ?? t.apiName ?? `Target #${index + 1}`) as string;
  const apiName = (t.apiName ?? "—") as string;
  const type = (t.type ?? "—") as string;
  const status = (t.status ?? "—") as string;

  const lines = [`• ${label} (apiName: ${apiName}) — type: ${type} | status: ${status}`];
  if (t.config) {
    const endpoint = (t.config as Record<string, unknown>).targetEndpoint as string | undefined;
    if (endpoint) lines.push(`  endpoint: ${endpoint}`);
  }
  return lines.join("\n");
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function handleGetDataActions(input: GetDataActionsInput): Promise<string> {
  const listType = input.type ?? "actions";

  // Fetch single target by apiName
  if (input.apiName) {
    const target = await fetchDataActionTarget(input.apiName);
    return `Data Action Target:\n\n${formatDataActionTarget(target, 0)}`;
  }

  if (listType === "targets") {
    const targets = await fetchDataActionTargets(input.limit ?? 100);
    if (targets.length === 0) return "No Data Action Targets found in this Data Cloud org.";
    const lines = targets.map((t, i) => formatDataActionTarget(t, i));
    return `Found ${targets.length} Data Action Target(s):\n\n${lines.join("\n\n")}`;
  }

  // Default: actions
  const actions = await fetchDataActions(input.limit ?? 100, input.dataspace);
  if (actions.length === 0) return "No Data Actions found in this Data Cloud org.";
  const lines = actions.map((a, i) => formatDataAction(a, i));
  return `Found ${actions.length} Data Action(s):\n\n${lines.join("\n\n")}`;
}
