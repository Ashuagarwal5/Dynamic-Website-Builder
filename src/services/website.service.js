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

export function updateTenantSite(tenantId, siteId, changes) {
  if (![tenantId, siteId].every((id) => typeof id === "string" && id)) throw new Error("Branch and website IDs are required.");
  return apiFetch(`/tenants/${encodeURIComponent(tenantId)}/sites/${encodeURIComponent(siteId)}`, { method: "PATCH", body: JSON.stringify(changes) });
}

export function deleteTenantSite(tenantId, siteId) {
  if (![tenantId, siteId].every((id) => typeof id === "string" && id)) throw new Error("Branch and website IDs are required.");
  return apiFetch(`/tenants/${encodeURIComponent(tenantId)}/sites/${encodeURIComponent(siteId)}`, { method: "DELETE" });
}
