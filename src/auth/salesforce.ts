import { clientCredentialsAuth } from "./strategies/client_credentials.js";
import { jwtBearerAuth } from "./strategies/jwt_bearer.js";
import { oauthCodeAuth, OAuthCodeTokenResponse } from "./strategies/oauth_code.js";

export interface SalesforceTokenResponse {
  access_token: string;
  instance_url: string;
  token_type: string;
  refresh_token?: string;
}

export type AuthMethod = "client_credentials" | "jwt" | "oauth_code";

export function getAuthMethod(): AuthMethod {
  const method = (process.env.SF_AUTH_METHOD ?? "client_credentials") as AuthMethod;
  const valid: AuthMethod[] = ["client_credentials", "jwt", "oauth_code"];
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
    case "oauth_code":
      return oauthCodeAuth() as Promise<OAuthCodeTokenResponse>;
  }
}
