import { z } from "zod";
import { deleteDmoFieldMappings } from "../api/dmo_mapping.js";

export const RemoveDmoFieldMappingInputSchema = z.object({
  source_entity_developer_name: z
    .string()
    .describe(
      "Developer name of the source data stream entity (e.g. 'File_User_Profile__dll'). " +
      "This is the sourceEntityDeveloperName used when the mapping was created."
    ),
  field_mappings: z
    .array(
      z.object({
        developer_name: z
          .string()
          .describe(
            "Developer name of the individual field mapping — obtain this from get_dmo_mapping " +
            "(the developerName on each fieldMapping entry)."
          ),
        source_field: z.string().describe("Source data stream field developer name."),
        target_field: z.string().describe("Target DMO field developer name."),
      })
    )
    .min(1)
    .describe("List of field mappings to remove. Each entry requires its developerName from get_dmo_mapping."),
});

export type RemoveDmoFieldMappingInput = z.infer<typeof RemoveDmoFieldMappingInputSchema>;

export const REMOVE_DMO_FIELD_MAPPING_TOOL = {
  name: "remove_dmo_field_mapping",
  description:
    "Remove specific field mappings from a DMO mapping in Data Cloud. " +
    "WORKFLOW: (1) Call get_dmo_mapping with the target DMO developer name to retrieve the existing " +
    "field mappings and their developerNames. " +
    "(2) Identify the field mapping entries to remove by matching sourceFieldDeveloperName and targetFieldDeveloperName. " +
    "(3) Call this tool with the sourceEntityDeveloperName and the matching field mapping entries " +
    "(including their developerName). " +
    "Do NOT use get_dmo_schema — it is not needed here. " +
    "Uses DELETE /ssot/data-model-object-mappings/{sourceEntityDeveloperName}/field-mappings.",
  inputSchema: {
    type: "object" as const,
    properties: {
      source_entity_developer_name: {
        type: "string",
        description:
          "Developer name of the source data stream entity (sourceEntityDeveloperName from the mapping creation payload, e.g. 'File_User_Profile__dll').",
      },
      field_mappings: {
        type: "array",
        description: "Field mapping entries to remove.",
        items: {
          type: "object",
          properties: {
            developer_name: {
              type: "string",
              description: "developerName of the field mapping (from get_dmo_mapping).",
            },
            source_field: { type: "string", description: "Source field developer name." },
            target_field: { type: "string", description: "Target DMO field developer name." },
          },
          required: ["developer_name", "source_field", "target_field"],
        },
        minItems: 1,
      },
    },
    required: ["source_entity_developer_name", "field_mappings"],
  },
};

export async function handleRemoveDmoFieldMapping(
  input: RemoveDmoFieldMappingInput
): Promise<string> {
  await deleteDmoFieldMappings({
    sourceEntityDeveloperName: input.source_entity_developer_name,
    fieldMappings: input.field_mappings.map((f) => ({
      developerName: f.developer_name,
      sourceFieldDeveloperName: f.source_field,
      targetFieldDeveloperName: f.target_field,
    })),
  });

  const removedLines = input.field_mappings
    .map((f) => `  • ${f.source_field} → ${f.target_field} (${f.developer_name})`)
    .join("\n");

  return [
    `Successfully removed ${input.field_mappings.length} field mapping(s):`,
    ``,
    `**Source entity:** \`${input.source_entity_developer_name}\``,
    ``,
    removedLines,
  ].join("\n");
}
