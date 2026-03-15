import { z } from "zod";
import {
  fetchIdentityResolutions,
  fetchIdentityResolution,
  IdentityResolution,
  IdentityResolutionMatchRule,
  IdentityResolutionReconciliationRule,
} from "../api/identity_resolutions.js";

export const GetIdentityResolutionsInputSchema = z.object({
  developerName: z
    .string()
    .optional()
    .describe("Developer name of a specific IDR ruleset. Omit to list all."),
  limit: z
    .number()
    .int()
    .min(1)
    .max(1000)
    .optional()
    .describe("Max number of rulesets to return when listing (default: 100)."),
});

export type GetIdentityResolutionsInput = z.infer<typeof GetIdentityResolutionsInputSchema>;

export const GET_IDENTITY_RESOLUTIONS_TOOL = {
  name: "get_identity_resolutions",
  description:
    "List all Identity Resolution (IDR) rulesets in the connected Salesforce Data Cloud org, " +
    "or fetch details of a specific ruleset by developerName. " +
    "Use this when asked about identity resolution, IDR rulesets, match rules, or reconciliation rules.",
  inputSchema: {
    type: "object" as const,
    properties: {
      developerName: {
        type: "string",
        description: "Developer name of a specific IDR ruleset. Omit to list all.",
      },
      limit: {
        type: "number",
        description: "Max number of rulesets to return when listing (default: 100).",
      },
    },
    required: [],
  },
};

// ── Formatters ────────────────────────────────────────────────────────────────

function formatMatchRule(r: IdentityResolutionMatchRule, i: number): string {
  const type = r.matchingAttributeType ?? r.matchType ?? "—";
  const fields = Array.isArray(r.matchFields)
    ? r.matchFields.map((f) => f.contactPointPath ?? JSON.stringify(f)).join(", ")
    : "—";
  return `    [${i + 1}] type: ${type} | matchType: ${r.matchType ?? "—"} | fields: ${fields}`;
}

function formatReconciliationRule(
  r: IdentityResolutionReconciliationRule,
  i: number
): string {
  const field = r.fieldApiName ?? "—";
  const obj = r.objectApiName ?? "—";
  const recon = r.reconciliationType ?? "—";
  return `    [${i + 1}] ${obj}.${field} — ${recon}`;
}

function formatIDR(idr: IdentityResolution, index: number): string {
  const name = (idr.name ?? idr.developerName ?? `Ruleset #${index + 1}`) as string;
  const devName = (idr.developerName ?? "—") as string;
  const status = (idr.status ?? idr.runStatus ?? "—") as string;

  const lines: string[] = [`• ${name} (developerName: ${devName}) — status: ${status}`];

  if (Array.isArray(idr.matchRules) && idr.matchRules.length > 0) {
    lines.push(`  Match Rules (${idr.matchRules.length}):`);
    idr.matchRules.forEach((r, i) => lines.push(formatMatchRule(r, i)));
  }

  if (Array.isArray(idr.reconciliationRules) && idr.reconciliationRules.length > 0) {
    lines.push(`  Reconciliation Rules (${idr.reconciliationRules.length}):`);
    idr.reconciliationRules.forEach((r, i) => lines.push(formatReconciliationRule(r, i)));
  }

  const shown = new Set([
    "name", "developerName", "status", "runStatus", "matchRules", "reconciliationRules",
    "createdDate", "lastModifiedDate",
  ]);
  const extras = Object.entries(idr)
    .filter(([k]) => !shown.has(k))
    .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
    .join(" | ");
  if (extras) lines.push(`  ${extras}`);

  return lines.join("\n");
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function handleGetIdentityResolutions(
  input: GetIdentityResolutionsInput
): Promise<string> {
  if (input.developerName) {
    const idr = await fetchIdentityResolution(input.developerName);
    return `Identity Resolution Ruleset:\n\n${formatIDR(idr, 0)}`;
  }

  const rulesets = await fetchIdentityResolutions(input.limit ?? 100);

  if (rulesets.length === 0) {
    return "No identity resolution rulesets found in this Data Cloud org.";
  }

  const lines = rulesets.map((r, i) => formatIDR(r, i));
  return `Found ${rulesets.length} identity resolution ruleset(s):\n\n${lines.join("\n\n")}`;
}
