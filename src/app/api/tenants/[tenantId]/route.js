import { getSession } from "../../../../lib/auth";
import { deleteTenant, getTenantMemberships, getActiveTenants, updateTenant } from "../../../../services/tenant.service";

const json = (data, status = 200) => Response.json(data, { status, headers: { "Cache-Control": "no-store" } });

export async function DELETE(request, { params }) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return json({ error: "Request origin is not allowed." }, 403);
  if (!(await getSession())) return json({ error: "Please sign in again." }, 401);
  const { tenantId } = await params;
  if (typeof tenantId !== "string" || !tenantId) return json({ error: "A branch is required." }, 400);
  try {
    const tenants = await getTenantMemberships();
    if (!tenants.some((tenant) => tenant.id === tenantId)) return json({ error: "You do not have access to this branch." }, 403);
  } catch (error) {
    return json({ error: "Unable to verify branch access. Please try again." }, [401, 403].includes(error.status) ? error.status : 502);
  }
  let response;
  try { response = await deleteTenant(tenantId); }
  catch { return json({ error: "Unable to confirm deletion. Refresh branches to check whether it was deleted before retrying." }, 502); }
  if (!response.ok) {
    const messages = { 400: "The branch deletion was rejected.", 401: "Please sign in again.", 403: "You do not have permission to delete this branch.", 404: "This branch was not found. Refresh the list.", 409: "This branch cannot be deleted in its current state.", 422: "The branch deletion was rejected.", 429: "Too many requests. Please try again shortly." };
    return json({ error: messages[response.status] || "Unable to delete the branch. Please try again later." }, messages[response.status] ? response.status : 502);
  }
  return json({ success: true });
}
export async function PATCH(request, { params }) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return json({ error: "Request origin is not allowed." }, 403);
  if (!(await getSession())) return json({ error: "Please sign in again." }, 401);
  if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") return json({ error: "Send an application/json request." }, 415);
  const { tenantId } = await params;
  if (typeof tenantId !== "string" || !tenantId) return json({ error: "A branch is required." }, 400);
  let input;
  try { input = await request.json(); } catch { return json({ error: "Invalid JSON request." }, 400); }
  const name = typeof input?.name === "string" ? input.name.trim() : "";
  const slug = typeof input?.slug === "string" ? input.slug.trim() : "";
  const errors = {};
  if (!name || name.length > 120) errors.name = "Enter a branch name of at most 120 characters.";
  if (slug.length < 3 || slug.length > 60 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) errors.slug = "Use 3-60 lowercase letters, numbers, or single hyphens between words.";
  if (Object.keys(errors).length) return json({ error: "Check the branch details.", errors }, 400);
  try {
    const tenants = await getActiveTenants();
    if (!tenants.some((tenant) => tenant.id === tenantId)) return json({ error: "You do not have access to this branch." }, 403);
  } catch (error) {
    return json({ error: "Unable to verify branch access. Please try again." }, [401, 403].includes(error.status) ? error.status : 502);
  }
  let response;
  try { response = await updateTenant(tenantId, { name, slug }); }
  catch { return json({ error: "Unable to confirm the update. Refresh branches to check the saved details before retrying." }, 502); }
  if (!response.ok) {
    const messages = { 400: "The branch details were rejected. Check the name and slug.", 401: "Please sign in again.", 403: "You do not have permission to edit this branch.", 404: "This branch was not found.", 409: "These branch details are already in use. Try a different slug.", 422: "The branch details were rejected. Check the name and slug.", 429: "Too many requests. Please try again shortly." };
    return json({ error: messages[response.status] || "Unable to update the branch. Please try again later." }, messages[response.status] ? response.status : 502);
  }
  return json({ success: true });
}
