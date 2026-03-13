import { z } from "zod";
import {
  createDataTransform,
  updateDataTransform,
  DataTransform,
  DataTransformPayload,
  StlNode,
} from "../api/data_transforms.js";

// ── Zod schemas ───────────────────────────────────────────────────────────────

const StlFieldMappingSchema = z.object({
  source_field: z.string().describe("Source field name in the load node."),
  target_field: z.string().describe("Target field name in the output node."),
});

export const UpsertDataTransformInputSchema = z.object({
  name_or_id: z
    .string()
    .optional()
    .describe("Name or ID of an existing data transform to update (PUT). Omit to create (POST)."),
  name: z.string().describe("Developer name of the data transform (e.g. 'AccountAnnon')."),
  label: z.string().describe("Human-readable label for the data transform."),
  type: z
    .enum(["STREAMING", "BATCH"])
    .describe("Execution type: STREAMING (real-time) or BATCH."),

  // ── SQL definition ────────────────────────────────────────────────────────
  sql_expression: z
    .string()
    .optional()
    .describe("SQL expression defining the transform logic. Used for SQL definition type."),
  target_dlo: z
    .string()
    .optional()
    .describe(
      "Developer name of the target DLO for SQL transforms (e.g. 'Account_Home_Annon__dll')."
    ),

  // ── STL definition ────────────────────────────────────────────────────────
  source_dlo: z
    .string()
    .optional()
    .describe(
      "Developer name of the source DLO to load (e.g. 'Account_Home__dll'). " +
      "Required when using STL or when SQL fails and auto-retry with STL is needed."
    ),
  stl_fields: z
    .array(z.string())
    .optional()
    .describe(
      "Fields to load from source_dlo for STL transforms. Omit to load all fields."
    ),
  stl_field_mappings: z
    .array(StlFieldMappingSchema)
    .optional()
    .describe(
      "Field mappings from source to target for the STL OUTPUT node. " +
      "If omitted, source fields are passed through unchanged."
    ),

  // ── Shared ────────────────────────────────────────────────────────────────
  definition_version: z
    .string()
    .optional()
    .describe("Definition API version. SQL default: '65.0', STL default: '56.0'."),
});

export type UpsertDataTransformInput = z.infer<typeof UpsertDataTransformInputSchema>;

// ── Payload builders ──────────────────────────────────────────────────────────

function buildSqlPayload(input: UpsertDataTransformInput): DataTransformPayload {
  if (!input.sql_expression || !input.target_dlo) {
    throw new Error("sql_expression and target_dlo are required for SQL transforms.");
  }
  return {
    name: input.name,
    label: input.label,
    type: input.type,
    definition: {
      type: "SQL",
      version: input.definition_version ?? "65.0",
      expression: input.sql_expression,
      targetDlo: input.target_dlo,
    },
  };
}

function buildStlPayload(input: UpsertDataTransformInput): DataTransformPayload {
  if (!input.source_dlo || !input.target_dlo) {
    throw new Error("source_dlo and target_dlo are required for STL transforms.");
  }

  const fields = input.stl_fields ?? [];
  const fieldMappings = input.stl_field_mappings?.map((m) => ({
    sourceField: m.source_field,
    targetField: m.target_field,
  })) ?? fields.map((f) => ({ sourceField: f, targetField: f }));

  const nodes: Record<string, StlNode> = {
    LOAD_DATASET0: {
      action: "load",
      parameters: {
        dataset: { name: input.source_dlo, type: "dataLakeObject" },
        fields: fields.length > 0 ? fields : [],
        sampleDetails: { sortBy: [], type: "TopN" },
      },
      sources: [],
    },
    OUTPUT0: {
      action: "outputD360",
      parameters: {
        fieldsMappings: fieldMappings,
        name: input.target_dlo,
        type: "dataLakeObject",
      },
      sources: ["LOAD_DATASET0"],
    },
  };

  return {
    name: input.name,
    label: input.label,
    type: input.type,
    definition: {
      type: "STL",
      version: input.definition_version ?? "56.0",
      nodes,
    },
  };
}

// ── Result formatter ──────────────────────────────────────────────────────────

function formatResult(
  result: DataTransform,
  action: "created" | "updated",
  nameOrId: string,
  definitionType: string
): string {
  const id = (result["id"] ?? result["uuid"] ?? result["name"] ?? "—") as string;
  const status = (result["status"] ?? result["state"] ?? "—") as string;

  const extras = Object.entries(result)
    .filter(([k]) => !["id", "uuid", "name", "status", "state"].includes(k))
    .map(([k, v]) => `  ${k}: ${JSON.stringify(v)}`)
    .join("\n");

  return [
    `Data transform \`${nameOrId}\` ${action} successfully (${definitionType} definition).`,
    ``,
    `  id: ${id}`,
    `  status: ${status}`,
    extras || "",
  ]
    .filter((l) => l !== "")
    .join("\n");
}

