import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createServer } from "./server.js";

export interface Env {
  SF_AUTH_METHOD?: string;
  SF_CLIENT_ID?: string;
  SF_CLIENT_SECRET?: string;
  SF_USERNAME?: string;
  SF_PASSWORD?: string;
  SF_LOGIN_URL?: string;
  SF_PRIVATE_KEY?: string;
  TOKEN_EXPIRY_BUFFER?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Bridge Cloudflare Worker env bindings to process.env (Cloudflare secrets / wrangler vars)
    for (const [key, value] of Object.entries(env)) {
      if (value !== undefined && value !== "") {
        process.env[key] = value;
      }
    }

    // Allow credentials to be passed via request headers at runtime (e.g. from claude_desktop_config.json)
    // Headers take precedence over env bindings so each client can use their own credentials.
    const headerMap: Record<string, string> = {
      "x-sf-client-id":     "SF_CLIENT_ID",
      "x-sf-client-secret": "SF_CLIENT_SECRET",
      "x-sf-username":      "SF_USERNAME",
      "x-sf-password":      "SF_PASSWORD",
      "x-sf-login-url":     "SF_LOGIN_URL",
      "x-sf-auth-method":   "SF_AUTH_METHOD",
      "x-sf-private-key":   "SF_PRIVATE_KEY",
    };
    for (const [header, envKey] of Object.entries(headerMap)) {
      const val = request.headers.get(header);
      if (val) process.env[envKey] = val;
    }

    // Health check
    if (request.method === "GET" && new URL(request.url).pathname === "/health") {
      return new Response("datacloud-mcp is running", {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }

    const server = createServer();
    const transport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: undefined, // stateless mode
      enableJsonResponse: true,
    });

    await server.connect(transport);
    const response = await transport.handleRequest(request);
    await server.close();
    return response;
  },
};
