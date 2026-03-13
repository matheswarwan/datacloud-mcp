import { z } from "zod";
import { fetchDataTransforms, fetchDataTransform, DataTransform } from "../api/data_transforms.js";

export const GetDataTransformsInputSchema = z.object({
  name_or_id: z
    .string()
    .optional()
    .describe("Name or ID of a specific data transform to retrieve. Omit to list all."),
  limit: z
    .number()
    .int()
    .min(1)
    .max(1000)
    .optional()
    .describe("Max number of data transforms to return when listing all (default: 100)."),
});

export type GetDataTransformsInput = z.infer<typeof GetDataTransformsInputSchema>;

export const GET_DATA_TRANSFORMS_TOOL = {
  name: "get_data_transforms",
  description:
    "List all data transforms or retrieve a single data transform by name or ID. " +
    "Use without arguments to list all, or provide name_or_id to get details for one. " +
    "Uses GET /ssot/data-transforms or GET /ssot/data-transforms/{nameOrId}.",
  inputSchema: {
    type: "object" as const,
    properties: {
      name_or_id: {
        type: "string",
        description: "Name or ID of a specific data transform. Omit to list all.",
      },
      limit: {
        type: "number",
        description: "Max number of results when listing all (default: 100).",
      },
    },
    required: [],
  },
};

function formatTransform(t: DataTransform): string {
  const name = (t["name"] ?? t["developerName"] ?? t["label"] ?? "—") as string;
  const id = (t["id"] ?? t["uuid"] ?? "—") as string;
  const status = (t["status"] ?? t["state"] ?? "—") as string;
  const type = (t["type"] ?? t["transformType"] ?? "") as string;

  const shown = new Set(["name", "developerName", "label", "id", "uuid", "status", "state", "type", "transformType"]);
  const extras = Object.entries(t)
    .filter(([k]) => !shown.has(k))
    .map(([k, v]) => `  ${k}: ${JSON.stringify(v)}`)
    .join("\n");

  const header = `### ${name}${type ? ` (${type})` : ""}`;
  const meta = [`  id: ${id}`, `  status: ${status}`].join("\n");
  return extras ? `${header}\n${meta}\n${extras}` : `${header}\n${meta}`;
}

export async function handleGetDataTransforms(input: GetDataTransformsInput): Promise<string> {
  if (input.name_or_id) {
    const transform = await fetchDataTransform(input.name_or_id);
    return `Data transform details:\n\n${formatTransform(transform)}`;
  }

  const transforms = await fetchDataTransforms(input.limit ?? 100);

  if (transforms.length === 0) {
    return "No data transforms found in this Data Cloud org.";
  }

  return `Found ${transforms.length} data transform(s):\n\n${transforms.map(formatTransform).join("\n\n")}`;
}
