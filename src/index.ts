import "dotenv/config";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// ── Data stream / segment tools ───────────────────────────────────────────────
import {
  GET_DATA_STREAMS_TOOL,
  GetDataStreamsInputSchema,
  handleGetDataStreams,
} from "./tools/get_data_streams.js";
import {
  GET_SEGMENTS_TOOL,
  GetSegmentsInputSchema,
  handleGetSegments,
} from "./tools/get_segments.js";
import {
  PUBLISH_SEGMENT_TOOL,
  PublishSegmentInputSchema,
  handlePublishSegment,
} from "./tools/publish_segment.js";

// ── DMO schema tool ───────────────────────────────────────────────────────────
import {
  GET_DMO_SCHEMA_TOOL,
  GetDmoSchemaInputSchema,
  handleGetDmoSchema,
} from "./tools/get_dmo_schema.js";
import {
  GET_DMO_MAPPING_TOOL,
  GetDmoMappingInputSchema,
  handleGetDmoMapping,
} from "./tools/get_dmo_mapping.js";
import {
  PROPOSE_DMO_FIELD_MAPPING_TOOL,
  ProposeDmoFieldMappingInputSchema,
  handleProposeDmoFieldMapping,
} from "./tools/propose_dmo_field_mapping.js";
import {
  APPLY_DMO_FIELD_MAPPING_TOOL,
  ApplyDmoFieldMappingInputSchema,
  handleApplyDmoFieldMapping,
} from "./tools/apply_dmo_field_mapping.js";
import {
  REMOVE_DMO_FIELD_MAPPING_TOOL,
  RemoveDmoFieldMappingInputSchema,
  handleRemoveDmoFieldMapping,
} from "./tools/remove_dmo_field_mapping.js";

// ── Data Transforms tools ─────────────────────────────────────────────────────
import {
  GET_DATA_TRANSFORMS_TOOL,
  GetDataTransformsInputSchema,
  handleGetDataTransforms,
} from "./tools/get_data_transforms.js";
import {
  UPSERT_DATA_TRANSFORM_TOOL,
  UpsertDataTransformInputSchema,
  handleUpsertDataTransform,
} from "./tools/upsert_data_transform.js";

// ── Calculated Insights tools ─────────────────────────────────────────────────
import {
  GET_CALCULATED_INSIGHTS_TOOL,
  GetCalculatedInsightsInputSchema,
  handleGetCalculatedInsights,
} from "./tools/get_calculated_insights.js";
import {
  PROPOSE_CI_SQL_TOOL,
  ProposeCiSqlInputSchema,
  handleProposeCiSql,
} from "./tools/propose_ci_sql.js";
import {
  CREATE_CALCULATED_INSIGHT_TOOL,
  CreateCalculatedInsightInputSchema,
  handleCreateCalculatedInsight,
} from "./tools/create_calculated_insight.js";
import {
  RUN_CALCULATED_INSIGHT_TOOL,
  RunCalculatedInsightInputSchema,
  handleRunCalculatedInsight,
} from "./tools/run_calculated_insight.js";

// ── Warm-up ───────────────────────────────────────────────────────────────────
import { fetchDmoMetadata } from "./api/dmo.js";
import { fetchCalculatedInsights } from "./api/calculated_insights.js";

// NOTE: create_data_stream and propose_field_mapping are disabled (API schema TBD)

const server = new Server(
  { name: "datacloud-mcp", version: "0.1.0" },
  { capabilities: { tools: {} } }
);

// ── List available tools ──────────────────────────────────────────────────────
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    GET_DATA_STREAMS_TOOL,
    GET_SEGMENTS_TOOL,
    PUBLISH_SEGMENT_TOOL,
    GET_DMO_SCHEMA_TOOL,
    GET_DMO_MAPPING_TOOL,
    PROPOSE_DMO_FIELD_MAPPING_TOOL,
    APPLY_DMO_FIELD_MAPPING_TOOL,
    REMOVE_DMO_FIELD_MAPPING_TOOL,
    GET_DATA_TRANSFORMS_TOOL,
    UPSERT_DATA_TRANSFORM_TOOL,
    GET_CALCULATED_INSIGHTS_TOOL,
    PROPOSE_CI_SQL_TOOL,
    CREATE_CALCULATED_INSIGHT_TOOL,
    RUN_CALCULATED_INSIGHT_TOOL,
  ],
}));