// ── Handler ───────────────────────────────────────────────────────────────────

async function upsert(
  nameOrId: string | undefined,
  payload: DataTransformPayload
): Promise<DataTransform> {
  return nameOrId
    ? updateDataTransform(nameOrId, payload)
    : createDataTransform(payload);
}

export async function handleUpsertDataTransform(input: UpsertDataTransformInput): Promise<string> {
  const action = input.name_or_id ? "updated" : "created";
  const nameOrId = input.name_or_id ?? input.name;
  const canRetryWithStl = !!(input.source_dlo && input.target_dlo);

  // ── Attempt 1: SQL ─────────────────────────────────────────────────────────
  if (input.sql_expression) {
    try {
      const sqlPayload = buildSqlPayload(input);
      console.error(`[upsert_data_transform] Trying SQL definition…`);
      const result = await upsert(input.name_or_id, sqlPayload);
      return formatResult(result, action, nameOrId, "SQL");
    } catch (sqlErr) {
      if (!canRetryWithStl) throw sqlErr;

      const sqlMessage = sqlErr instanceof Error ? sqlErr.message : String(sqlErr);
      console.error(`[upsert_data_transform] SQL failed: ${sqlMessage} — retrying with STL…`);

      // ── Attempt 2: STL retry ───────────────────────────────────────────────
      try {
        const stlPayload = buildStlPayload(input);
        const result = await upsert(input.name_or_id, stlPayload);
        return [
          formatResult(result, action, nameOrId, "STL"),
          ``,
          `Note: SQL definition failed ("${sqlMessage}"). Successfully fell back to STL.`,
        ].join("\n");
      } catch (stlErr) {
        const stlMessage = stlErr instanceof Error ? stlErr.message : String(stlErr);
        throw new Error(
          `Both definition types failed.\n  SQL error: ${sqlMessage}\n  STL error: ${stlMessage}`
        );
      }
    }
  }

  // ── STL only (no SQL expression provided) ─────────────────────────────────
  const stlPayload = buildStlPayload(input);
  console.error(`[upsert_data_transform] Using STL definition…`);
  const result = await upsert(input.name_or_id, stlPayload);
  return formatResult(result, action, nameOrId, "STL");
}

export const UPSERT_DATA_TRANSFORM_TOOL = {
  name: "upsert_data_transform",
  description:
    "Create or update a Data Cloud data transform. " +
    "Supports two definition types: SQL (expression + target_dlo) and STL (node graph: source_dlo + target_dlo + field mappings). " +
    "When sql_expression is provided the tool tries SQL first; if the API rejects it AND source_dlo/target_dlo are also provided, " +
    "it automatically retries with an equivalent STL payload. " +
    "Omit name_or_id to create (POST); provide it to update (PUT). " +
    "type must be STREAMING or BATCH.",
  inputSchema: {
    type: "object" as const,
    properties: {
      name_or_id: {
        type: "string",
        description: "Existing transform name or ID to update. Omit to create.",
      },
      name: { type: "string", description: "Developer name of the data transform." },
      label: { type: "string", description: "Human-readable label." },
      type: {
        type: "string",
        enum: ["STREAMING", "BATCH"],
        description: "Execution type: STREAMING or BATCH.",
      },
      sql_expression: {
        type: "string",
        description: "SQL expression (SQL definition). Required for SQL; optional if using STL only.",
      },
      target_dlo: {
        type: "string",
        description: "Target DLO developer name (used by both SQL and STL definitions).",
      },
      source_dlo: {
        type: "string",
        description: "Source DLO developer name — required for STL and for SQL→STL auto-retry.",
      },
      stl_fields: {
        type: "array",
        items: { type: "string" },
        description: "Fields to load from source_dlo in the STL LOAD node. Omit to load all.",
      },
      stl_field_mappings: {
        type: "array",
        description: "Field mappings for the STL OUTPUT node. Defaults to pass-through of stl_fields.",
        items: {
          type: "object",
          properties: {
            source_field: { type: "string" },
            target_field: { type: "string" },
          },
          required: ["source_field", "target_field"],
        },
      },
      definition_version: {
        type: "string",
        description: "Definition API version. SQL default: '65.0', STL default: '56.0'.",
      },
    },
    required: ["name", "label", "type"],
  },
};
