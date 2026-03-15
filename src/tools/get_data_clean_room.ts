import { z } from "zod";
import {
  fetchCleanRoomCollaborations,
  fetchCleanRoomCollaborationJobs,
  fetchCleanRoomProviders,
  fetchCleanRoomProvider,
  fetchCleanRoomSpecifications,
  fetchCleanRoomTemplates,
  CleanRoomCollaboration,
  CleanRoomProvider,
} from "../api/data_clean_room.js";

export const GetDataCleanRoomInputSchema = z.object({
  type: z
    .enum(["collaborations", "providers", "specifications", "templates"])
    .optional()
    .describe("Resource type: 'collaborations' (default), 'providers', 'specifications', or 'templates'."),
  idOrName: z
    .string()
    .optional()
    .describe("ID or name of a specific collaboration or provider. Omit to list all."),
  action: z
    .enum(["jobs"])
    .optional()
    .describe("Sub-action: 'jobs' to list collaboration jobs (requires idOrName and type='collaborations')."),
  limit: z
    .number()
    .int()
    .min(1)
    .max(1000)
    .optional()
    .describe("Max number of results to return (default: 100)."),
});

export type GetDataCleanRoomInput = z.infer<typeof GetDataCleanRoomInputSchema>;

export const GET_DATA_CLEAN_ROOM_TOOL = {
  name: "get_data_clean_room",
  description:
    "Access Salesforce Data Cloud clean room resources: collaborations, providers, specifications, and templates. " +
    "Use type='collaborations' (default) to list/get collaborations or their jobs, " +
    "type='providers' for clean room providers, 'specifications' or 'templates' for those resources.",
  inputSchema: {
    type: "object" as const,
    properties: {
      type: {
        type: "string",
        enum: ["collaborations", "providers", "specifications", "templates"],
        description: "Resource type.",
      },
      idOrName: {
        type: "string",
        description: "ID or name of a specific collaboration or provider.",
      },
      action: {
        type: "string",
        enum: ["jobs"],
        description: "Sub-action: 'jobs' to list collaboration jobs.",
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

function formatCollaboration(c: CleanRoomCollaboration): string {
  const name = (c.name ?? c.label ?? "—") as string;
  const label = (c.label ?? "—") as string;
  const id = (c.id ?? "—") as string;
  const status = (c.status ?? "—") as string;
  return `• ${label} (name: ${name})\n  id: ${id} | status: ${status}`;
}

function formatProvider(p: CleanRoomProvider): string {
  const name = (p.name ?? "—") as string;
  const id = (p.id ?? "—") as string;
  return `• ${name} | id: ${id}`;
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function handleGetDataCleanRoom(input: GetDataCleanRoomInput): Promise<string> {
  const limit = input.limit ?? 100;
  const resourceType = input.type ?? "collaborations";

  if (resourceType === "specifications") {
    const specs = await fetchCleanRoomSpecifications(limit);
    if (specs.length === 0) return "No clean room specifications found.";
    return `Found ${specs.length} specification(s):\n\n${specs.map((s) => JSON.stringify(s, null, 2)).join("\n\n")}`;
  }

  if (resourceType === "templates") {
    const templates = await fetchCleanRoomTemplates(limit);
    if (templates.length === 0) return "No clean room templates found.";
    return `Found ${templates.length} template(s):\n\n${templates.map((t) => JSON.stringify(t, null, 2)).join("\n\n")}`;
  }

  if (resourceType === "providers") {
    if (input.idOrName) {
      const provider = await fetchCleanRoomProvider(input.idOrName);
      return `Clean Room Provider:\n\n${formatProvider(provider)}`;
    }
    const providers = await fetchCleanRoomProviders(limit);
    if (providers.length === 0) return "No clean room providers found.";
    return `Found ${providers.length} provider(s):\n\n${providers.map(formatProvider).join("\n")}`;
  }

  // collaborations (default)
  if (input.idOrName && input.action === "jobs") {
    const jobs = await fetchCleanRoomCollaborationJobs(input.idOrName, limit);
    if (jobs.length === 0) return `No jobs found for collaboration "${input.idOrName}".`;
    return `Found ${jobs.length} job(s) for collaboration "${input.idOrName}":\n\n${jobs.map((j) => JSON.stringify(j, null, 2)).join("\n\n")}`;
  }

  const collaborations = await fetchCleanRoomCollaborations(limit);
  if (collaborations.length === 0) return "No clean room collaborations found.";
  return `Found ${collaborations.length} collaboration(s):\n\n${collaborations.map(formatCollaboration).join("\n\n")}`;
}
