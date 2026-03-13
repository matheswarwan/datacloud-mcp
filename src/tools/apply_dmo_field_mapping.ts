import { z } from "zod";
import { applyDmoFieldMapping } from "../api/dmo_mapping.js";

export const ApplyDmoFieldMappingInputSchema = z.object({
  object_source_target_map_developer_name: z
    .string()
    .describe("Developer name of the objectSourceTargetMap to update (from get_dmo_mapping or propose_dmo_field_mapping)."),
  source_entity_developer_name: z
    .string()
    .describe("Developer name of the source data stream entity (e.g. 'File_User_Profile__dll')."),
  target_entity_developer_name: z
    .string()
    .describe("Developer name of the target DMO entity (e.g. 'ssot__Individual__dlm')."),
  field_mappings: z
    .array(
      z.object({
        source_field: z.string().describe("Source field developer name."),
        target_field: z.string().describe("Target DMO field developer name."),
      })
    )
    .min(1)
    .describe("List of source → target field pairs to map."),
});

export type ApplyDmoFieldMappingInput = z.infer<typeof ApplyDmoFieldMappingInputSchema>;

export const APPLY_DMO_FIELD_MAPPING_TOOL = {
  name: "apply_dmo_field_mapping",
  description:
    "Apply confirmed field mappings to a DMO mapping object in Data Cloud. " +
    "Call propose_dmo_field_mapping first to generate the proposal, then use this after user confirmation. " +
    "Uses PATCH /ssot/data-model-object-mappings/{objectMap}/field-mappings/{targetDmo}.",
  inputSchema: {
    type: "object" as const,
    properties: {
      object_source_target_map_developer_name: {
        type: "string",
        description: "Developer name of the objectSourceTargetMap (from get_dmo_mapping).",
      },
      source_entity_developer_name: {
        type: "string",
        description: "Developer name of the source data stream entity.",
      },
      target_entity_developer_name: {
        type: "string",
        description: "Developer name of the target DMO.",
      },
      field_mappings: {
        type: "array",
        description: "Field pairs to apply.",
        items: {
          type: "object",
          properties: {
            source_field: { type: "string" },
            target_field: { type: "string" },
          },
          required: ["source_field", "target_field"],
        },
        minItems: 1,
      },
    },
    required: [
      "object_source_target_map_developer_name",
      "source_entity_developer_name",
      "target_entity_developer_name",
      "field_mappings",
    ],
  },
};

export async function handleApplyDmoFieldMapping(
  input: ApplyDmoFieldMappingInput
): Promise<string> {
  const result = await applyDmoFieldMapping({
    objectSourceTargetMapDeveloperName: input.object_source_target_map_developer_name,
    sourceEntityDeveloperName: input.source_entity_developer_name,
    targetEntityDeveloperName: input.target_entity_developer_name,
    fieldMappings: input.field_mappings.map((f) => ({
      sourceFieldDeveloperName: f.source_field,
      targetFieldDeveloperName: f.target_field,
    })),
  });

  const appliedLines = input.field_mappings
    .map((f) => `  • ${f.source_field} → ${f.target_field}`)
    .join("\n");

  return [
    `Successfully applied ${input.field_mappings.length} field mapping(s):`,
    ``,
    `**Mapping object:** \`${input.object_source_target_map_developer_name}\``,
    `**Source:** \`${input.source_entity_developer_name}\``,
    `**Target:** \`${input.target_entity_developer_name}\``,
    ``,
    appliedLines,
    ``,
    result ? `API response: ${JSON.stringify(result)}` : "",
  ]
    .filter((l) => l !== "")
    .join("\n");
}
