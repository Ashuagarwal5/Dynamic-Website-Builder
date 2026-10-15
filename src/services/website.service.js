import "server-only";

import { apiFetch } from "../lib/api";

export function listTenantSites(tenantId) {
  if (typeof tenantId !== "string" || !tenantId) throw new Error("A tenant ID is required.");
  return apiFetch(`/tenants/${encodeURIComponent(tenantId)}/sites`, { method: "GET" });
}

export function createTenantSite(tenantId, { name, slug }) {
  if (typeof tenantId !== "string" || !tenantId) throw new Error("A tenant ID is required.");
  return apiFetch(`/tenants/${encodeURIComponent(tenantId)}/sites`, { method: "POST", body: JSON.stringify({ name, slug }) });
}
