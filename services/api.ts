import axios, { AxiosError } from "axios";

const rawBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7000";
const apiBaseUrl = rawBaseUrl.endsWith("/api") ? rawBaseUrl : `${rawBaseUrl.replace(/\/+$/, "")}/api`;

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("last_active_at", Date.now().toString());
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Check 30-day continuous inactivity
    if (typeof window !== "undefined") {
      const lastActive = localStorage.getItem("last_active_at");
      if (lastActive) {
        const INACTIVITY_TIMEOUT_MS = 30 * 24 * 60 * 60 * 1000;
        if (Date.now() - Number(lastActive) > INACTIVITY_TIMEOUT_MS) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          localStorage.removeItem("user_profile");
          localStorage.removeItem("last_active_at");
          window.location.href = "/login";
          return Promise.reject(error);
        }
      }
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (originalRequest.url?.includes("/auth/refresh") || originalRequest.url?.includes("/auth/login")) {
        return Promise.reject(error);
      }

      const refreshToken = typeof window !== "undefined" ? localStorage.getItem("refresh_token") : null;
      if (!refreshToken) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(`${apiBaseUrl}/auth/refresh`, { refreshToken });
        if (data.accessToken) {
          localStorage.setItem("access_token", data.accessToken);
          localStorage.setItem("refresh_token", data.refreshToken);
          localStorage.setItem("last_active_at", Date.now().toString());
          apiClient.defaults.headers.common.Authorization = `Bearer ${data.accessToken}`;
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          processQueue(null, data.accessToken);
          return apiClient(originalRequest);
        }
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        if (typeof window !== "undefined") {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          localStorage.removeItem("user_profile");
          localStorage.removeItem("last_active_at");
          window.location.href = "/login";
        }
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export interface ApiErrorPayload {
  statusCode: number;
  message: string | string[];
  error?: string;
}

export function parseApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const serverError = error as AxiosError<ApiErrorPayload>;
    if (serverError.response?.data?.message) {
      const msg = serverError.response.data.message;
      return Array.isArray(msg) ? msg.join(", ") : msg;
    }
    return serverError.message;
  }
  return "An unexpected network error occurred.";
}
