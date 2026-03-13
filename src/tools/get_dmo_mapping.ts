import { z } from "zod";
import { fetchDmoMapping, ObjectSourceTargetMap } from "../api/dmo_mapping.js";

export const GetDmoMappingInputSchema = z.object({
  dmo_developer_name: z
    .string()
    .describe("The developer name of the DMO to fetch mappings for (e.g. 'ssot__Individual__dlm')."),
});

export type GetDmoMappingInput = z.infer<typeof GetDmoMappingInputSchema>;

export const GET_DMO_MAPPING_TOOL = {
  name: "get_dmo_mapping",
  description:
    "Return the field mappings for a Data Model Object (DMO) in Data Cloud. " +
    "Shows which source entity fields map to which target DMO fields, and the mapping status. " +
    "Use get_dmo_schema first to find the correct DMO developer name.",
  inputSchema: {
    type: "object" as const,
    properties: {
      dmo_developer_name: {
        type: "string",
        description:
          "The developer name of the DMO (e.g. 'ssot__Individual__dlm'). " +
          "Use get_dmo_schema to discover available DMO names.",
      },
    },
    required: ["dmo_developer_name"],
  },
};

function formatMapping(map: ObjectSourceTargetMap): string {
  const lines: string[] = [
    `### ${map.developerName}`,
    `  Source: ${map.sourceEntityDeveloperName}`,
    `  Target: ${map.targetEntityDeveloperName}`,
    `  Status: ${map.status}`,
    `  Field Mappings (${map.fieldMappings.length}):`,
  ];
  for (const f of map.fieldMappings) {
    lines.push(`    • ${f.sourceFieldDeveloperName} → ${f.targetFieldDeveloperName}`);
  }
  return lines.join("\n");
}

export async function handleGetDmoMapping(input: GetDmoMappingInput): Promise<string> {
  const maps = await fetchDmoMapping(input.dmo_developer_name);

  if (maps.length === 0) {
    return `No mappings found for DMO "${input.dmo_developer_name}".`;
  }

  const body = maps.map(formatMapping).join("\n\n");
  return `${maps.length} mapping(s) for "${input.dmo_developer_name}":\n\n${body}`;
}
