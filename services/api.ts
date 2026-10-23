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
