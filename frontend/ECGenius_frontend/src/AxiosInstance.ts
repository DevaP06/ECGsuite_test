import axios, { type InternalAxiosRequestConfig } from "axios";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// Refresh tokens travel as an httpOnly cookie, so every request (and the
// refresh call itself) needs withCredentials for the cookie to be sent/set.
const AxiosInstance = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

const TOKEN_KEY = "ecg:token";
const REFRESH_URL = "/api/auth/refresh";

// Request interceptor: fall back to the persisted bearer token (an opaque
// credential, not user data) when AuthProvider hasn't set the default header
// yet — e.g. the very first request fired during a hard page reload.
AxiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
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
  __isRetryAfterRefresh?: boolean;
}

let refreshPromise: Promise<string | null> | null = null;

// Exchanges the httpOnly refresh-token cookie for a new access token. Concurrent
// callers (e.g. several requests 401-ing at once) share a single in-flight
// request instead of each triggering their own rotation.
export function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${baseURL}${REFRESH_URL}`, {}, { withCredentials: true })
      .then((response) => {
        const token = response.data?.data?.token as string | undefined;
        if (!token) return null;
        localStorage.setItem(TOKEN_KEY, token);
        AxiosInstance.defaults.headers.common.Authorization = `Bearer ${token}`;
        return token;
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
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

    // Silent refresh: a 15-minute access token expiring mid-session surfaces as
    // a 401 on whatever request is in flight. Exchange the refresh-token cookie
    // for a new access token and retry once; if that also fails, the session is
    // truly over and the app should fall back to the login screen.
    if (config && status === 401 && !config.__isRetryAfterRefresh) {
      config.__isRetryAfterRefresh = true;
      const newToken = await refreshAccessToken();
      if (newToken) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${newToken}`;
        return AxiosInstance(config);
      }

      localStorage.removeItem(TOKEN_KEY);
      delete AxiosInstance.defaults.headers.common.Authorization;
      window.dispatchEvent(new Event("auth:session-expired"));
    }

    return Promise.reject(error);
  }
);

export default AxiosInstance;
