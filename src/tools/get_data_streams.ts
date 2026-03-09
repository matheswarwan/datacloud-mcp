import { z } from "zod";
import { fetchDataStreams, DataStream } from "../api/datastreams.js";

export const GetDataStreamsInputSchema = z.object({
  limit: z
    .number()
    .int()
    .min(1)
    .max(1000)
    .optional()
    .describe("Max number of data streams to return (default: 100)."),
});

export type GetDataStreamsInput = z.infer<typeof GetDataStreamsInputSchema>;

export const GET_DATA_STREAMS_TOOL = {
  name: "get_data_streams",
  description:
    "List all data streams in the connected Salesforce Data Cloud org. " +
    "Use this when asked to list, show, or describe data streams.",
  inputSchema: {
    type: "object" as const,
    properties: {
      limit: {
        type: "number",
        description: "Max number of data streams to return (default: 100).",
      },
    },
    required: [],
  },
};

function formatDataStream(s: DataStream, index: number): string {
  const name = (s["name"] ?? s["dataStreamName"] ?? s["label"] ?? `Stream #${index + 1}`) as string;
  const id = (s["id"] ?? s["dataStreamId"] ?? s["uuid"] ?? "—") as string;
  const status = (s["status"] ?? s["deploymentStatus"] ?? "—") as string;

  const shown = new Set(["name", "dataStreamName", "label", "id", "dataStreamId", "uuid", "status", "deploymentStatus"]);
  const extras = Object.entries(s)
    .filter(([k]) => !shown.has(k))
    .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
    .join(" | ");

  const line = `• ${name} (id: ${id}) — status: ${status}`;
  return extras ? `${line}\n  ${extras}` : line;
}

export async function handleGetDataStreams(input: GetDataStreamsInput): Promise<string> {
  const streams = await fetchDataStreams(input.limit ?? 100);

  if (streams.length === 0) {
    return "No data streams found in this Data Cloud org.";
  }

  const lines = streams.map((s, i) => formatDataStream(s, i));
  return `Found ${streams.length} data stream(s):\n\n${lines.join("\n\n")}`;
}
