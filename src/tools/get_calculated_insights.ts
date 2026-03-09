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
  const name = ci.calculatedInsightName ?? ci.name ?? "—";
  const label = ci.label ? ` (${ci.label})` : "";
  const status = ci.status ?? "—";
  const description = ci.description ? `\n  Description: ${ci.description}` : "";
  const sql = ci.sql ? `\n  SQL:\n\`\`\`sql\n${ci.sql}\n\`\`\`` : "";

  // Show any extra fields not already handled
  const shown = new Set(["calculatedInsightName", "name", "label", "status", "description", "sql"]);
  const extras = Object.entries(ci)
    .filter(([k]) => !shown.has(k))
    .map(([k, v]) => `  ${k}: ${JSON.stringify(v)}`)
    .join("\n");

  return `### ${name}${label}\n  Status: ${status}${description}${sql}${extras ? `\n${extras}` : ""}`;
}

export async function handleGetCalculatedInsights(
  input: GetCalculatedInsightsInput
): Promise<string> {
  if (input.name) {
    const ci = await fetchCalculatedInsight(input.name);
    return formatCI(ci);
  }

  const all = await fetchCalculatedInsights();
  if (all.length === 0) {
    return "No calculated insights found in this Data Cloud org.";
  }

  return `Found ${all.length} calculated insight(s):\n\n${all.map(formatCI).join("\n\n---\n\n")}`;
}
