import { z } from "zod";
import { fetchSegments, publishSegment } from "../api/segments.js";

export const PublishSegmentInputSchema = z.object({
  segment_id: z
    .string()
    .optional()
    .describe("Segment ID to publish. If omitted, get_segments is called first to resolve it by name."),
  segment_name: z
    .string()
    .optional()
    .describe("Segment name to look up (used when segment_id is not known). Case-insensitive substring match."),
});

export type PublishSegmentInput = z.infer<typeof PublishSegmentInputSchema>;

export const PUBLISH_SEGMENT_TOOL = {
  name: "publish_segment",
  description:
    "Refresh (publish) a segment in Salesforce Data Cloud. " +
    "If the user provides a segment name but not an ID, call get_segments first to resolve the ID, " +
    "then call this tool with the segment_id. " +
    "Uses POST /ssot/segments/{segmentId}/actions/publish.",
  inputSchema: {
    type: "object" as const,
    properties: {
      segment_id: {
        type: "string",
        description: "Segment ID to publish (from get_segments).",
      },
      segment_name: {
        type: "string",
        description: "Segment name to look up when segment_id is not known.",
      },
    },
    required: [],
  },
};

export async function handlePublishSegment(input: PublishSegmentInput): Promise<string> {
  let segmentId = input.segment_id;

  // Resolve ID by name if not provided
  if (!segmentId) {
    if (!input.segment_name) {
      return "Please provide either a segment_id or a segment_name to identify which segment to publish.";
    }
    const segments = await fetchSegments(200);
    const needle = input.segment_name.toLowerCase();
    const match = segments.find((s) => {
      const name = (s["name"] ?? s["segmentName"] ?? s["label"] ?? "") as string;
      return name.toLowerCase().includes(needle);
    });
    if (!match) {
      return `No segment found matching "${input.segment_name}". Use get_segments to list available segments.`;
    }
    segmentId = (match["id"] ?? match["segmentId"] ?? match["uuid"]) as string;
    const matchedName = (match["name"] ?? match["segmentName"] ?? match["label"]) as string;
    if (!segmentId) {
      return `Found segment "${matchedName}" but could not determine its ID. Use get_segments and provide the segment_id directly.`;
    }
  }

  const result = await publishSegment(segmentId);

  // Determine success/failure from response
  const isSuccess =
    result.success === true ||
    (typeof result.status === "string" &&
      ["success", "published", "queued", "in_progress"].includes(result.status.toLowerCase()));

  if (isSuccess || Object.keys(result).length > 0) {
    const details = Object.entries(result)
      .map(([k, v]) => `  • ${k}: ${JSON.stringify(v)}`)
      .join("\n");
    return [
      isSuccess
        ? `Segment \`${segmentId}\` publish triggered successfully.`
        : `Segment \`${segmentId}\` publish request sent — review details below.`,
      ``,
      details || "  (no additional details returned)",
    ].join("\n");
  }

  return `Segment \`${segmentId}\` publish triggered successfully (no response body).`;
}
