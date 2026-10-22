import "server-only";
import { apiFetch } from "../lib/api";

// Return the backend Response unchanged. The action handles errors, validates
// the response, and stores the access token without returning it to the browser.
export function loginUser({ email, password }) {
  return apiFetch("/auth/login", {
    authenticated: false,
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function registerUser({ name, email, password, tenantName, tenantSlug }) {
  return apiFetch("/auth/register", {
    authenticated: false,
    method: "POST",
    body: JSON.stringify({
      name,
      email,
      password,
      ...(tenantName ? { tenantName } : {}),
      ...(tenantSlug ? { tenantSlug } : {}),
    }),
  });
}

export function getCurrentUser() {
  return apiFetch("/auth/me", { method: "GET" });
}
