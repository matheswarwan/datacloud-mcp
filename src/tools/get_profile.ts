import { z } from "zod";
import {
  fetchProfileMetadata,
  fetchProfileMetadataByName,
  fetchProfileRecords,
  fetchProfileRecord,
  ProfileMetadata,
  ProfileRecord,
} from "../api/profile.js";

export const GetProfileInputSchema = z.object({
  action: z
    .enum(["metadata", "records"])
    .optional()
    .describe("Action: 'metadata' (default) to list/get profile metadata, 'records' to fetch profile records."),
  dataModelName: z
    .string()
    .optional()
    .describe("Data model name. For metadata: get single entry. For records: required to specify which model."),
  id: z
    .string()
    .optional()
    .describe("Record ID for fetching a single profile record (requires dataModelName and action='records')."),
  filters: z
    .string()
    .optional()
    .describe("Filter expression for profile records query."),
  limit: z
    .number()
    .int()
    .min(1)
    .max(1000)
    .optional()
    .describe("Max number of results to return (default: 100)."),
});

export type GetProfileInput = z.infer<typeof GetProfileInputSchema>;

export const GET_PROFILE_TOOL = {
  name: "get_profile",
  description:
    "Access Salesforce Data Cloud profile data. Use action='metadata' (default) to list or get profile metadata " +
    "for data models, or action='records' with a dataModelName to fetch individual profile records. " +
    "Use this when asked about unified profiles, profile data, or profile records.",
  inputSchema: {
    type: "object" as const,
    properties: {
      action: {
        type: "string",
        enum: ["metadata", "records"],
        description: "Action: 'metadata' or 'records'.",
      },
      dataModelName: {
        type: "string",
        description: "Data model name. Required for action='records'. For metadata, fetches single entry.",
      },
      id: {
        type: "string",
        description: "Record ID (requires dataModelName + action='records').",
      },
      filters: {
        type: "string",
        description: "Filter expression for profile records.",
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

function formatMetadata(m: ProfileMetadata): string {
  const name = (m.name ?? "—") as string;
  const label = (m.label ?? "—") as string;
  const lines = [`• ${label} (name: ${name})`];
  const shown = new Set(["name", "label"]);
  Object.entries(m).filter(([k]) => !shown.has(k)).forEach(([k, v]) => {
    lines.push(`  ${k}: ${JSON.stringify(v)}`);
  });
  return lines.join("\n");
}

function formatRecord(r: ProfileRecord): string {
  const id = (r.id ?? "—") as string;
  const lines = [`• id: ${id}`];
  Object.entries(r).filter(([k]) => k !== "id").slice(0, 10).forEach(([k, v]) => {
    lines.push(`  ${k}: ${JSON.stringify(v)}`);
  });
  return lines.join("\n");
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function handleGetProfile(input: GetProfileInput): Promise<string> {
  const limit = input.limit ?? 100;
  const action = input.action ?? (input.dataModelName && !input.id ? "metadata" : "metadata");

  if (action === "records") {
    if (!input.dataModelName) return "Error: dataModelName is required for action='records'.";

    if (input.id) {
      const record = await fetchProfileRecord(input.dataModelName, input.id);
      return `Profile Record:\n\n${formatRecord(record)}`;
    }

    const records = await fetchProfileRecords(input.dataModelName, input.filters, limit);
    if (records.length === 0) return `No profile records found for "${input.dataModelName}".`;
    return `Found ${records.length} profile record(s) for "${input.dataModelName}":\n\n${records.map(formatRecord).join("\n\n")}`;
  }

  // metadata (default)
  if (input.dataModelName) {
    const meta = await fetchProfileMetadataByName(input.dataModelName);
    return `Profile Metadata:\n\n${formatMetadata(meta)}`;
  }

  const metaList = await fetchProfileMetadata(limit);
  if (metaList.length === 0) return "No profile metadata found.";
  return `Found ${metaList.length} profile metadata entry/entries:\n\n${metaList.map(formatMetadata).join("\n\n")}`;
}
