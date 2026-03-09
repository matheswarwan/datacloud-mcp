import { z } from "zod";
import { createDataStream } from "../api/create_datastream.js";

const FieldSchema = z.object({
  name: z.string().describe("Field name as it appears in the source data."),
  label: z.string().optional().describe("Human-readable label (defaults to name)."),
  type: z
    .enum(["Text", "Number", "Date", "DateTime", "Boolean"])
    .describe("Field data type."),
  isPrimaryKey: z.boolean().optional().describe("Mark this field as the primary key."),
});

const FieldMappingSchema = z.object({
  sourceFieldName: z.string().describe("Name of the field in the source data."),
  targetFieldName: z.string().describe("Name of the matching field on the target DMO."),
});

export const CreateDataStreamInputSchema = z.object({
  name: z.string().describe("Name for the new data stream."),
  target_dmo: z
    .string()
    .describe("The DMO name this stream maps to, e.g. 'UnifiedIndividual__dlm'."),
  fields: z.array(FieldSchema).describe("Fields in this data stream."),
  field_mappings: z
    .array(FieldMappingSchema)
    .describe("Mapping from each source field to its target DMO field."),
  data_space: z
    .string()
    .optional()
    .describe("Data space name (default: 'default')."),
});

export type CreateDataStreamInput = z.infer<typeof CreateDataStreamInputSchema>;

export const CREATE_DATA_STREAM_TOOL = {
  name: "create_data_stream",
  description:
    "Create a new data stream in Salesforce Data Cloud. " +
    "Only call this after the user has reviewed and confirmed the field mapping from propose_field_mapping. " +
    "Requires: stream name, type, target DMO, fields list, and field mappings.",
  inputSchema: {
    type: "object" as const,
    properties: {
      name: {
        type: "string",
        description: "Name for the new data stream.",
      },
      target_dmo: {
        type: "string",
        description: "The DMO name this stream maps to, e.g. 'UnifiedIndividual__dlm'.",
      },
      fields: {
        type: "array",
        description: "Fields in this data stream.",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            label: { type: "string" },
            type: {
              type: "string",
              enum: ["Text", "Number", "Date", "DateTime", "Boolean"],
            },
            isPrimaryKey: { type: "boolean" },
          },
          required: ["name", "type"],
        },
      },
      field_mappings: {
        type: "array",
        description: "Mapping from each source field to its target DMO field.",
        items: {
          type: "object",
          properties: {
            sourceFieldName: { type: "string" },
            targetFieldName: { type: "string" },
          },
          required: ["sourceFieldName", "targetFieldName"],
        },
      },
      data_space: {
        type: "string",
        description: "Data space name (default: 'default').",
      },
    },
    required: ["name", "target_dmo", "fields", "field_mappings"],
  },
};

export async function handleCreateDataStream(
  input: CreateDataStreamInput
): Promise<string> {
  const result = await createDataStream({
    name: input.name,
    dataSpaceName: input.data_space ?? "default",
    targetObjectName: input.target_dmo,
    fields: input.fields.map((f) => ({
      name: f.name,
      label: f.label ?? f.name,
      type: f.type,
      isPrimaryKey: f.isPrimaryKey ?? false,
    })),
    fieldMappings: input.field_mappings,
  });

  const id = result.id ?? result.name ?? "unknown";
  const status = result.status ?? "unknown";

  return (
    `Data stream created successfully!\n\n` +
    `**Name:** ${input.name}\n` +
    `**ID:** ${id}\n` +
    `**Status:** ${status}\n` +
    `**Target DMO:** ${input.target_dmo}\n` +
    `**Fields:** ${input.fields.length}\n\n` +
    `Full response:\n\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\``
  );
}
