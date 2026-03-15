#!/usr/bin/env node
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

// ── Data Lake Object tools ────────────────────────────────────────────────────
import {
  GET_DATA_LAKE_OBJECTS_TOOL,
  GetDataLakeObjectsInputSchema,
  handleGetDataLakeObjects,
} from "./tools/get_data_lake_objects.js";

// ── Data Graph tools ──────────────────────────────────────────────────────────
import {
  GET_DATA_GRAPHS_TOOL,
  GetDataGraphsInputSchema,
  handleGetDataGraphs,
} from "./tools/get_data_graphs.js";

// ── Data Actions tools ────────────────────────────────────────────────────────
import {
  GET_DATA_ACTIONS_TOOL,
  GetDataActionsInputSchema,
  handleGetDataActions,
} from "./tools/get_data_actions.js";

// ── Identity Resolution tools ─────────────────────────────────────────────────
import {
  GET_IDENTITY_RESOLUTIONS_TOOL,
  GetIdentityResolutionsInputSchema,
  handleGetIdentityResolutions,
} from "./tools/get_identity_resolutions.js";

// ── Data Spaces tools ─────────────────────────────────────────────────────────
import {
  GET_DATA_SPACES_TOOL,
  GetDataSpacesInputSchema,
  handleGetDataSpaces,
} from "./tools/get_data_spaces.js";

// ── Activations tools ─────────────────────────────────────────────────────────
import {
  GET_ACTIVATIONS_TOOL,
  GetActivationsInputSchema,
  handleGetActivations,
} from "./tools/get_activations.js";

// ── Connections tools ─────────────────────────────────────────────────────────
import {
  GET_CONNECTIONS_TOOL,
  GetConnectionsInputSchema,
  handleGetConnections,
} from "./tools/get_connections.js";

// ── Profile tools ─────────────────────────────────────────────────────────────
import {
  GET_PROFILE_TOOL,
  GetProfileInputSchema,
  handleGetProfile,
} from "./tools/get_profile.js";

// ── Insight Data tools ────────────────────────────────────────────────────────
import {
  GET_INSIGHT_DATA_TOOL,
  GetInsightDataInputSchema,
  handleGetInsightData,
} from "./tools/get_insight_data.js";

// ── Query tools ───────────────────────────────────────────────────────────────
import {
  QUERY_DATA_TOOL,
  QueryDataInputSchema,
  handleQueryData,
} from "./tools/query_data.js";

// ── Search Index tools ────────────────────────────────────────────────────────
import {
  GET_SEARCH_INDEX_TOOL,
  GetSearchIndexInputSchema,
  handleGetSearchIndex,
} from "./tools/get_search_index.js";

// ── Machine Learning tools ────────────────────────────────────────────────────
import {
  GET_ML_MODELS_TOOL,
  GetMlModelsInputSchema,
  handleGetMlModels,
} from "./tools/get_ml_models.js";

// ── Document Processing tools ─────────────────────────────────────────────────
import {
  GET_DOCUMENT_PROCESSING_TOOL,
  GetDocumentProcessingInputSchema,
  handleGetDocumentProcessing,
} from "./tools/get_document_processing.js";

// ── Data Clean Room tools ─────────────────────────────────────────────────────
import {
  GET_DATA_CLEAN_ROOM_TOOL,
  GetDataCleanRoomInputSchema,
  handleGetDataCleanRoom,
} from "./tools/get_data_clean_room.js";

// ── Data Kits tools ───────────────────────────────────────────────────────────
import {
  GET_DATA_KITS_TOOL,
  GetDataKitsInputSchema,
  handleGetDataKits,
} from "./tools/get_data_kits.js";

// ── Metadata tools ────────────────────────────────────────────────────────────
import {
  GET_METADATA_TOOL,
  GetMetadataInputSchema,
  handleGetMetadata,
} from "./tools/get_metadata.js";

