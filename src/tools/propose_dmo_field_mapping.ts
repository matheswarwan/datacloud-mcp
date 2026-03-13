import { z } from "zod";
import { fetchDataStreamDetail, DataStreamField } from "../api/datastreams.js";
import { fetchDmoMetadata, DmoField } from "../api/dmo.js";
import { fetchDmoMapping } from "../api/dmo_mapping.js";

export const ProposeDmoFieldMappingInputSchema = z.object({
  data_stream_developer_name: z
    .string()
    .describe("Developer name of the data stream (e.g. 'File_User_Profile__dll')."),
  dmo_developer_name: z
    .string()
    .describe("Target DMO developer name (e.g. 'ssot__Individual__dlm'). Use get_dmo_schema to find it."),
});

export type ProposeDmoFieldMappingInput = z.infer<typeof ProposeDmoFieldMappingInputSchema>;

export const PROPOSE_DMO_FIELD_MAPPING_TOOL = {
  name: "propose_dmo_field_mapping",
  description:
    "Given a data stream and a target DMO, propose field mappings by matching field names. " +
    "Returns a mapping proposal for the user to review and confirm. " +
    "After confirmation, call apply_dmo_field_mapping with the returned details to save the mappings.",
  inputSchema: {
    type: "object" as const,
    properties: {
      data_stream_developer_name: {
        type: "string",
        description: "Developer name of the source data stream.",
      },
      dmo_developer_name: {
        type: "string",
        description: "Developer name of the target DMO.",
      },
    },
    required: ["data_stream_developer_name", "dmo_developer_name"],
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function normalise(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

interface ProposedPair {
  sourceField: string;
  targetField: string;
  confidence: "high" | "medium";
}

function proposeMatches(
  sourceFields: DataStreamField[],
  dmoFields: DmoField[]
): ProposedPair[] {
  const pairs: ProposedPair[] = [];
  for (const src of sourceFields) {
    const srcNorm = normalise(src.name);

    // exact match
    let target = dmoFields.find((f) => normalise(f.name) === srcNorm);
    if (target) {
      pairs.push({ sourceField: src.name, targetField: target.name, confidence: "high" });
      continue;
    }

    // label exact match
    target = dmoFields.find((f) => f.label && normalise(f.label) === srcNorm);
    if (target) {
      pairs.push({ sourceField: src.name, targetField: target.name, confidence: "high" });
      continue;
    }

    // partial match
    target = dmoFields.find(
      (f) =>
        normalise(f.name).includes(srcNorm) ||
        srcNorm.includes(normalise(f.name)) ||
        (f.label && normalise(f.label).includes(srcNorm))
    );
    if (target) {
      pairs.push({ sourceField: src.name, targetField: target.name, confidence: "medium" });
    }
    // no match — omit from proposal (user can add manually)
  }
  return pairs;
}

function extractFields(detail: Record<string, unknown>): DataStreamField[] {
  for (const key of ["fields", "dataStreamFields", "fieldDefinitions", "attributes"]) {
    const val = detail[key];
    if (Array.isArray(val) && val.length > 0) return val as DataStreamField[];
  }
  return [];
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function handleProposeDmoFieldMapping(
  input: ProposeDmoFieldMappingInput
): Promise<string> {
  // Fetch data stream detail
  const streamDetail = await fetchDataStreamDetail(input.data_stream_developer_name);
  const streamFields = extractFields(streamDetail as Record<string, unknown>);

  if (streamFields.length === 0) {
    return (
      `Could not extract fields from data stream "${input.data_stream_developer_name}". ` +
      `Raw response keys: ${Object.keys(streamDetail).join(", ")}`
    );
  }

  // Get DMO schema from cache
  const allDmos = await fetchDmoMetadata();
  const dmo = allDmos.find((d) => d.name === input.dmo_developer_name);
  if (!dmo) {
    return `DMO "${input.dmo_developer_name}" not found in cache. Call get_dmo_schema first.`;
  }

  const dmoFields = dmo.fields ?? [];
  if (dmoFields.length === 0) {
    return `DMO "${input.dmo_developer_name}" has no fields in cache.`;
  }

  // Check if a mapping already exists for this stream → DMO
  const existingMappings = await fetchDmoMapping(input.dmo_developer_name);
  const existingMap = existingMappings.find(
    (m) => m.sourceEntityDeveloperName === input.data_stream_developer_name
  );

  // Propose matches (skip already-mapped fields)
  const alreadyMapped = new Set(
    (existingMap?.fieldMappings ?? []).map((f) => f.sourceFieldDeveloperName)
  );
  const unmappedFields = streamFields.filter((f) => !alreadyMapped.has(f.name));
  const proposals = proposeMatches(unmappedFields, dmoFields);

  if (proposals.length === 0) {
    return (
      `No new field matches found between "${input.data_stream_developer_name}" and "${input.dmo_developer_name}".\n` +
      `Source fields: ${streamFields.map((f) => f.name).join(", ")}\n` +
      `Already mapped: ${alreadyMapped.size} field(s).`
    );
  }

  const confidence = (c: string) => (c === "high" ? "✓" : "~");
  const mappingLines = proposals.map(
    (p) => `  ${confidence(p.confidence)} ${p.sourceField} → ${p.targetField}`
  );

  const lines = [
    `## Proposed Field Mappings`,
    ``,
    `**Data Stream:** \`${input.data_stream_developer_name}\``,
    `**Target DMO:** \`${input.dmo_developer_name}\``,
    existingMap
      ? `**Existing mapping object:** \`${existingMap.developerName}\``
      : `**Note:** No existing mapping object found — a new one will be created.`,
    ``,
    `| Legend | Meaning |`,
    `|--------|---------|`,
    `| ✓ | High confidence (exact name match) |`,
    `| ~ | Medium confidence (partial match) |`,
    ``,
    `**Proposed new mappings (${proposals.length}):**`,
    ...mappingLines,
    ``,
    alreadyMapped.size > 0 ? `**Already mapped:** ${alreadyMapped.size} field(s) skipped.` : "",
    ``,
    `---`,
    `To apply these mappings, call \`apply_dmo_field_mapping\` with:`,
    `- object_source_target_map_developer_name: "${existingMap?.developerName ?? "<create new>"}"`,
    `- source_entity_developer_name: "${input.data_stream_developer_name}"`,
    `- target_entity_developer_name: "${input.dmo_developer_name}"`,
    `- field_mappings: (the confirmed list above)`,
    ``,
    `Do these mappings look correct? You can adjust before confirming.`,
  ].filter((l) => l !== "");

  return lines.join("\n");
}
