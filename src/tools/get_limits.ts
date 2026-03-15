import { z } from "zod";
import { fetchLimits, fetchUserInfo, LimitsInfo, UserInfo } from "../api/limits.js";

export const GetLimitsInputSchema = z.object({
  type: z
    .enum(["limits", "userinfo"])
    .optional()
    .describe("Type: 'limits' (default) to get org API limits, 'userinfo' to get current user info."),
});

export type GetLimitsInput = z.infer<typeof GetLimitsInputSchema>;

export const GET_LIMITS_TOOL = {
  name: "get_limits",
  description:
    "Fetch Salesforce Data Cloud org limits or current user information. " +
    "Use type='limits' (default) to see API usage limits, " +
    "type='userinfo' to get the authenticated user's details.",
  inputSchema: {
    type: "object" as const,
    properties: {
      type: {
        type: "string",
        enum: ["limits", "userinfo"],
        description: "Type: 'limits' (default) or 'userinfo'.",
      },
    },
    required: [],
  },
};

// ── Formatters ────────────────────────────────────────────────────────────────

function formatLimits(info: LimitsInfo): string {
  const entries = Object.entries(info);
  if (entries.length === 0) return "No limits information available.";
  return entries.map(([k, v]) => `• ${k}: ${JSON.stringify(v)}`).join("\n");
}

function formatUserInfo(info: UserInfo): string {
  const entries = Object.entries(info);
  if (entries.length === 0) return "No user information available.";
  return entries.map(([k, v]) => `• ${k}: ${JSON.stringify(v)}`).join("\n");
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function handleGetLimits(input: GetLimitsInput): Promise<string> {
  const type = input.type ?? "limits";

  if (type === "userinfo") {
    const info = await fetchUserInfo();
    return `User Info:\n\n${formatUserInfo(info)}`;
  }

  const info = await fetchLimits();
  return `Org Limits:\n\n${formatLimits(info)}`;
}