// ── Dispatch tool calls ───────────────────────────────────────────────────────
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "get_data_streams") {
      const input = GetDataStreamsInputSchema.parse(args ?? {});
      const text = await handleGetDataStreams(input);
      return { content: [{ type: "text", text }] };
    }

    if (name === "get_segments") {
      const input = GetSegmentsInputSchema.parse(args ?? {});
      const text = await handleGetSegments(input);
      return { content: [{ type: "text", text }] };
    }

    if (name === "publish_segment") {
      const input = PublishSegmentInputSchema.parse(args ?? {});
      const text = await handlePublishSegment(input);
      return { content: [{ type: "text", text }] };
    }

    if (name === "get_dmo_schema") {
      const input = GetDmoSchemaInputSchema.parse(args ?? {});
      const text = await handleGetDmoSchema(input);
      return { content: [{ type: "text", text }] };
    }

    if (name === "get_dmo_mapping") {
      const input = GetDmoMappingInputSchema.parse(args ?? {});
      const text = await handleGetDmoMapping(input);
      return { content: [{ type: "text", text }] };
    }

    if (name === "propose_dmo_field_mapping") {
      const input = ProposeDmoFieldMappingInputSchema.parse(args ?? {});
      const text = await handleProposeDmoFieldMapping(input);
      return { content: [{ type: "text", text }] };
    }

    if (name === "apply_dmo_field_mapping") {
      const input = ApplyDmoFieldMappingInputSchema.parse(args ?? {});
      const text = await handleApplyDmoFieldMapping(input);
      return { content: [{ type: "text", text }] };
    }

    if (name === "remove_dmo_field_mapping") {
      const input = RemoveDmoFieldMappingInputSchema.parse(args ?? {});
      const text = await handleRemoveDmoFieldMapping(input);
      return { content: [{ type: "text", text }] };
    }

    if (name === "get_data_transforms") {
      const input = GetDataTransformsInputSchema.parse(args ?? {});
      const text = await handleGetDataTransforms(input);
      return { content: [{ type: "text", text }] };
    }

    if (name === "upsert_data_transform") {
      const input = UpsertDataTransformInputSchema.parse(args ?? {});
      const text = await handleUpsertDataTransform(input);
      return { content: [{ type: "text", text }] };
    }

    if (name === "get_calculated_insights") {
      const input = GetCalculatedInsightsInputSchema.parse(args ?? {});
      const text = await handleGetCalculatedInsights(input);
      return { content: [{ type: "text", text }] };
    }

    if (name === "propose_ci_sql") {
      const input = ProposeCiSqlInputSchema.parse(args ?? {});
      const text = await handleProposeCiSql(input);
      return { content: [{ type: "text", text }] };
    }

    if (name === "create_calculated_insight") {
      const input = CreateCalculatedInsightInputSchema.parse(args ?? {});
      const text = await handleCreateCalculatedInsight(input);
      return { content: [{ type: "text", text }] };
    }

    if (name === "run_calculated_insight") {
      const input = RunCalculatedInsightInputSchema.parse(args ?? {});
      const text = await handleRunCalculatedInsight(input);
      return { content: [{ type: "text", text }] };
    }

    return {
      content: [{ type: "text", text: `Unknown tool: ${name}` }],
      isError: true,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      content: [{ type: "text", text: `Error: ${message}` }],
      isError: true,
    };
  }
});

// ── Start server ──────────────────────────────────────────────────────────────
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("datacloud-mcp server running");

  fetchDmoMetadata()
    .then((dmos) => console.error(`DMO cache ready: ${dmos.length} objects`))
    .catch((err) => console.error("DMO cache warm-up failed:", err));

  fetchCalculatedInsights()
    .then((cis) =>
      console.error(`Calculated Insights cache ready: ${cis.length} objects`)
    )
    .catch((err) =>
      console.error("Calculated Insights cache warm-up failed:", err)
    );
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
