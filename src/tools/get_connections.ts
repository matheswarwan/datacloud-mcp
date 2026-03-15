import { z } from "zod";
import {
  fetchConnections,
  fetchConnection,
  fetchConnectionEndpoints,
  fetchConnectionSchema,
  fetchConnectors,
  fetchConnector,
  Connection,
  Connector,
} from "../api/connections.js";

export const GetConnectionsInputSchema = z.object({
  type: z
    .enum(["connections", "connectors"])
    .optional()
    .describe("Resource type: 'connections' (default) or 'connectors'."),
  connectionId: z
    .string()
    .optional()
    .describe("ID or name of a specific connection or connector type. Omit to list all."),
  detail: z
    .enum(["endpoints", "schema"])
    .optional()
    .describe("Sub-resource to fetch: 'endpoints' or 'schema' (requires connectionId)."),
  limit: z
    .number()
    .int()
    .min(1)
    .max(1000)
    .optional()
    .describe("Max number of results to return (default: 100)."),
});

export type GetConnectionsInput = z.infer<typeof GetConnectionsInputSchema>;

export const GET_CONNECTIONS_TOOL = {
  name: "get_connections",
  description:
    "List or fetch data connections and connectors in Salesforce Data Cloud. " +
    "Use type='connections' (default) to work with connections (optionally with detail='endpoints' or detail='schema'), " +
    "or type='connectors' to list available connector types.",
  inputSchema: {
    type: "object" as const,
    properties: {
      type: {
        type: "string",
        enum: ["connections", "connectors"],
        description: "Resource type: 'connections' (default) or 'connectors'.",
      },
      connectionId: {
        type: "string",
        description: "ID or type of a specific connection or connector. Omit to list all.",
      },
      detail: {
        type: "string",
        enum: ["endpoints", "schema"],
        description: "Sub-resource: 'endpoints' or 'schema' (requires connectionId).",
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

function formatConnection(c: Connection): string {
  const name = (c.name ?? c.label ?? "—") as string;
  const label = (c.label ?? "—") as string;
  const id = (c.id ?? "—") as string;
  const connType = (c.connectorType ?? "—") as string;
  const status = (c.status ?? "—") as string;
  return `• ${label} (name: ${name})\n  id: ${id} | connectorType: ${connType} | status: ${status}`;
}

function formatConnector(c: Connector): string {
  const name = (c.name ?? c.label ?? "—") as string;
  const label = (c.label ?? "—") as string;
  const type = (c.type ?? "—") as string;
  return `• ${label} (name: ${name}) | type: ${type}`;
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function handleGetConnections(input: GetConnectionsInput): Promise<string> {
  const limit = input.limit ?? 100;
  const resourceType = input.type ?? "connections";

  if (resourceType === "connectors") {
    if (input.connectionId) {
      const connector = await fetchConnector(input.connectionId);
      return `Connector:\n\n${formatConnector(connector)}`;
    }
    const connectors = await fetchConnectors(limit);
    if (connectors.length === 0) return "No connectors found.";
    return `Found ${connectors.length} connector(s):\n\n${connectors.map(formatConnector).join("\n")}`;
  }

  // connections (default)
  if (input.connectionId && input.detail === "endpoints") {
    const endpoints = await fetchConnectionEndpoints(input.connectionId);
    return `Endpoints for connection "${input.connectionId}":\n\n${JSON.stringify(endpoints, null, 2)}`;
  }

  if (input.connectionId && input.detail === "schema") {
    const schema = await fetchConnectionSchema(input.connectionId);
    return `Schema for connection "${input.connectionId}":\n\n${JSON.stringify(schema, null, 2)}`;
  }

  if (input.connectionId) {
    const connection = await fetchConnection(input.connectionId);
    return `Connection:\n\n${formatConnection(connection)}`;
  }

  const connections = await fetchConnections(limit);
  if (connections.length === 0) return "No connections found.";
  return `Found ${connections.length} connection(s):\n\n${connections.map(formatConnection).join("\n\n")}`;
}
