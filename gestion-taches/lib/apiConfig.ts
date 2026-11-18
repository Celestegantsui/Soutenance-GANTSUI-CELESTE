export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const API_ENDPOINTS = {
  login: "/api/login",
  me: "/api/me",
  logout: "/api/logout",
  // ajouter d'autres selon besoin
};

export async function apiCall(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = localStorage.getItem("auth_token");
  const headers: any = options.headers || {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return fetch(API_BASE + endpoint, {
    ...options,
    headers,
    credentials: "include",
  });
}
