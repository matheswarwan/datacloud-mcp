import axios from "axios";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import { SalesforceTokenResponse } from "../salesforce.js";

const SF_TOKEN_ENDPOINT = "/services/oauth2/token";
const JWT_EXPIRY_SECONDS = 300; // Salesforce max

export async function jwtBearerAuth(): Promise<SalesforceTokenResponse> {
  const clientId      = process.env.SF_CLIENT_ID;
  const privateKeyPath = process.env.SF_PRIVATE_KEY_PATH;
  const username      = process.env.SF_USERNAME;
  const loginUrl      = process.env.SF_LOGIN_URL ?? "https://login.salesforce.com";

  if (!clientId || !privateKeyPath || !username) {
    throw new Error(
      "jwt requires: SF_CLIENT_ID, SF_PRIVATE_KEY_PATH, SF_USERNAME, SF_LOGIN_URL"
    );
  }

  const resolvedKeyPath = path.resolve(privateKeyPath);
  let privateKey: string;
  try {
    privateKey = fs.readFileSync(resolvedKeyPath, "utf8");
  } catch {
    throw new Error(`Could not read private key at: ${resolvedKeyPath}. Check SF_PRIVATE_KEY_PATH.`);
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
