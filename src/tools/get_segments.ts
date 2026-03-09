import { z } from "zod";
import { fetchSegments, Segment } from "../api/segments.js";

export const GetSegmentsInputSchema = z.object({
  limit: z
    .number()
    .int()
    .min(1)
    .max(1000)
    .optional()
    .describe("Max number of segments to return (default: 100)."),
});

export type GetSegmentsInput = z.infer<typeof GetSegmentsInputSchema>;

export const GET_SEGMENTS_TOOL = {
  name: "get_segments",
  description:
    "List all segments in the connected Salesforce Data Cloud org. " +
    "Use this when asked to list, show, or describe segments.",
  inputSchema: {
    type: "object" as const,
    properties: {
      limit: {
        type: "number",
        description: "Max number of segments to return (default: 100).",
      },
    },
    required: [],
  },
};

function formatSegment(s: Segment, index: number): string {
  const name = (s["name"] ?? s["segmentName"] ?? s["label"] ?? `Segment #${index + 1}`) as string;
  const id = (s["id"] ?? s["segmentId"] ?? s["uuid"] ?? "—") as string;
  const status = (s["status"] ?? s["publishStatus"] ?? "—") as string;

  const shown = new Set(["name", "segmentName", "label", "id", "segmentId", "uuid", "status", "publishStatus"]);
  const extras = Object.entries(s)
    .filter(([k]) => !shown.has(k))
    .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
    .join(" | ");

  const line = `• ${name} (id: ${id}) — status: ${status}`;
  return extras ? `${line}\n  ${extras}` : line;
}

export async function handleGetSegments(input: GetSegmentsInput): Promise<string> {
  const segments = await fetchSegments(input.limit ?? 100);

  if (segments.length === 0) {
    return "No segments found in this Data Cloud org.";
  }

  const lines = segments.map((s, i) => formatSegment(s, i));
  return `Found ${segments.length} segment(s):\n\n${lines.join("\n\n")}`;
}
