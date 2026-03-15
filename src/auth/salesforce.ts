import { clientCredentialsAuth } from "./strategies/client_credentials.js";
import { jwtBearerAuth } from "./strategies/jwt_bearer.js";

export interface SalesforceTokenResponse {
  access_token: string;
  instance_url: string;
  token_type: string;
}

export type AuthMethod = "client_credentials" | "jwt";

export function getAuthMethod(): AuthMethod {
  const method = (process.env.SF_AUTH_METHOD ?? "client_credentials") as AuthMethod;
  const valid: AuthMethod[] = ["client_credentials", "jwt"];
  if (!valid.includes(method)) {
    throw new Error(
      `Unknown SF_AUTH_METHOD: "${method}". Must be one of: ${valid.join(", ")}`
    );
  }
  return method;
}

export async function getSalesforceAccessToken(): Promise<SalesforceTokenResponse> {
  const method = getAuthMethod();
  console.error(`[auth] Using auth method: ${method}`);

  switch (method) {
    case "client_credentials":
      return clientCredentialsAuth();
    case "jwt":
      return jwtBearerAuth();
  }
}
