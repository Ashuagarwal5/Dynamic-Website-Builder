import { getSession } from "../../../../../lib/auth";
import { getTenantMemberships, setTenantStatus } from "../../../../../services/tenant.service";

const json = (data, status = 200) => Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
export async function PATCH(request, { params }) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return json({ error: "Request origin is not allowed." }, 403);
  if (!(await getSession())) return json({ error: "Please sign in again." }, 401);
  if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") return json({ error: "Send an application/json request." }, 415);
  const { tenantId } = await params;
  if (typeof tenantId !== "string" || !tenantId) return json({ error: "A branch is required." }, 400);
  let input;
  try { input = await request.json(); } catch { return json({ error: "Invalid JSON request." }, 400); }
  if (typeof input?.isActive !== "boolean") return json({ error: "isActive must be a boolean." }, 400);
  try {
    const tenants = await getTenantMemberships();
    if (!tenants.some((tenant) => tenant.id === tenantId)) return json({ error: "You do not have access to this branch." }, 403);
  } catch (error) {
    return json({ error: "Unable to verify branch access. Please try again." }, [401, 403].includes(error.status) ? error.status : 502);
  }
  let response;
  try { response = await setTenantStatus(tenantId, input.isActive); }
  catch { return json({ error: "Unable to confirm the status change. Refresh branches before retrying." }, 502); }
  if (!response.ok) {
    const messages = { 400: "The status change was rejected.", 401: "Please sign in again.", 403: "You do not have permission to change this branch's status.", 404: "This branch was not found.", 409: "This branch's status cannot be changed right now.", 422: "The status change was rejected.", 429: "Too many requests. Please try again shortly." };
    return json({ error: messages[response.status] || "Unable to change branch status. Please try again later." }, messages[response.status] ? response.status : 502);
  }
  return json({ success: true });
}
