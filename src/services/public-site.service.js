import "server-only";
import { apiFetch } from "../lib/api";

// Public endpoint: no session or bearer token is sent.
export function getPublicSite(subdomain) {
  if (typeof subdomain !== "string" || !subdomain) throw new Error("A subdomain is required.");
  return apiFetch(`/public/sites/${encodeURIComponent(subdomain)}`, { authenticated: false, method: "GET" });
}
