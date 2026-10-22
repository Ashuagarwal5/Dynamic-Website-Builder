import { getSession } from "../../../../../../../../../lib/auth";
import { getActiveTenants } from "../../../../../../../../../services/tenant.service";
import { publishTenantPage } from "../../../../../../../../../services/publishing.service";

const json = (data, status = 200) => Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
export async function POST(request, { params }) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return json({ error: "Request origin is not allowed." }, 403);
  if (!(await getSession())) return json({ error: "Please sign in again." }, 401);
  const { tenantId, siteId, pageId } = await params;
  if (![tenantId, siteId, pageId].every((id) => typeof id === "string" && id)) return json({ error: "Branch, website and page IDs are required." }, 400);
  try {
    const tenants = await getActiveTenants();
    if (!tenants.some((tenant) => tenant.id === tenantId)) return json({ error: "You do not have access to this branch." }, 403);
  } catch (error) {
    return json({ error: "Unable to verify branch access. Please try again." }, [401, 403].includes(error.status) ? error.status : 502);
  }
  let response;
  try { response = await publishTenantPage(tenantId, siteId, pageId); }
  catch { return json({ error: "Unable to confirm publication. Refresh pages to check the status before retrying." }, 502); }
  if (!response.ok) {
    const messages = { 400: "The page could not be published in its current state.", 401: "Please sign in again.", 403: "You do not have permission to publish this page.", 404: "This page was not found in this branch.", 409: "Publication conflicts with the current page state. Refresh pages and try again.", 422: "The page is not ready for publication.", 429: "Too many requests. Please try again shortly." };
    return json({ error: messages[response.status] || "Unable to publish the page. Please try again later." }, messages[response.status] ? response.status : 502);
  }
  return json({ success: true });
}
