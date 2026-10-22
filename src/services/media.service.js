import "server-only";
import { apiFetch } from "../lib/api";

// POST /tenants/{tenantId}/media/upload takes multipart/form-data with one
// `file` field. The Response is returned unchanged for the caller to parse.
export function uploadTenantMedia(tenantId, file) {
  if (typeof tenantId !== "string" || !tenantId) throw new Error("A tenant ID is required.");
  const body = new FormData();
  body.append("file", file, file.name || "upload");
  return apiFetch(`/tenants/${encodeURIComponent(tenantId)}/media/upload`, { method: "POST", body });
}
