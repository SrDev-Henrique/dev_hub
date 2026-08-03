import axios, { type InternalAxiosRequestConfig } from "axios";
import { toast } from "sonner";

import { clearTokens, getAccessToken, getRefreshToken, notifyUnauthorized, setAccessToken } from "./tokenStore";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";
const COLD_START_MAX_RETRIES = 6;
const COLD_START_RETRY_DELAY_MS = 10000;
const COLD_START_TOAST_ID = "cold-start";

interface RetryableConfig extends InternalAxiosRequestConfig {
  __coldStartRetries?: number;
  __authRetried?: boolean;
}

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

api.interceptors.response.use(
  (response) => {
    const config = response.config as RetryableConfig;
    if (config.__coldStartRetries) {
      toast.success("Conectado ao servidor!", { id: COLD_START_TOAST_ID });
    }
    return response;
  },
  async (error) => {
    const config = error.config as RetryableConfig | undefined;

    if (config && !error.response) {
      config.__coldStartRetries = config.__coldStartRetries ?? 0;
      if (config.__coldStartRetries < COLD_START_MAX_RETRIES) {
        if (config.__coldStartRetries === 0) {
          toast.loading(
            "O servidor está iniciando (pode levar até ~50s no primeiro acesso). Tentando de novo...",
            { id: COLD_START_TOAST_ID, duration: Infinity }
          );
        }
        config.__coldStartRetries += 1;
        await sleep(COLD_START_RETRY_DELAY_MS);
        return api(config);
      }
      toast.error("Não foi possível conectar ao servidor. Tente novamente em alguns instantes.", {
        id: COLD_START_TOAST_ID,
      });
      return Promise.reject(error);
    }

    if (config && error.response?.status === 401 && !config.__authRetried) {
      config.__authRetried = true;
      const refresh = getRefreshToken();
      if (refresh) {
        try {
          const { data } = await axios.post(`${BASE_URL}/auth/refresh/`, { refresh });
          setAccessToken(data.access);
          config.headers = config.headers ?? {};
          config.headers.Authorization = `Bearer ${data.access}`;
          return api(config);
        } catch {
          clearTokens();
          notifyUnauthorized();
        }
      } else {
        clearTokens();
        notifyUnauthorized();
      }
    }

    return Promise.reject(error);
  }
);
