import { z } from "zod";
import {
  fetchDataKitComponentDependencies,
  fetchDataKitComponentDeploymentStatus,
  DataKitDependency,
  DataKitDeploymentStatus,
} from "../api/data_kits.js";

export const GetDataKitsInputSchema = z.object({
  dataKitName: z
    .string()
    .describe("Name of the data kit."),
  componentName: z
    .string()
    .describe("Name of the component within the data kit."),
  action: z
    .enum(["dependencies", "deployment-status"])
    .optional()
    .describe("Action: 'dependencies' (default) or 'deployment-status'."),
  componentType: z
    .string()
    .optional()
    .describe("Component type filter for dependencies."),
  dataspace: z
    .string()
    .optional()
    .describe("Data space name to scope the query."),
});

export type GetDataKitsInput = z.infer<typeof GetDataKitsInputSchema>;

export const GET_DATA_KITS_TOOL = {
  name: "get_data_kits",
  description:
    "Access data kit component information in Salesforce Data Cloud. " +
    "Get component dependencies or deployment status for a specific data kit component. " +
    "Both dataKitName and componentName are required.",
  inputSchema: {
    type: "object" as const,
    properties: {
      dataKitName: {
        type: "string",
        description: "Name of the data kit.",
      },
      componentName: {
        type: "string",
        description: "Name of the component within the data kit.",
      },
      action: {
        type: "string",
        enum: ["dependencies", "deployment-status"],
        description: "Action: 'dependencies' (default) or 'deployment-status'.",
      },
      componentType: {
        type: "string",
        description: "Component type filter for dependencies.",
      },
      dataspace: {
        type: "string",
        description: "Data space name.",
      },
    },
    required: ["dataKitName", "componentName"],
  },
};

// ── Handler ───────────────────────────────────────────────────────────────────

export async function handleGetDataKits(input: GetDataKitsInput): Promise<string> {
  const action = input.action ?? "dependencies";

  if (action === "deployment-status") {
    const status = await fetchDataKitComponentDeploymentStatus(input.dataKitName, input.componentName);
    const statusValue = (status.status ?? "—") as string;
    const lines = [
      `Deployment Status for component "${input.componentName}" in kit "${input.dataKitName}":`,
      `  status: ${statusValue}`,
    ];
    Object.entries(status)
      .filter(([k]) => k !== "status")
      .forEach(([k, v]) => lines.push(`  ${k}: ${JSON.stringify(v)}`));
    return lines.join("\n");
  }

  // dependencies (default)
  const deps = await fetchDataKitComponentDependencies(
    input.dataKitName,
    input.componentName,
    input.componentType,
    input.dataspace
  );

  if (deps.length === 0) {
    return `No dependencies found for component "${input.componentName}" in kit "${input.dataKitName}".`;
  }

  return `Found ${deps.length} dependency/dependencies for component "${input.componentName}" in kit "${input.dataKitName}":\n\n${deps.map((d) => JSON.stringify(d, null, 2)).join("\n\n")}`;
}
