import "server-only";
import { apiFetch } from "../lib/api";

export function listPageSections(tenantId, siteId, pageId) {
  if (![tenantId, siteId, pageId].every((id) => typeof id === "string" && id)) throw new Error("Branch, website, and page IDs are required.");
  return apiFetch(`/tenants/${encodeURIComponent(tenantId)}/sites/${encodeURIComponent(siteId)}/pages/${encodeURIComponent(pageId)}/sections`, { method: "GET" });
}

export function createPageSection(tenantId, siteId, pageId, { type, sortOrder, isActive, config }) {
  if (![tenantId, siteId, pageId].every((id) => typeof id === "string" && id)) throw new Error("Branch, website, and page IDs are required.");
  return apiFetch(`/tenants/${encodeURIComponent(tenantId)}/sites/${encodeURIComponent(siteId)}/pages/${encodeURIComponent(pageId)}/sections`, { method: "POST", body: JSON.stringify({ type, sortOrder, isActive, config }) });
}

export function updatePageSection(tenantId, siteId, pageId, sectionId, { type, sortOrder, isActive, config }) {
  if (![tenantId, siteId, pageId, sectionId].every((id) => typeof id === "string" && id)) throw new Error("Branch, website, page, and section IDs are required.");
  return apiFetch(`/tenants/${encodeURIComponent(tenantId)}/sites/${encodeURIComponent(siteId)}/pages/${encodeURIComponent(pageId)}/sections/${encodeURIComponent(sectionId)}`, { method: "PATCH", body: JSON.stringify({ type, sortOrder, isActive, config }) });
}

export function deletePageSection(tenantId, siteId, pageId, sectionId) {
  if (![tenantId, siteId, pageId, sectionId].every((id) => typeof id === "string" && id)) throw new Error("Branch, website, page, and section IDs are required.");
  return apiFetch(`/tenants/${encodeURIComponent(tenantId)}/sites/${encodeURIComponent(siteId)}/pages/${encodeURIComponent(pageId)}/sections/${encodeURIComponent(sectionId)}`, { method: "DELETE" });
}
