import { z } from "zod";
import { deleteDmoFieldMappings } from "../api/dmo_mapping.js";

export const RemoveDmoFieldMappingInputSchema = z.object({
  object_source_target_map_developer_name: z
    .string()
    .describe(
      "Developer name of the objectSourceTargetMap to update (from get_dmo_mapping)."
    ),
  source_field_developer_names: z
    .array(z.string())
    .min(1)
    .describe("Developer names of the source data stream fields to remove."),
  target_field_developer_names: z
    .array(z.string())
    .min(1)
    .describe("Developer names of the target DMO fields whose mappings should be removed."),
});

export type RemoveDmoFieldMappingInput = z.infer<typeof RemoveDmoFieldMappingInputSchema>;

export const REMOVE_DMO_FIELD_MAPPING_TOOL = {
  name: "remove_dmo_field_mapping",
  description:
    "Remove specific field mappings from a DMO mapping object in Data Cloud. " +
    "Before calling this tool, ask the user for: the data stream name, the data stream field names to unmap, " +
    "the DMO name, and the DMO field names to unmap. " +
    "Uses DELETE /ssot/data-model-object-mappings/{objectSourceTargetMapDeveloperName}/field-mappings.",
  inputSchema: {
    type: "object" as const,
    properties: {
      object_source_target_map_developer_name: {
        type: "string",
        description: "Developer name of the objectSourceTargetMap (from get_dmo_mapping).",
      },
      source_field_developer_names: {
        type: "array",
        description: "Source data stream field developer names to remove.",
        items: { type: "string" },
        minItems: 1,
      },
      target_field_developer_names: {
        type: "array",
        description: "Target DMO field developer names to remove.",
        items: { type: "string" },
        minItems: 1,
      },
    },
    required: [
      "object_source_target_map_developer_name",
      "source_field_developer_names",
      "target_field_developer_names",
    ],
  },
};

export async function handleRemoveDmoFieldMapping(
  input: RemoveDmoFieldMappingInput
): Promise<string> {
  await deleteDmoFieldMappings({
    objectSourceTargetMapDeveloperName: input.object_source_target_map_developer_name,
    sourceFieldDeveloperNames: input.source_field_developer_names,
    targetFieldDeveloperNames: input.target_field_developer_names,
  });

  const removedLines = input.source_field_developer_names
    .map((src, i) => `  • ${src} → ${input.target_field_developer_names[i] ?? "(n/a)"}`)
    .join("\n");

  return [
    `Successfully removed ${input.source_field_developer_names.length} field mapping(s):`,
    ``,
    `**Mapping object:** \`${input.object_source_target_map_developer_name}\``,
    ``,
    removedLines,
  ].join("\n");
}