// ── Limits tools ──────────────────────────────────────────────────────────────
import {
  GET_LIMITS_TOOL,
  GetLimitsInputSchema,
  handleGetLimits,
} from "./tools/get_limits.js";

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
    GET_DATA_LAKE_OBJECTS_TOOL,
    GET_DATA_GRAPHS_TOOL,
    GET_DATA_ACTIONS_TOOL,
    GET_IDENTITY_RESOLUTIONS_TOOL,
    GET_DATA_SPACES_TOOL,
    GET_ACTIVATIONS_TOOL,
    GET_CONNECTIONS_TOOL,
    GET_PROFILE_TOOL,
    GET_INSIGHT_DATA_TOOL,
    QUERY_DATA_TOOL,
    GET_SEARCH_INDEX_TOOL,
    GET_ML_MODELS_TOOL,
    GET_DOCUMENT_PROCESSING_TOOL,
    GET_DATA_CLEAN_ROOM_TOOL,
    GET_DATA_KITS_TOOL,
    GET_METADATA_TOOL,
    GET_LIMITS_TOOL,
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

    if (name === "get_data_lake_objects") {
      const input = GetDataLakeObjectsInputSchema.parse(args ?? {});
      const text = await handleGetDataLakeObjects(input);
      return { content: [{ type: "text", text }] };
    }

    if (name === "get_data_graphs") {
      const input = GetDataGraphsInputSchema.parse(args ?? {});
      const text = await handleGetDataGraphs(input);
      return { content: [{ type: "text", text }] };
    }

    if (name === "get_data_actions") {
      const input = GetDataActionsInputSchema.parse(args ?? {});
      const text = await handleGetDataActions(input);
      return { content: [{ type: "text", text }] };
    }

    if (name === "get_identity_resolutions") {
      const input = GetIdentityResolutionsInputSchema.parse(args ?? {});
      const text = await handleGetIdentityResolutions(input);
      return { content: [{ type: "text", text }] };
    }

    if (name === "get_data_spaces") {
      const input = GetDataSpacesInputSchema.parse(args ?? {});
      const text = await handleGetDataSpaces(input);
      return { content: [{ type: "text", text }] };
    }

    if (name === "get_activations") {
      const input = GetActivationsInputSchema.parse(args ?? {});
      const text = await handleGetActivations(input);
      return { content: [{ type: "text", text }] };
    }

    if (name === "get_connections") {
      const input = GetConnectionsInputSchema.parse(args ?? {});
      const text = await handleGetConnections(input);
      return { content: [{ type: "text", text }] };
    }

    if (name === "get_profile") {
      const input = GetProfileInputSchema.parse(args ?? {});
      const text = await handleGetProfile(input);
      return { content: [{ type: "text", text }] };
    }

    if (name === "get_insight_data") {
      const input = GetInsightDataInputSchema.parse(args ?? {});
      const text = await handleGetInsightData(input);
      return { content: [{ type: "text", text }] };
    }

    if (name === "query_data") {
      const input = QueryDataInputSchema.parse(args ?? {});
      const text = await handleQueryData(input);
      return { content: [{ type: "text", text }] };
    }

    if (name === "get_search_index") {
      const input = GetSearchIndexInputSchema.parse(args ?? {});
      const text = await handleGetSearchIndex(input);
      return { content: [{ type: "text", text }] };
    }

    if (name === "get_ml_models") {
      const input = GetMlModelsInputSchema.parse(args ?? {});
      const text = await handleGetMlModels(input);
      return { content: [{ type: "text", text }] };
    }

    if (name === "get_document_processing") {
      const input = GetDocumentProcessingInputSchema.parse(args ?? {});
      const text = await handleGetDocumentProcessing(input);
      return { content: [{ type: "text", text }] };
    }

    if (name === "get_data_clean_room") {
      const input = GetDataCleanRoomInputSchema.parse(args ?? {});
      const text = await handleGetDataCleanRoom(input);
      return { content: [{ type: "text", text }] };
    }

    if (name === "get_data_kits") {
      const input = GetDataKitsInputSchema.parse(args ?? {});
      const text = await handleGetDataKits(input);
      return { content: [{ type: "text", text }] };
    }

    if (name === "get_metadata") {
      const input = GetMetadataInputSchema.parse(args ?? {});
      const text = await handleGetMetadata(input);
      return { content: [{ type: "text", text }] };
    }

    if (name === "get_limits") {
      const input = GetLimitsInputSchema.parse(args ?? {});
      const text = await handleGetLimits(input);
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
