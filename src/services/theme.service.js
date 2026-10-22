import "server-only";

import { apiFetch } from "../lib/api";

export function getSiteTheme(tenantId, siteId) {
  if (![tenantId, siteId].every((id) => typeof id === "string" && id)) throw new Error("Branch and website IDs are required.");
  return apiFetch(`/tenants/${encodeURIComponent(tenantId)}/sites/${encodeURIComponent(siteId)}/theme`, { method: "GET" });
}

export function updateSiteTheme(tenantId, siteId, { primaryColor, secondaryColor, accentColor, fontFamily, borderRadius }) {
  if (![tenantId, siteId].every((id) => typeof id === "string" && id)) throw new Error("Branch and website IDs are required.");
  return apiFetch(`/tenants/${encodeURIComponent(tenantId)}/sites/${encodeURIComponent(siteId)}/theme`, { method: "PATCH", body: JSON.stringify({ primaryColor, secondaryColor, accentColor, fontFamily, borderRadius }) });
}
