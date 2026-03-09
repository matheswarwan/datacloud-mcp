import { z } from "zod";
import { fetchDmoMetadata, DmoObject, DmoField } from "../api/dmo.js";

export const ProposeFieldMappingInputSchema = z.object({
  fields: z
    .array(
      z.object({
        name: z.string().describe("Source field name, e.g. 'email_address'"),
        type: z.string().optional().describe("Source field type, e.g. 'Text', 'Number', 'Date'"),
      })
    )
    .optional()
    .describe("List of fields from the source data."),
  csv_sample: z
    .string()
    .optional()
    .describe("First 1-3 lines of a CSV file (header + optional sample rows)."),
});

export type ProposeFieldMappingInput = z.infer<typeof ProposeFieldMappingInputSchema>;

export const PROPOSE_FIELD_MAPPING_TOOL = {
  name: "propose_field_mapping",
  description:
    "Given a list of source fields (or a CSV header/sample), suggest which Data Cloud DMO " +
    "and fields they should map to. Returns a mapping proposal for the user to review before " +
    "creating a data stream. Always call this before create_data_stream.",
  inputSchema: {
    type: "object" as const,
    properties: {
      fields: {
        type: "array",
        description: "List of source fields with name and optional type.",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            type: { type: "string" },
          },
          required: ["name"],
        },
      },
      csv_sample: {
        type: "string",
        description: "First 1-3 lines of a CSV file to parse fields from.",
      },
    },
    required: [],
  },
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function parseCsvHeaders(csv: string): Array<{ name: string; type?: string }> {
  const firstLine = csv.split("\n")[0];
  return firstLine
    .split(",")
    .map((h) => h.trim().replace(/^"|"$/g, ""))
    .filter(Boolean)
    .map((name) => ({ name }));
}

function normalise(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

interface FieldMatch {
  sourceField: string;
  sourceType?: string;
  targetField: string;
  targetType: string;
  confidence: "high" | "medium" | "low";
}

function matchFields(
  sourceFields: Array<{ name: string; type?: string }>,
  dmoFields: DmoField[]
): FieldMatch[] {
  return sourceFields.map((src) => {
    const srcNorm = normalise(src.name);

    // exact normalised match first
    let best = dmoFields.find((f) => normalise(f.name) === srcNorm);
    let confidence: "high" | "medium" | "low" = "high";

    // then label match
    if (!best) {
      best = dmoFields.find((f) => f.label && normalise(f.label) === srcNorm);
      confidence = "high";
    }

    // partial match (source name is a substring of dmo field name or vice versa)
    if (!best) {
      best = dmoFields.find(
        (f) =>
          normalise(f.name).includes(srcNorm) ||
          srcNorm.includes(normalise(f.name)) ||
          (f.label && normalise(f.label).includes(srcNorm))
      );
      confidence = "medium";
    }

    if (!best) {
      confidence = "low";
      // fall back to first field as placeholder
      best = dmoFields[0];
    }

    return {
      sourceField: src.name,
      sourceType: src.type,
      targetField: best?.name ?? "— no match —",
      targetType: best?.type ?? best?.dataType ?? "Unknown",
      confidence,
    };
  });
}

function scoreDmo(dmo: DmoObject, sourceFields: Array<{ name: string }>): number {
  const dmoFieldNames = (dmo.fields ?? []).map((f) => normalise(f.name));
  return sourceFields.filter((s) => {
    const norm = normalise(s.name);
    return dmoFieldNames.some((d) => d === norm || d.includes(norm) || norm.includes(d));
  }).length;
}

// ── Handler ──────────────────────────────────────────────────────────────────

export async function handleProposeFieldMapping(
  input: ProposeFieldMappingInput
): Promise<string> {
  let sourceFields: Array<{ name: string; type?: string }> = [];

  if (input.csv_sample) {
    sourceFields = parseCsvHeaders(input.csv_sample);
  } else if (input.fields && input.fields.length > 0) {
    sourceFields = input.fields;
  } else {
    return "Please provide either a list of fields or a CSV sample to generate a mapping proposal.";
  }

  const allDmos = await fetchDmoMetadata();
  if (allDmos.length === 0) {
    return "DMO schema cache is empty — cannot propose a mapping yet. Try calling get_dmo_schema first.";
  }

  // Find the best matching DMO by counting field name overlaps
  const ranked = allDmos
    .filter((d) => (d.fields ?? []).length > 0)
    .map((d) => ({ dmo: d, score: scoreDmo(d, sourceFields) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3); // top 3 candidates

  const top = ranked[0];
  if (!top || top.score === 0) {
    const dmoNames = allDmos.slice(0, 10).map((d) => d.name ?? d.label).join(", ");
    return (
      `Could not find a strong DMO match for the provided fields.\n\n` +
      `Available DMOs (first 10): ${dmoNames}\n\n` +
      `Please specify a target DMO name when calling create_data_stream.`
    );
  }

  const mappings = matchFields(sourceFields, top.dmo.fields ?? []);

  const confidence = (c: string) => (c === "high" ? "✓" : c === "medium" ? "~" : "?");

  const mappingLines = mappings.map(
    (m) =>
      `  ${confidence(m.confidence)} ${m.sourceField}${m.sourceType ? ` (${m.sourceType})` : ""} → ${m.targetField} [${m.targetType}]`
  );

  const otherCandidates = ranked
    .slice(1)
    .map((r) => `${r.dmo.name ?? r.dmo.label} (${r.score} matches)`)
    .join(", ");

  const lines = [
    `## Proposed Field Mapping`,
    ``,
    `**Target DMO:** \`${top.dmo.name ?? top.dmo.label}\` (${top.score}/${sourceFields.length} fields matched)`,
    otherCandidates ? `**Other candidates:** ${otherCandidates}` : "",
    ``,
    `| Legend | Meaning |`,
    `|--------|---------|`,
    `| ✓ | High confidence (exact match) |`,
    `| ~ | Medium confidence (partial match) |`,
    `| ? | Low confidence (no match found) |`,
    ``,
    `**Mappings:**`,
    ...mappingLines,
    ``,
    `---`,
    `Does this mapping look correct? If yes, I'll proceed to create the data stream.`,
    `You can also specify a different target DMO or adjust individual field mappings.`,
  ].filter((l) => l !== undefined);

  return lines.join("\n");
}
