import { z } from "zod";
import { fetchDmoMetadata, DmoObject } from "../api/dmo.js";

export const ProposeCiSqlInputSchema = z.object({
  intent: z
    .string()
    .describe(
      "Describe what you want to measure or compute. " +
        "E.g. 'total revenue per customer', 'count of orders by region this year'."
    ),
  dmo_hints: z
    .array(z.string())
    .optional()
    .describe(
      "Optional: DMO names you know should be involved. " +
        "If omitted, the tool will suggest the best matches from the schema."
    ),
});

export type ProposeCiSqlInput = z.infer<typeof ProposeCiSqlInputSchema>;

export const PROPOSE_CI_SQL_TOOL = {
  name: "propose_ci_sql",
  description:
    "Given a plain-English description of what a Calculated Insight should compute, " +
    "identify the relevant DMOs from the schema and generate a draft SQL query. " +
    "Returns the proposed SQL and DMO list for the user to review before creating the CI. " +
    "Always call this before create_calculated_insight.",
  inputSchema: {
    type: "object" as const,
    properties: {
      intent: {
        type: "string",
        description:
          "What you want to measure, e.g. 'total revenue per customer' or 'order count by region'.",
      },
      dmo_hints: {
        type: "array",
        items: { type: "string" },
        description: "Optional list of DMO names to include.",
      },
    },
    required: ["intent"],
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function normalise(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, " ").trim();
}

const KEYWORD_SCORES: Record<string, string[]> = {
  order:      ["order", "purchase", "transaction", "sale"],
  account:    ["account", "company", "organisation", "organization", "business"],
  individual: ["individual", "person", "customer", "contact", "user", "member"],
  product:    ["product", "item", "sku", "catalog"],
  revenue:    ["revenue", "amount", "price", "cost", "payment"],
  email:      ["email", "contactpoint"],
  address:    ["address", "location", "shipping", "billing"],
  loyalty:    ["loyalty", "reward", "point"],
};

function scoreIntent(dmo: DmoObject, intentNorm: string): number {
  const target = `${normalise(dmo.name ?? "")} ${normalise(dmo.label ?? "")}`;
  let score = 0;
  for (const [, synonyms] of Object.entries(KEYWORD_SCORES)) {
    const inIntent = synonyms.some((s) => intentNorm.includes(s));
    const inDmo = synonyms.some((s) => target.includes(s));
    if (inIntent && inDmo) score += 2;
    if (inDmo) score += 0.5;
  }
  return score;
}

function pickDmos(
  all: DmoObject[],
  intentNorm: string,
  hints: string[]
): DmoObject[] {
  if (hints.length > 0) {
    const byHint = hints
      .map((h) => all.find((d) => d.name === h || (d.label ?? "").toLowerCase() === h.toLowerCase()))
      .filter((d): d is DmoObject => !!d);
    if (byHint.length > 0) return byHint;
  }

  return all
    .map((d) => ({ dmo: d, score: scoreIntent(d, intentNorm) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((x) => x.dmo);
}

function generateSql(intent: string, dmos: DmoObject[]): string {
  if (dmos.length === 0) return "-- Could not determine relevant DMOs. Please specify dmo_hints.";

  const intentNorm = normalise(intent);
  const primary = dmos[0];
  const tableName = primary.name ?? "UnknownDmo";
  const alias = "t1";

  // Find a plausible primary key, numeric measure, and grouping field
  const fields = primary.fields ?? [];
  const pkField = fields.find((f) => f.isPrimaryKey)?.name ?? fields[0]?.name ?? "Id";
  const numericField = fields.find(
    (f) => f.type === "Number" || f.type === "Currency" || f.type === "Decimal"
  )?.name;
  const dateField = fields.find(
    (f) => f.type === "Date" || f.type === "DateTime"
  )?.name;

  const hasRevenue = intentNorm.includes("revenue") || intentNorm.includes("amount") || intentNorm.includes("total");
  const hasCount   = intentNorm.includes("count") || intentNorm.includes("number of") || intentNorm.includes("how many");
  const hasDate    = intentNorm.includes("year") || intentNorm.includes("month") || intentNorm.includes("date") || intentNorm.includes("period");

  const selectMeasure = hasRevenue && numericField
    ? `SUM(${alias}.${numericField}) AS total_amount`
    : hasCount
    ? `COUNT(${alias}.${pkField}) AS record_count`
    : numericField
    ? `SUM(${alias}.${numericField}) AS total_value,\n       COUNT(${alias}.${pkField}) AS record_count`
    : `COUNT(${alias}.${pkField}) AS record_count`;

  const groupBy = `${alias}.${pkField}`;

  let joinClause = "";
  if (dmos.length > 1) {
    const secondary = dmos[1];
    const secName = secondary.name ?? "SecondDmo";
    const secPk = (secondary.fields ?? []).find((f) => f.isPrimaryKey)?.name ?? "Id";
    joinClause = `\nJOIN ${secName} t2 ON ${alias}.${pkField} = t2.${secPk}`;
  }

  const whereClause =
    hasDate && dateField
      ? `\nWHERE ${alias}.${dateField} >= DATE_TRUNC('year', CURRENT_DATE)`
      : "";

  return [
    `SELECT ${alias}.${pkField},`,
    `       ${selectMeasure}`,
    `FROM   ${tableName} ${alias}${joinClause}${whereClause}`,
    `GROUP BY ${groupBy}`,
    `ORDER BY 2 DESC`,
  ].join("\n");
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function handleProposeCiSql(
  input: ProposeCiSqlInput
): Promise<string> {
  const allDmos = await fetchDmoMetadata();
  if (allDmos.length === 0) {
    return "DMO schema cache is empty. Try calling get_dmo_schema first.";
  }

  const intentNorm = normalise(input.intent);
  const hints = input.dmo_hints ?? [];
  const selectedDmos = pickDmos(allDmos, intentNorm, hints);

  if (selectedDmos.length === 0) {
    const available = allDmos.slice(0, 10).map((d) => d.name ?? d.label).join(", ");
    return (
      `Could not identify relevant DMOs for: "${input.intent}".\n\n` +
      `Available DMOs (first 10): ${available}\n\n` +
      `Retry with dmo_hints to specify which DMOs to use.`
    );
  }

  const sql = generateSql(input.intent, selectedDmos);

  const dmoSummaries = selectedDmos.map((d) => {
    const fieldCount = (d.fields ?? []).length;
    return `- \`${d.name ?? d.label}\`${d.label ? ` — ${d.label}` : ""} (${fieldCount} fields)`;
  });

  return [
    `## Proposed Calculated Insight`,
    ``,
    `**Intent:** ${input.intent}`,
    ``,
    `**DMOs selected:**`,
    ...dmoSummaries,
    ``,
    `**Proposed SQL:**`,
    `\`\`\`sql`,
    sql,
    `\`\`\``,
    ``,
    `---`,
    `Does this SQL look correct? You can ask me to adjust the query before creating the CI.`,
    `Once confirmed, provide a name and I'll call create_calculated_insight.`,
  ].join("\n");
}
