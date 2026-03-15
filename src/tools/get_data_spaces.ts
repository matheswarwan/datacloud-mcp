import { z } from "zod";
import {
  fetchDataSpaces,
  fetchDataSpace,
  fetchDataSpaceMembers,
  DataSpace,
  DataSpaceMember,
} from "../api/data_spaces.js";

export const GetDataSpacesInputSchema = z.object({
  idOrName: z
    .string()
    .optional()
    .describe("ID or name of a specific data space. Omit to list all."),
  action: z
    .enum(["list", "members"])
    .optional()
    .describe("Action to perform: 'list' (default) or 'members' to list members of a data space."),
  limit: z
    .number()
    .int()
    .min(1)
    .max(1000)
    .optional()
    .describe("Max number of results to return (default: 100)."),
});

export type GetDataSpacesInput = z.infer<typeof GetDataSpacesInputSchema>;

export const GET_DATA_SPACES_TOOL = {
  name: "get_data_spaces",
  description:
    "List all data spaces in the connected Salesforce Data Cloud org, fetch a specific data space by ID or name, " +
    "or list the members of a data space. Use this when asked about data spaces or their contents.",
  inputSchema: {
    type: "object" as const,
    properties: {
      idOrName: {
        type: "string",
        description: "ID or name of a specific data space. Omit to list all.",
      },
      action: {
        type: "string",
        enum: ["list", "members"],
        description: "Action: 'list' (default) or 'members' to list data space members.",
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

function formatDataSpace(ds: DataSpace): string {
  const name = (ds.name ?? ds.label ?? "—") as string;
  const label = (ds.label ?? "—") as string;
  const id = (ds.id ?? "—") as string;
  const status = (ds.status ?? "—") as string;
  const lines = [
    `• ${label} (name: ${name})`,
    `  id: ${id} | status: ${status}`,
  ];
  if (ds.description) lines.push(`  ${ds.description}`);
  return lines.join("\n");
}

function formatMember(m: DataSpaceMember): string {
  const name = (m.name ?? m.label ?? "—") as string;
  const label = (m.label ?? "—") as string;
  const type = (m.type ?? "—") as string;
  return `• ${label} (name: ${name}) | type: ${type}`;
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function handleGetDataSpaces(input: GetDataSpacesInput): Promise<string> {
  const limit = input.limit ?? 100;

  if (input.idOrName && input.action === "members") {
    const members = await fetchDataSpaceMembers(input.idOrName, limit);
    if (members.length === 0) return `No members found for data space "${input.idOrName}".`;
    return `Found ${members.length} member(s) for data space "${input.idOrName}":\n\n${members.map(formatMember).join("\n")}`;
  }

  if (input.idOrName) {
    const ds = await fetchDataSpace(input.idOrName);
    return `Data Space:\n\n${formatDataSpace(ds)}`;
  }

  const spaces = await fetchDataSpaces(limit);
  if (spaces.length === 0) return "No data spaces found in this Data Cloud org.";
  return `Found ${spaces.length} data space(s):\n\n${spaces.map(formatDataSpace).join("\n\n")}`;
}
