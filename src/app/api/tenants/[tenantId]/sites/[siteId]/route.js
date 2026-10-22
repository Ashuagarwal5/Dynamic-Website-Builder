import { getSession } from "../../../../../../lib/auth";
import { getActiveTenants } from "../../../../../../services/tenant.service";
import { deleteTenantSite, updateTenantSite } from "../../../../../../services/website.service";
import { validateSiteEdit } from "../../../../../../lib/site-edit";

const json = (data, status = 200) => Response.json(data, { status, headers: { "Cache-Control": "no-store" } });

async function authorize(request, params, { body = false } = {}) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return { failure: json({ error: "Request origin is not allowed." }, 403) };
  if (!(await getSession())) return { failure: json({ error: "Please sign in again." }, 401) };
  if (body && request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") return { failure: json({ error: "Send an application/json request." }, 415) };
  const { tenantId, siteId } = await params;
  if (![tenantId, siteId].every((id) => typeof id === "string" && id)) return { failure: json({ error: "Branch and website IDs are required." }, 400) };
  return { tenantId, siteId };
}

async function checkMembership(tenantId) {
  try {
    const tenants = await getActiveTenants();
    if (!tenants.some((tenant) => tenant.id === tenantId)) return json({ error: "You do not have access to this branch." }, 403);
  } catch (error) {
    return json({ error: "Unable to verify branch access. Please try again." }, [401, 403].includes(error.status) ? error.status : 502);
  }
  return null;
}

export async function PATCH(request, { params }) {
  const auth = await authorize(request, params, { body: true });
  if (auth.failure) return auth.failure;
  let input;
  try { input = await request.json(); } catch { return json({ error: "Invalid JSON request." }, 400); }
  const { errors, changes } = validateSiteEdit(input);
  if (Object.keys(errors).length) return json({ error: errors.form || "Check the website details.", errors }, 400);
  const denied = await checkMembership(auth.tenantId);
  if (denied) return denied;
  let response;
  try { response = await updateTenantSite(auth.tenantId, auth.siteId, changes); }
  catch { return json({ error: "Unable to confirm the update. Refresh websites to check the saved details before retrying." }, 502); }
  if (!response.ok) {
    const messages = { 400: "The website details were rejected. Check them and try again.", 401: "Please sign in again.", 403: "You do not have permission to edit this website.", 404: "This website was not found in this branch.", 409: "These website details are already in use. Try a different slug or subdomain.", 422: "The website details were rejected. Check them and try again.", 429: "Too many requests. Please try again shortly." };
    return json({ error: messages[response.status] || "Unable to update the website. Please try again later." }, messages[response.status] ? response.status : 502);
  }
  return json({ success: true });
}

export async function DELETE(request, { params }) {
  const auth = await authorize(request, params);
  if (auth.failure) return auth.failure;
  const denied = await checkMembership(auth.tenantId);
  if (denied) return denied;
  let response;
  try { response = await deleteTenantSite(auth.tenantId, auth.siteId); }
  catch { return json({ error: "Unable to confirm deletion. Refresh websites to check whether it was deleted before retrying." }, 502); }
  if (!response.ok) {
    const messages = { 400: "The website deletion was rejected.", 401: "Please sign in again.", 403: "You do not have permission to delete this website.", 404: "This website was not found. Refresh the list.", 409: "This website cannot be deleted in its current state. Unpublish it first.", 422: "The website deletion was rejected.", 429: "Too many requests. Please try again shortly." };
    return json({ error: messages[response.status] || "Unable to delete the website. Please try again later." }, messages[response.status] ? response.status : 502);
  }
  return json({ success: true });
}
