#!/usr/bin/env node
/**
 * HTTP entry-point for datacloud-mcp.
 *
 * Runs as an OAuth2 proxy server:
 *   - Redirects MCP clients to Salesforce for login (production or sandbox)
 *   - Exchanges the auth code for a Salesforce access token using the
 *     server-level Connected App credentials (SF_CLIENT_ID / SF_CLIENT_SECRET)
 *   - Issues the SF token back to the MCP client as a Bearer credential
 *   - Validates the Bearer token on each MCP request via Salesforce's
 *     /services/oauth2/userinfo endpoint, then injects it into the Data
 *     Cloud token cache so all MCP tools work transparently
 *
 * Required env vars:
 *   SF_CLIENT_ID       Salesforce Connected App consumer key
 *   SF_CLIENT_SECRET   Salesforce Connected App consumer secret
 *   SF_LOGIN_URL       Auth server URL (default: https://login.salesforce.com)
 *                      Use https://test.salesforce.com for sandboxes.
 *   SERVER_URL         Public URL of THIS server (default: http://localhost:PORT)
 *                      Must match the Connected App's callback URL exactly.
 *
 * Optional:
 *   PORT               HTTP port (default: 3456)
 *
 * Claude Desktop config example:
 *   {
 *     "mcpServers": {
 *       "datacloud": {
 *         "url": "http://localhost:3456/mcp"
 *       }
 *     }
 *   }
 */
import "dotenv/config";
import express from "express";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { mcpAuthRouter } from "@modelcontextprotocol/sdk/server/auth/router.js";
import { requireBearerAuth } from "@modelcontextprotocol/sdk/server/auth/middleware/bearerAuth.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createServer as createMcpServer } from "./server.js";
import { SalesforceOAuthProvider } from "./auth/salesforce_oauth_provider.js";

const PORT = Number(process.env.PORT ?? 3456);
const SERVER_URL = process.env.SERVER_URL ?? `http://localhost:${PORT}`;
const SF_LOGIN_URL = process.env.SF_LOGIN_URL ?? "https://login.salesforce.com";

if (!process.env.SF_CLIENT_ID) {
  console.error("[http] WARNING: SF_CLIENT_ID is not set — OAuth flows will fail.");
}

const provider = new SalesforceOAuthProvider(SF_LOGIN_URL);

// createMcpExpressApp adds DNS-rebinding protection for localhost
const app = createMcpExpressApp({ host: "0.0.0.0" });

// ── OAuth2 metadata + authorize / token / register / revoke endpoints ─────────
app.use(
  mcpAuthRouter({
    provider,
    issuerUrl: new URL(SERVER_URL),
    scopesSupported: ["api", "refresh_token"],
    serviceDocumentationUrl: new URL(
      "https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/"
    ),
  })
);

app.use(express.json());

// ── MCP endpoint ──────────────────────────────────────────────────────────────
const bearerAuth = requireBearerAuth({ verifier: provider });

// POST /mcp — JSON-RPC request/response (main transport for Claude Desktop)
app.post("/mcp", bearerAuth, async (req, res) => {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless — no session state server-side
    enableJsonResponse: true,
  });
  const server = createMcpServer();
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
  await server.close();
});

// GET /mcp — SSE subscription for server-initiated messages
app.get("/mcp", bearerAuth, async (req, res) => {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });
  const server = createMcpServer();
  await server.connect(transport);
  await transport.handleRequest(req, res);
  // SSE — keep alive; server.close() would terminate the stream
});

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    mode: "oauth-proxy",
    sfLoginUrl: SF_LOGIN_URL,
    serverUrl: SERVER_URL,
    sfClientId: process.env.SF_CLIENT_ID ? "configured" : "MISSING",
  });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.error("─────────────────────────────────────────────────────────────");
  console.error(" datacloud-mcp  (OAuth proxy mode)");
  console.error(`  MCP endpoint : ${SERVER_URL}/mcp`);
  console.error(`  Auth server  : ${SF_LOGIN_URL}`);
  console.error(`  SF_CLIENT_ID : ${process.env.SF_CLIENT_ID ? "✓ set" : "✗ NOT SET"}`);
  console.error("─────────────────────────────────────────────────────────────");
});
