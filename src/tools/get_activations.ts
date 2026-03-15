import { z } from "zod";
import {
  fetchActivations,
  fetchActivation,
  fetchActivationData,
  fetchActivationTargets,
  fetchActivationTarget,
  fetchActivationExternalPlatforms,
  Activation,
  ActivationTarget,
  ActivationExternalPlatform,
} from "../api/activations.js";

export const GetActivationsInputSchema = z.object({
  type: z
    .enum(["activations", "targets", "platforms"])
    .optional()
    .describe("Resource type: 'activations' (default), 'targets', or 'platforms'."),
  id: z
    .string()
    .optional()
    .describe("ID of a specific activation or target. Omit to list all."),
  action: z
    .enum(["data"])
    .optional()
    .describe("Sub-action: 'data' to fetch activation data (requires id)."),
  limit: z
    .number()
    .int()
    .min(1)
    .max(1000)
    .optional()
    .describe("Max number of results to return (default: 100)."),
});

export type GetActivationsInput = z.infer<typeof GetActivationsInputSchema>;

export const GET_ACTIVATIONS_TOOL = {
  name: "get_activations",
  description:
    "List or fetch activations, activation targets, or external activation platforms in Salesforce Data Cloud. " +
    "Use type='activations' (default) to work with activations, type='targets' for activation targets, " +
    "type='platforms' for external platforms. Provide an id to get a single record.",
  inputSchema: {
    type: "object" as const,
    properties: {
      type: {
        type: "string",
        enum: ["activations", "targets", "platforms"],
        description: "Resource type: 'activations' (default), 'targets', or 'platforms'.",
      },
      id: {
        type: "string",
        description: "ID of a specific activation or target. Omit to list all.",
      },
      action: {
        type: "string",
        enum: ["data"],
        description: "Sub-action: 'data' to fetch activation data rows (requires id).",
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

function formatActivation(a: Activation): string {
  const name = (a.name ?? a.label ?? "—") as string;
  const label = (a.label ?? "—") as string;
  const id = (a.id ?? "—") as string;
  const status = (a.status ?? "—") as string;
  const targetId = (a.activationTargetId ?? "—") as string;
  return `• ${label} (name: ${name})\n  id: ${id} | status: ${status} | targetId: ${targetId}`;
}

function formatTarget(t: ActivationTarget): string {
  const name = (t.name ?? t.label ?? "—") as string;
  const label = (t.label ?? "—") as string;
  const id = (t.id ?? "—") as string;
  const type = (t.type ?? "—") as string;
  const status = (t.status ?? "—") as string;
  return `• ${label} (name: ${name})\n  id: ${id} | type: ${type} | status: ${status}`;
}

function formatPlatform(p: ActivationExternalPlatform): string {
  const name = (p.name ?? p.label ?? "—") as string;
  const label = (p.label ?? "—") as string;
  const type = (p.type ?? "—") as string;
  return `• ${label} (name: ${name}) | type: ${type}`;
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function handleGetActivations(input: GetActivationsInput): Promise<string> {
  const limit = input.limit ?? 100;
  const resourceType = input.type ?? "activations";

  if (resourceType === "platforms") {
    const platforms = await fetchActivationExternalPlatforms(limit);
    if (platforms.length === 0) return "No activation external platforms found.";
    return `Found ${platforms.length} external platform(s):\n\n${platforms.map(formatPlatform).join("\n")}`;
  }

  if (resourceType === "targets") {
    if (input.id) {
      const target = await fetchActivationTarget(input.id);
      return `Activation Target:\n\n${formatTarget(target)}`;
    }
    const targets = await fetchActivationTargets(limit);
    if (targets.length === 0) return "No activation targets found.";
    return `Found ${targets.length} activation target(s):\n\n${targets.map(formatTarget).join("\n\n")}`;
  }

  // activations (default)
  if (input.id && input.action === "data") {
    const data = await fetchActivationData(input.id, limit);
    if (data.length === 0) return `No data found for activation "${input.id}".`;
    return `Activation data for "${input.id}" (${data.length} record(s)):\n\n${data.map((r) => JSON.stringify(r, null, 2)).join("\n\n")}`;
  }

  if (input.id) {
    const activation = await fetchActivation(input.id);
    return `Activation:\n\n${formatActivation(activation)}`;
  }

  const activations = await fetchActivations(limit);
  if (activations.length === 0) return "No activations found.";
  return `Found ${activations.length} activation(s):\n\n${activations.map(formatActivation).join("\n\n")}`;
}
