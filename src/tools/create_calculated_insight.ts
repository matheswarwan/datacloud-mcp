import { z } from "zod";
import { createCalculatedInsight } from "../api/calculated_insights.js";

export const CreateCalculatedInsightInputSchema = z.object({
  name: z
    .string()
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, "Name must start with a letter and contain only letters, numbers, and underscores.")
    .describe("API name for the calculated insight, e.g. 'RevenuePerCustomer'."),
  label: z
    .string()
    .optional()
    .describe("Human-readable label (defaults to name)."),
  description: z
    .string()
    .optional()
    .describe("Short description of what this CI computes."),
  sql: z
    .string()
    .min(10)
    .describe("The SQL query for this calculated insight."),
});

export type CreateCalculatedInsightInput = z.infer<typeof CreateCalculatedInsightInputSchema>;

export const CREATE_CALCULATED_INSIGHT_TOOL = {
  name: "create_calculated_insight",
  description:
    "Create a new Calculated Insight in Data Cloud. " +
    "Only call this after the user has reviewed and approved the SQL from propose_ci_sql. " +
    "Requires a name, SQL query, and optional label/description.",
  inputSchema: {
    type: "object" as const,
    properties: {
      name: {
        type: "string",
        description: "API name, e.g. 'RevenuePerCustomer'. Letters, numbers, underscores only.",
      },
      label: {
        type: "string",
        description: "Human-readable label.",
      },
      description: {
        type: "string",
        description: "What this CI computes.",
      },
      sql: {
        type: "string",
        description: "The SQL query.",
      },
    },
    required: ["name", "sql"],
  },
};

export async function handleCreateCalculatedInsight(
  input: CreateCalculatedInsightInput
): Promise<string> {
  const result = await createCalculatedInsight({
    calculatedInsightName: input.name,
    label: input.label ?? input.name,
    description: input.description,
    sql: input.sql,
  });

  const id = result.calculatedInsightName ?? result.name ?? input.name;
  const status = result.status ?? "unknown";

  return [
    `Calculated Insight created successfully!`,
    ``,
    `**Name:** ${id}`,
    `**Status:** ${status}`,
    ...(input.description ? [`**Description:** ${input.description}`] : []),
    ``,
    `Full response:`,
    `\`\`\`json`,
    JSON.stringify(result, null, 2),
    `\`\`\``,
    ``,
    `You can now run it with run_calculated_insight.`,
  ].join("\n");
}
