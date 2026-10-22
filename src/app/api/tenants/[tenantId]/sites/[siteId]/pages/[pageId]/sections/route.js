import { getSession } from "../../../../../../../../../lib/auth";
import { getActiveTenants } from "../../../../../../../../../services/tenant.service";
import { createPageSection, listPageSections } from "../../../../../../../../../services/section.service";
import { validateHeroSection } from "../../../../../../../../../lib/section-create";
import { parseSectionList } from "../../../../../../../../../lib/section-list";

const json = (data, status = 200) => Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
export async function POST(request, { params }) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return json({ error: "Request origin is not allowed." }, 403);
  if (!(await getSession())) return json({ error: "Please sign in again." }, 401);
  if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") return json({ error: "Send an application/json request." }, 415);
  const { tenantId, siteId, pageId } = await params;
  if (![tenantId, siteId, pageId].every((id) => typeof id === "string" && id)) return json({ error: "Branch, website, and page IDs are required." }, 400);
  let input;
  try { input = await request.json(); } catch { return json({ error: "Invalid JSON request." }, 400); }
  const { errors, payload } = validateHeroSection(input);
  if (Object.keys(errors).length) return json({ error: "Check the section details.", errors }, 400);
  try {
    const tenants = await getActiveTenants();
    if (!tenants.some((tenant) => tenant.id === tenantId)) return json({ error: "You do not have access to this branch." }, 403);
  } catch (error) {
    return json({ error: "Unable to verify branch access. Please try again." }, [401, 403].includes(error.status) ? error.status : 502);
  }
  let response;
  try { response = await createPageSection(tenantId, siteId, pageId, payload); }
  catch { return json({ error: "Unable to confirm creation. Refresh sections before retrying to avoid a duplicate." }, 502); }
  if (!response.ok) {
    const messages = { 400: "The section details were rejected.", 401: "Please sign in again.", 403: "You do not have permission to add sections to this page.", 404: "This page was not found in this website.", 409: "The section conflicts with existing content. Refresh sections and check its position.", 422: "The section details were rejected.", 429: "Too many requests. Please try again shortly." };
    return json({ error: messages[response.status] || "Unable to create the section. Please try again later." }, messages[response.status] ? response.status : 502);
  }
  return json({ success: true }, 201);
}
export async function GET(request, { params }) {
  if (!(await getSession())) return json({ error: "Please sign in again." }, 401);
  const { tenantId, siteId, pageId } = await params;
  if (![tenantId, siteId, pageId].every((id) => typeof id === "string" && id)) return json({ error: "Branch, website, and page IDs are required." }, 400);
  try {
    const tenants = await getActiveTenants();
    if (!tenants.some((tenant) => tenant.id === tenantId)) return json({ error: "You do not have access to this branch." }, 403);
    const response = await listPageSections(tenantId, siteId, pageId);
    if (!response.ok) {
      const messages = { 401: "Please sign in again.", 403: "You do not have access to this page.", 404: "This page was not found in this website.", 429: "Too many requests. Please try again shortly." };
      return json({ error: messages[response.status] || "Unable to load sections. Please try again." }, messages[response.status] ? response.status : 502);
    }
    return json(parseSectionList(await response.json(), pageId));
  } catch (error) {
    return json({ error: "Unable to load sections. Please try again." }, [401, 403].includes(error.status) ? error.status : 502);
  }
}
