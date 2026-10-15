import "server-only";
import { apiFetch } from "../lib/api";

export function listSitePages(tenantId, siteId) {
  if (!tenantId || !siteId || typeof tenantId !== "string" || typeof siteId !== "string") throw new Error("Branch and website IDs are required.");
  return apiFetch(`/tenants/${encodeURIComponent(tenantId)}/sites/${encodeURIComponent(siteId)}/pages`, { method: "GET" });
}

export function createSitePage(tenantId, siteId, { name, slug }) {
  if (!tenantId || !siteId || typeof tenantId !== "string" || typeof siteId !== "string") throw new Error("Branch and website IDs are required.");
  return apiFetch(`/tenants/${encodeURIComponent(tenantId)}/sites/${encodeURIComponent(siteId)}/pages`, { method: "POST", body: JSON.stringify({ name, slug }) });
}

export function getSitePage(tenantId, siteId, pageId) {
  if (![tenantId, siteId, pageId].every((id) => typeof id === "string" && id)) throw new Error("Branch, website, and page IDs are required.");
  return apiFetch(`/tenants/${encodeURIComponent(tenantId)}/sites/${encodeURIComponent(siteId)}/pages/${encodeURIComponent(pageId)}`, { method: "GET" });
}
