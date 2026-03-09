import { z } from "zod";
import { runCalculatedInsight } from "../api/calculated_insights.js";

export const RunCalculatedInsightInputSchema = z.object({
  name: z
    .string()
    .describe("The API name of the calculated insight to run."),
});

export type RunCalculatedInsightInput = z.infer<typeof RunCalculatedInsightInputSchema>;

export const RUN_CALCULATED_INSIGHT_TOOL = {
  name: "run_calculated_insight",
  description:
    "Run (execute) a Calculated Insight by name to refresh its computed data. " +
    "Call this after creating a CI or when you want to refresh its results.",
  inputSchema: {
    type: "object" as const,
    properties: {
      name: {
        type: "string",
        description: "The API name of the calculated insight to run.",
      },
    },
    required: ["name"],
  },
};

export async function handleRunCalculatedInsight(
  input: RunCalculatedInsightInput
): Promise<string> {
  const result = await runCalculatedInsight(input.name);

  return [
    `Calculated Insight "${input.name}" triggered successfully.`,
    ``,
    `Full response:`,
    `\`\`\`json`,
    JSON.stringify(result, null, 2),
    `\`\`\``,
  ].join("\n");
}
