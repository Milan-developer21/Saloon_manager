import AsyncStorage from "@react-native-async-storage/async-storage";

function getBaseUrl() {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  if (domain) return `https://${domain}/api`;
  return "http://localhost:8080/api";
}

async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem("authToken");
}

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

export const api = {
  get: <T>(path: string, token?: string | null) => request<T>("GET", path, undefined, token),
  post: <T>(path: string, body: any, token?: string | null) => request<T>("POST", path, body, token),
  put: <T>(path: string, body: any, token?: string | null) => request<T>("PUT", path, body, token),
  patch: <T>(path: string, body?: any, token?: string | null) => request<T>("PATCH", path, body, token),
};

export default api;
