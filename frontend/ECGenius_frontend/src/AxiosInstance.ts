import axios, { type InternalAxiosRequestConfig } from "axios";

const AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Request interceptor: fall back to the persisted bearer token (an opaque
// credential, not user data) when AuthProvider hasn't set the default header
// yet — e.g. the very first request fired during a hard page reload.
AxiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("ecg:token");
    if (token) {
      config.headers = config.headers || {};
      if (!config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const RETRYABLE_STATUS = 503;
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

interface RetryableConfig extends InternalAxiosRequestConfig {
  __retryCount?: number;
}

// Defense-in-depth for the backend's "database not ready yet" cold-start window:
// transparently retry a 503 ("Database unavailable" / "MongoDB is not ready yet")
// with linear backoff before surfacing it to the caller. Most requests during a
// cold start now succeed silently instead of presenting a raw 503 on first load.
AxiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error?.config as RetryableConfig | undefined;
    const status = error?.response?.status;

    if (config && status === RETRYABLE_STATUS) {
      const retryCount = config.__retryCount ?? 0;
      if (retryCount < MAX_RETRIES) {
        config.__retryCount = retryCount + 1;
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * (retryCount + 1)));
        return AxiosInstance(config);
      }
    }

    return Promise.reject(error);
  }
);

export default AxiosInstance;
