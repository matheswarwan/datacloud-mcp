import axios from "axios";

const SF_TOKEN_ENDPOINT = "/services/oauth2/token";

export interface SalesforceTokenResponse {
  access_token: string;
  instance_url: string;
  token_type: string;
}

export async function getSalesforceAccessToken(): Promise<SalesforceTokenResponse> {
  const clientId = process.env.SF_CLIENT_ID;
  const clientSecret = process.env.SF_CLIENT_SECRET;
  const username = process.env.SF_USERNAME;
  const password = process.env.SF_PASSWORD;
  const loginUrl = process.env.SF_LOGIN_URL;

  if (!clientId || !clientSecret || !username || !password || !loginUrl) {
    throw new Error(
      "Missing required env vars: SF_CLIENT_ID, SF_CLIENT_SECRET, SF_USERNAME, SF_PASSWORD, SF_LOGIN_URL"
    );
  }

  const params = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
    username,
    password,
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
      const detail = err.response?.data
        ? JSON.stringify(err.response.data)
        : err.message;
      throw new Error(`Salesforce OAuth failed: ${detail}`);
    }
    throw err;
  }
}
