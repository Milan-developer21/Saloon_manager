// API client for the Saloon Manager mobile app
// Handles HTTP requests to the backend API with authentication

import AsyncStorage from "@react-native-async-storage/async-storage";

// Get base URL for API requests (supports custom domain or localhost)
function getBaseUrl() {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  if (domain) return `https://${domain}/api`;
  return "http://localhost:3001/api"; // Updated to match API server port
}

// Retrieve JWT token from AsyncStorage
async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem("authToken");
}

// Generic request function with error handling
async function request<T>(method: string, path: string, body?: any, token?: string | null): Promise<T> {
  const tok = token !== undefined ? token : await getToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (tok) headers["Authorization"] = `Bearer ${tok}`;

  const res = await fetch(`${getBaseUrl()}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({ success: false, error: "Invalid response" }));
  if (!data.success) throw new Error(data.error || "Request failed");
  return data.data as T;
}

// API client object with HTTP method shortcuts
export const api = {
  get: <T>(path: string, token?: string | null) => request<T>("GET", path, undefined, token),
  post: <T>(path: string, body: any, token?: string | null) => request<T>("POST", path, body, token),
  put: <T>(path: string, body: any, token?: string | null) => request<T>("PUT", path, body, token),
  patch: <T>(path: string, body?: any, token?: string | null) => request<T>("PATCH", path, body, token),
};

export default api;
