import { z } from "zod";
import {
  fetchDocumentProcessingConfigs,
  fetchDocumentProcessingConfig,
  fetchDocumentProcessingGlobalConfig,
  DocumentProcessingConfig,
} from "../api/document_processing.js";

export const GetDocumentProcessingInputSchema = z.object({
  idOrApiName: z
    .string()
    .optional()
    .describe("ID or API name of a specific document processing configuration. Omit to list all."),
  action: z
    .enum(["list", "global-config"])
    .optional()
    .describe("Action: 'list' (default) to list configs, 'global-config' to get the global configuration."),
});

export type GetDocumentProcessingInput = z.infer<typeof GetDocumentProcessingInputSchema>;

export const GET_DOCUMENT_PROCESSING_TOOL = {
  name: "get_document_processing",
  description:
    "Access document processing configurations in Salesforce Data Cloud. " +
    "List or get specific configurations, or fetch the global document processing configuration. " +
    "Use this when asked about document processing, PDF extraction, or document configurations.",
  inputSchema: {
    type: "object" as const,
    properties: {
      idOrApiName: {
        type: "string",
        description: "ID or API name of a specific configuration. Omit to list all.",
      },
      action: {
        type: "string",
        enum: ["list", "global-config"],
        description: "Action: 'list' (default) or 'global-config'.",
      },
    },
    required: [],
  },
};

// ── Formatters ────────────────────────────────────────────────────────────────

function formatConfig(c: DocumentProcessingConfig): string {
  const name = (c.name ?? c.label ?? c.apiName ?? "—") as string;
  const label = (c.label ?? "—") as string;
  const id = (c.id ?? "—") as string;
  const apiName = (c.apiName ?? "—") as string;
  const status = (c.status ?? "—") as string;
  return `• ${label} (name: ${name})\n  id: ${id} | apiName: ${apiName} | status: ${status}`;
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function handleGetDocumentProcessing(input: GetDocumentProcessingInput): Promise<string> {
  if (input.action === "global-config") {
    const config = await fetchDocumentProcessingGlobalConfig();
    return `Document Processing Global Config:\n\n${JSON.stringify(config, null, 2)}`;
  }

  if (input.idOrApiName) {
    const config = await fetchDocumentProcessingConfig(input.idOrApiName);
    return `Document Processing Configuration:\n\n${formatConfig(config)}`;
  }

  const configs = await fetchDocumentProcessingConfigs();
  if (configs.length === 0) return "No document processing configurations found.";
  return `Found ${configs.length} document processing configuration(s):\n\n${configs.map(formatConfig).join("\n\n")}`;
}
