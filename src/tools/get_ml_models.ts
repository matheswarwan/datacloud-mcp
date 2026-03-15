import { z } from "zod";
import {
  fetchConfiguredModels,
  fetchConfiguredModel,
  fetchModelArtifacts,
  fetchModelArtifact,
  fetchModelSetupVersions,
  ConfiguredModel,
  ModelArtifact,
} from "../api/machine_learning.js";

export const GetMlModelsInputSchema = z.object({
  type: z
    .enum(["configured", "artifacts", "setup-versions"])
    .optional()
    .describe("Resource type: 'configured' (default), 'artifacts', or 'setup-versions'."),
  idOrName: z
    .string()
    .optional()
    .describe("ID or name of a specific model. Omit to list all."),
  modelSetupId: z
    .string()
    .optional()
    .describe("Model setup ID (required for type='setup-versions')."),
  limit: z
    .number()
    .int()
    .min(1)
    .max(1000)
    .optional()
    .describe("Max number of results to return (default: 100)."),
});

export type GetMlModelsInput = z.infer<typeof GetMlModelsInputSchema>;

export const GET_ML_MODELS_TOOL = {
  name: "get_ml_models",
  description:
    "Access machine learning models in Salesforce Data Cloud. " +
    "Use type='configured' (default) for configured ML models, " +
    "type='artifacts' for model artifacts, " +
    "type='setup-versions' with modelSetupId to get setup versions. " +
    "Provide idOrName to get a single model.",
  inputSchema: {
    type: "object" as const,
    properties: {
      type: {
        type: "string",
        enum: ["configured", "artifacts", "setup-versions"],
        description: "Resource type: 'configured' (default), 'artifacts', or 'setup-versions'.",
      },
      idOrName: {
        type: "string",
        description: "ID or name of a specific model. Omit to list all.",
      },
      modelSetupId: {
        type: "string",
        description: "Model setup ID (required for type='setup-versions').",
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

function formatConfiguredModel(m: ConfiguredModel): string {
  const name = (m.name ?? m.label ?? "—") as string;
  const label = (m.label ?? "—") as string;
  const id = (m.id ?? "—") as string;
  const modelType = (m.modelType ?? "—") as string;
  const status = (m.status ?? "—") as string;
  return `• ${label} (name: ${name})\n  id: ${id} | modelType: ${modelType} | status: ${status}`;
}

function formatModelArtifact(a: ModelArtifact): string {
  const name = (a.name ?? a.label ?? "—") as string;
  const label = (a.label ?? "—") as string;
  const id = (a.id ?? "—") as string;
  const modelType = (a.modelType ?? "—") as string;
  return `• ${label} (name: ${name})\n  id: ${id} | modelType: ${modelType}`;
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function handleGetMlModels(input: GetMlModelsInput): Promise<string> {
  const limit = input.limit ?? 100;
  const resourceType = input.type ?? "configured";

  if (resourceType === "setup-versions") {
    if (!input.modelSetupId) return "Error: modelSetupId is required for type='setup-versions'.";
    const versions = await fetchModelSetupVersions(input.modelSetupId, limit);
    if (versions.length === 0) return `No setup versions found for model setup "${input.modelSetupId}".`;
    return `Found ${versions.length} setup version(s) for "${input.modelSetupId}":\n\n${versions.map((v) => JSON.stringify(v, null, 2)).join("\n\n")}`;
  }

  if (resourceType === "artifacts") {
    if (input.idOrName) {
      const artifact = await fetchModelArtifact(input.idOrName);
      return `Model Artifact:\n\n${formatModelArtifact(artifact)}`;
    }
    const artifacts = await fetchModelArtifacts(limit);
    if (artifacts.length === 0) return "No model artifacts found.";
    return `Found ${artifacts.length} model artifact(s):\n\n${artifacts.map(formatModelArtifact).join("\n\n")}`;
  }

  // configured (default)
  if (input.idOrName) {
    const model = await fetchConfiguredModel(input.idOrName);
    return `Configured Model:\n\n${formatConfiguredModel(model)}`;
  }

  const models = await fetchConfiguredModels(limit);
  if (models.length === 0) return "No configured models found.";
  return `Found ${models.length} configured model(s):\n\n${models.map(formatConfiguredModel).join("\n\n")}`;
}
