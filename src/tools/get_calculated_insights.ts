import { z } from "zod";
import {
  fetchCalculatedInsights,
  fetchCalculatedInsight,
  CalculatedInsight,
} from "../api/calculated_insights.js";

export const GetCalculatedInsightsInputSchema = z.object({
  name: z
    .string()
    .optional()
    .describe(
      "Optional: exact name of a single calculated insight to retrieve. " +
        "If omitted, all calculated insights are returned."
    ),
});

export type GetCalculatedInsightsInput = z.infer<typeof GetCalculatedInsightsInputSchema>;

export const GET_CALCULATED_INSIGHTS_TOOL = {
  name: "get_calculated_insights",
  description:
    "List all Calculated Insights in the connected Data Cloud org, or retrieve a single one by name. " +
    "Returns name, label, description, status, and SQL for each.",
  inputSchema: {
    type: "object" as const,
    properties: {
      name: {
        type: "string",
        description:
          "Exact name of a single calculated insight. Omit to list all.",
      },
    },
    required: [],
  },
};

function formatCI(ci: CalculatedInsight): string {
  const name        = ci.apiName ?? "—";
  const displayName = ci.displayName ? ` (${ci.displayName})` : "";
  const status      = ci.calculatedInsightStatus ?? "—";
  const defStatus   = ci.definitionStatus ? ` / ${ci.definitionStatus}` : "";
  const type        = ci.definitionType ? ` [${ci.definitionType}]` : "";
  const description = ci.description ? `\n  Description: ${ci.description}` : "";
  const lastRun     = ci.lastRunDateTime
    ? `\n  Last run: ${ci.lastRunDateTime} — ${ci.lastRunStatus ?? "unknown"}`
    : "";

  const dimensions = (ci.dimensions ?? [])
    .map((d) => `    • ${d.displayName ?? d.apiName} [${d.dataType ?? "?"}] — ${d.formula ?? ""}`)
    .join("\n");
  const measures = (ci.measures ?? [])
    .map((m) => `    • ${m.displayName ?? m.apiName} [${m.dataType ?? "?"}] — ${m.formula ?? ""}`)
    .join("\n");

  const sql = ci.expression
    ? `\n  SQL:\n\`\`\`sql\n${ci.expression}\n\`\`\``
    : "";

  return [
    `### ${name}${displayName}${type}`,
    `  Status: ${status}${defStatus}${description}${lastRun}`,
    dimensions ? `  Dimensions:\n${dimensions}` : "",
    measures   ? `  Measures:\n${measures}` : "",
    sql,
  ].filter(Boolean).join("\n");
}

export async function handleGetCalculatedInsights(
  input: GetCalculatedInsightsInput
): Promise<string> {
  if (input.name) {
    // Try direct fetch first; fall back to filtering the list
    try {
      const ci = await fetchCalculatedInsight(input.name);
      return formatCI(ci);
    } catch {
      const all = await fetchCalculatedInsights();
      const match = all.find(
        (c) => c.apiName === input.name || c.displayName?.toLowerCase() === input.name!.toLowerCase()
      );
      if (!match) return `No calculated insight found with name "${input.name}".`;
      return formatCI(match);
    }
  }

  const all = await fetchCalculatedInsights();
  if (all.length === 0) {
    return "No calculated insights found in this Data Cloud org.";
  }

  return `Found ${all.length} calculated insight(s):\n\n${all.map(formatCI).join("\n\n---\n\n")}`;
}
