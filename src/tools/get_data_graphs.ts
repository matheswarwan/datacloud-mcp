import { z } from "zod";
import {
  fetchDataGraphsMetadata,
  fetchDataGraph,
  fetchDataGraphDataByLookup,
  fetchDataGraphDataById,
  DataGraphMetadata,
  DataGraph,
} from "../api/data_graphs.js";

export const GetDataGraphsInputSchema = z.object({
  dataGraphName: z
    .string()
    .optional()
    .describe("Developer name of a specific Data Graph to fetch. Omit to list metadata for all."),
  dataspace: z
    .string()
    .optional()
    .describe("Filter by data space name (used when listing metadata or fetching data)."),
  action: z
    .enum(["metadata", "data-lookup", "data-by-id"])
    .optional()
    .describe("Action: 'metadata' (default) to list/get graph metadata, 'data-lookup' to get data by lookup keys, 'data-by-id' to get a record by ID."),
  entityName: z
    .string()
    .optional()
    .describe("Entity name for data-lookup or data-by-id actions."),
  lookupKeys: z
    .string()
    .optional()
    .describe("Comma-separated lookup keys for action='data-lookup'."),
  recordId: z
    .string()
    .optional()
    .describe("Record ID for action='data-by-id'."),
  live: z
    .boolean()
    .optional()
    .describe("Whether to fetch live data (for action='data-by-id', default: false)."),
});

export type GetDataGraphsInput = z.infer<typeof GetDataGraphsInputSchema>;

export const GET_DATA_GRAPHS_TOOL = {
  name: "get_data_graphs",
  description:
    "List all Data Graph metadata in the connected Salesforce Data Cloud org, " +
    "or fetch full details of a specific Data Graph by developer name. " +
    "Use action='data-lookup' with entityName and lookupKeys to query graph data by lookup. " +
    "Use action='data-by-id' with entityName and recordId to get a specific record. " +
    "Use this when asked about data graphs, data application objects (DAO), or their structure.",
  inputSchema: {
    type: "object" as const,
    properties: {
      dataGraphName: {
        type: "string",
        description: "Developer name of a specific Data Graph. Omit to list all.",
      },
      dataspace: {
        type: "string",
        description: "Filter by data space name.",
      },
      action: {
        type: "string",
        enum: ["metadata", "data-lookup", "data-by-id"],
        description: "Action: 'metadata' (default), 'data-lookup', or 'data-by-id'.",
      },
      entityName: {
        type: "string",
        description: "Entity name for data-lookup or data-by-id actions.",
      },
      lookupKeys: {
        type: "string",
        description: "Comma-separated lookup keys for action='data-lookup'.",
      },
      recordId: {
        type: "string",
        description: "Record ID for action='data-by-id'.",
      },
      live: {
        type: "boolean",
        description: "Fetch live data for action='data-by-id' (default: false).",
      },
    },
    required: [],
  },
};

// ── Formatters ────────────────────────────────────────────────────────────────

function formatMetadata(m: DataGraphMetadata, index: number): string {
  const name = (m.developerName ?? `DataGraph #${index + 1}`) as string;
  const status = (m.status ?? "—") as string;
  const space = (m.dataspaceName ?? "—") as string;
  const primary = (m.primaryObjectName ?? "—") as string;
  const lines = [
    `• ${name} — status: ${status} | dataspace: ${space}`,
    `  primaryObject: ${primary}`,
  ];
  if (m.description) lines.push(`  ${m.description}`);
  if (m.dgObject?.relatedObjects && Array.isArray(m.dgObject.relatedObjects)) {
    lines.push(`  relatedObjects: ${m.dgObject.relatedObjects.map((r) => r.developerName ?? "?").join(", ")}`);
  }
  return lines.join("\n");
}

function formatDataGraph(dg: DataGraph): string {
  const name = (dg.name ?? dg.label ?? "—") as string;
  const label = (dg.label ?? "—") as string;
  const status = (dg.status ?? "—") as string;
  const space = (dg.dataspaceName ?? "—") as string;
  const kind = (dg.kind ?? dg.type ?? "—") as string;
  const lastRun = (dg.lastRunStatus ?? "—") as string;

  const lines = [
    `• ${label} (name: ${name})`,
    `  status: ${status} | kind: ${kind} | dataspace: ${space} | lastRunStatus: ${lastRun}`,
  ];
  if (dg.primaryObjectName) lines.push(`  primaryObject: ${dg.primaryObjectName}`);
  if (dg.idDmoName) lines.push(`  idDmo: ${dg.idDmoName} | valuesDmo: ${dg.valuesDmoName ?? "—"}`);
  if (dg.description) lines.push(`  ${dg.description}`);
  return lines.join("\n");
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function handleGetDataGraphs(input: GetDataGraphsInput): Promise<string> {
  if (input.action === "data-lookup") {
    if (!input.entityName) return "Error: entityName is required for action='data-lookup'.";
    if (!input.lookupKeys) return "Error: lookupKeys is required for action='data-lookup'.";
    const keys = input.lookupKeys.split(",").map((k) => k.trim()).filter(Boolean);
    const data = await fetchDataGraphDataByLookup(input.entityName, keys);
    return `Data Graph lookup for entity "${input.entityName}" with keys [${keys.join(", ")}]:\n\n${JSON.stringify(data, null, 2)}`;
  }

  if (input.action === "data-by-id") {
    if (!input.entityName) return "Error: entityName is required for action='data-by-id'.";
    if (!input.recordId) return "Error: recordId is required for action='data-by-id'.";
    const data = await fetchDataGraphDataById(input.entityName, input.recordId, input.dataspace, input.live ?? false);
    return `Data Graph record for entity "${input.entityName}", id "${input.recordId}":\n\n${JSON.stringify(data, null, 2)}`;
  }

  if (input.dataGraphName) {
    const dg = await fetchDataGraph(input.dataGraphName);
    return `Data Graph:\n\n${formatDataGraph(dg)}`;
  }

  const graphs = await fetchDataGraphsMetadata(input.dataspace);

  if (graphs.length === 0) {
    return "No Data Graphs found in this Data Cloud org.";
  }

  const lines = graphs.map((g, i) => formatMetadata(g, i));
  return `Found ${graphs.length} Data Graph(s):\n\n${lines.join("\n\n")}`;
}
