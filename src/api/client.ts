import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from "axios";
import { getDataCloudToken, invalidateDataCloudToken } from "../auth/datacloud.js";

let _client: AxiosInstance | null = null;

async function buildClient(): Promise<AxiosInstance> {
  const { accessToken, instanceUrl } = await getDataCloudToken();

  const client = axios.create({
    baseURL: instanceUrl,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  // On 401, invalidate the cached token and retry once
  client.interceptors.response.use(
    (res) => res,
    async (error: AxiosError) => {
      const config = error.config as InternalAxiosRequestConfig & { _retried?: boolean };
      if (error.response?.status === 401 && !config._retried) {
        config._retried = true;
        invalidateDataCloudToken();
        const { accessToken: newToken, instanceUrl: newBase } =
          await getDataCloudToken();
        config.headers["Authorization"] = `Bearer ${newToken}`;
        config.baseURL = newBase;
        return client(config);
      }
      return Promise.reject(error);
    }
  );

  return client;
}

export async function getDCClient(): Promise<AxiosInstance> {
  // Re-use the existing client unless the token was invalidated
  if (_client) return _client;
  _client = await buildClient();
  return _client;
}

/** Reset the cached client (called alongside invalidateDataCloudToken). */
export function resetDCClient(): void {
  _client = null;
}
