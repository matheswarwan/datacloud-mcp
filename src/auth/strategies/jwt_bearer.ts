import axios from "axios";
import jwt from "jsonwebtoken";
import { SalesforceTokenResponse } from "../salesforce.js";

const SF_TOKEN_ENDPOINT = "/services/oauth2/token";
const JWT_EXPIRY_SECONDS = 300; // Salesforce max

export async function jwtBearerAuth(): Promise<SalesforceTokenResponse> {
  const clientId   = process.env.SF_CLIENT_ID;
  const username   = process.env.SF_USERNAME;
  const loginUrl   = process.env.SF_LOGIN_URL ?? "https://login.salesforce.com";

  // SF_PRIVATE_KEY: PEM content as env var (preferred for Cloudflare Workers / any hosted env)
  // SF_PRIVATE_KEY_PATH: path to PEM file (local only)
  let privateKey = process.env.SF_PRIVATE_KEY;
  if (!privateKey && process.env.SF_PRIVATE_KEY_PATH) {
    try {
      const { readFileSync } = await import("fs");
      const { resolve } = await import("path");
      privateKey = readFileSync(resolve(process.env.SF_PRIVATE_KEY_PATH), "utf8");
    } catch {
      throw new Error(`Could not read private key at: ${process.env.SF_PRIVATE_KEY_PATH}. Check SF_PRIVATE_KEY_PATH.`);
    }
  }

  if (!clientId || !privateKey || !username) {
    throw new Error(
      "jwt requires: SF_CLIENT_ID, SF_USERNAME, SF_LOGIN_URL, and either SF_PRIVATE_KEY (PEM content) or SF_PRIVATE_KEY_PATH"
    );
  }

  const now = Math.floor(Date.now() / 1000);
  const assertion = jwt.sign(
    { iss: clientId, sub: username, aud: loginUrl, exp: now + JWT_EXPIRY_SECONDS },
    privateKey,
    { algorithm: "RS256" }
  );

  const params = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion,
  });

  try {
    const response = await axios.post<SalesforceTokenResponse>(
      `${loginUrl}${SF_TOKEN_ENDPOINT}`,
      params.toString(),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );
    return response.data;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      throw new Error(`Salesforce JWT Bearer failed: ${JSON.stringify(err.response?.data ?? err.message)}`);
    }
    throw err;
  }
}
