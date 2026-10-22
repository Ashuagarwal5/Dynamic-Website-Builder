import "server-only";

import { apiFetch } from "../lib/api";

export function publishTenantSite(tenantId, siteId) {
  if (![tenantId, siteId].every((id) => typeof id === "string" && id)) throw new Error("Branch and website IDs are required.");
  return apiFetch(`/tenants/${encodeURIComponent(tenantId)}/sites/${encodeURIComponent(siteId)}/publish`, { method: "POST" });
}

export function unpublishTenantSite(tenantId, siteId) {
  if (![tenantId, siteId].every((id) => typeof id === "string" && id)) throw new Error("Branch and website IDs are required.");
  return apiFetch(`/tenants/${encodeURIComponent(tenantId)}/sites/${encodeURIComponent(siteId)}/unpublish`, { method: "POST" });
}

export function publishTenantPage(tenantId, siteId, pageId) {
  if (![tenantId, siteId, pageId].every((id) => typeof id === "string" && id)) throw new Error("Branch, website and page IDs are required.");
  return apiFetch(`/tenants/${encodeURIComponent(tenantId)}/sites/${encodeURIComponent(siteId)}/pages/${encodeURIComponent(pageId)}/publish`, { method: "POST" });
}

export function unpublishTenantPage(tenantId, siteId, pageId) {
  if (![tenantId, siteId, pageId].every((id) => typeof id === "string" && id)) throw new Error("Branch, website and page IDs are required.");
  return apiFetch(`/tenants/${encodeURIComponent(tenantId)}/sites/${encodeURIComponent(siteId)}/pages/${encodeURIComponent(pageId)}/unpublish`, { method: "POST" });
}
