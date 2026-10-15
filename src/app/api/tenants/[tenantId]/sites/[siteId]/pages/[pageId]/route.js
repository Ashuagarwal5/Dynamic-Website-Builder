import { getSession } from "../../../../../../../../lib/auth";
import { getActiveTenants } from "../../../../../../../../services/tenant.service";
import { getSitePage } from "../../../../../../../../services/page.service";
import { parsePageDetails } from "../../../../../../../../lib/page-list";

const json = (data, status = 200) => Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
export async function GET(request, { params }) {
  if (!(await getSession())) return json({ error: "Please sign in again." }, 401);
  const { tenantId, siteId, pageId } = await params;
  if (![tenantId, siteId, pageId].every((id) => typeof id === "string" && id)) return json({ error: "Branch, website, and page IDs are required." }, 400);
  try {
    const tenants = await getActiveTenants();
    if (!tenants.some((tenant) => tenant.id === tenantId)) return json({ error: "You do not have access to this branch." }, 403);
    const response = await getSitePage(tenantId, siteId, pageId);
    if (!response.ok) {
      const messages = { 401: "Please sign in again.", 403: "You do not have access to this page.", 404: "This page was not found in this website.", 429: "Too many requests. Please try again shortly." };
      return json({ error: messages[response.status] || "Unable to load page details. Please try again." }, messages[response.status] ? response.status : 502);
    }
    return json(parsePageDetails(await response.json(), siteId, pageId));
  } catch (error) {
    return json({ error: "Unable to load page details. Please try again." }, [401, 403].includes(error.status) ? error.status : 502);
  }
}
