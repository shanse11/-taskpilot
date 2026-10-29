const tokenKey = "taskpilot.accessToken";

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface ApiError {
  message?: string;
}

export function getStoredToken(): string | null {
  return window.localStorage.getItem(tokenKey);
}

export function storeToken(token: string): void {
  window.localStorage.setItem(tokenKey, token);
}

export function clearStoredToken(): void {
  window.localStorage.removeItem(tokenKey);
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const token = getStoredToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`/api${path}`, { ...init, headers, credentials: "include" });
  if (response.status === 204) return undefined as T;

  const data = (await response.json().catch(() => ({}))) as ApiError & T;
  if (!response.ok) {
    throw new Error(data.message || `Request failed (${response.status})`);
  }
  return data;
}

export const authApi = {
  register: (input: { email: string; password: string; name: string }) =>
    apiRequest<{ user: User }>("/auth/register", { method: "POST", body: JSON.stringify(input) }),
  login: (input: { email: string; password: string }) =>
    apiRequest<{ token: string; user: User }>("/auth/login", { method: "POST", body: JSON.stringify(input) }),
  me: () => apiRequest<{ user: User }>("/auth/me"),
  updateProfile: (input: { name: string }) =>
    apiRequest<{ user: User }>("/auth/me", { method: "PATCH", body: JSON.stringify(input) }),
  logout: () => apiRequest<void>("/auth/logout", { method: "POST" }),
};
