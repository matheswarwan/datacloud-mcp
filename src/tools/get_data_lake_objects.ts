import { z } from "zod";
import { fetchDataLakeObjects, fetchDataLakeObject, DataLakeObject, DloField } from "../api/data_lake_objects.js";

export const GetDataLakeObjectsInputSchema = z.object({
  nameOrId: z
    .string()
    .optional()
    .describe("Developer name or record ID of a specific Data Lake Object. Omit to list all."),
  limit: z
    .number()
    .int()
    .min(1)
    .max(1000)
    .optional()
    .describe("Max number of objects to return when listing (default: 100)."),
});

export type GetDataLakeObjectsInput = z.infer<typeof GetDataLakeObjectsInputSchema>;

export const GET_DATA_LAKE_OBJECTS_TOOL = {
  name: "get_data_lake_objects",
  description:
    "List all Data Lake Objects (DLOs) in the connected Salesforce Data Cloud org, " +
    "or fetch details (including fields) of a specific DLO by developer name or record ID. " +
    "Use this when asked about data lake objects, DLOs, or their fields and schema.",
  inputSchema: {
    type: "object" as const,
    properties: {
      nameOrId: {
        type: "string",
        description: "Developer name or record ID of a specific DLO. Omit to list all.",
      },
      limit: {
        type: "number",
        description: "Max number of objects to return when listing (default: 100).",
      },
    },
    required: [],
  },
};

// ── Formatters ────────────────────────────────────────────────────────────────

function formatFields(fields: DloField[]): string {
  const pkFields = fields.filter((f) => f.isPrimaryKey);
  const regularFields = fields.filter((f) => !f.isPrimaryKey);
  const lines: string[] = [];

  if (pkFields.length > 0) {
    lines.push(`    PK: ${pkFields.map((f) => `${f.name ?? f.label} (${f.dataType ?? "?"}`).join(", ")})`);
  }
  regularFields.slice(0, 10).forEach((f) => {
    lines.push(`    • ${f.name ?? f.label} — ${f.dataType ?? "?"}`);
  });
  if (regularFields.length > 10) {
    lines.push(`    … and ${regularFields.length - 10} more fields`);
  }
  return lines.join("\n");
}

function formatDLO(dlo: DataLakeObject, index: number): string {
  const name = (dlo.name ?? dlo.label ?? `DLO #${index + 1}`) as string;
  const label = (dlo.label ?? "—") as string;
  const id = (dlo.id ?? "—") as string;
  const category = (dlo.category ?? "—") as string;
  const status = (dlo.status ?? "—") as string;

  const spaces = Array.isArray(dlo.dataSpaceInfo) && dlo.dataSpaceInfo.length > 0
    ? dlo.dataSpaceInfo.map((s) => s.name ?? s.label).join(", ")
    : "—";

  const fields = dlo.fields ?? dlo.dataLakeFieldInfoRepresentation ?? [];
  const lines = [
    `• ${label} (name: ${name})`,
    `  id: ${id} | category: ${category} | status: ${status} | dataSpaces: ${spaces}`,
  ];

  if (Array.isArray(fields) && fields.length > 0) {
    lines.push(`  Fields (${fields.length}):`);
    lines.push(formatFields(fields as DloField[]));
  }

  return lines.join("\n");
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function handleGetDataLakeObjects(input: GetDataLakeObjectsInput): Promise<string> {
  if (input.nameOrId) {
    const dlo = await fetchDataLakeObject(input.nameOrId);
    return `Data Lake Object:\n\n${formatDLO(dlo, 0)}`;
  }

  const dlos = await fetchDataLakeObjects(input.limit ?? 100);

  if (dlos.length === 0) {
    return "No Data Lake Objects found in this Data Cloud org.";
  }

  const lines = dlos.map((d, i) => formatDLO(d, i));
  return `Found ${dlos.length} Data Lake Object(s):\n\n${lines.join("\n\n")}`;
}
