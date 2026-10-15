import { getSession } from "../../../../../../../lib/auth";
import { getActiveTenants } from "../../../../../../../services/tenant.service";
import { createSitePage, listSitePages } from "../../../../../../../services/page.service";
import { parsePageList } from "../../../../../../../lib/page-list";

const json = (data, status = 200) => Response.json(data, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request, { params }) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return json({ error: "Request origin is not allowed." }, 403);
  if (!(await getSession())) return json({ error: "Please sign in again." }, 401);
  if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") return json({ error: "Send an application/json request." }, 415);
  const { tenantId, siteId } = await params;
  if (typeof tenantId !== "string" || !tenantId || typeof siteId !== "string" || !siteId) return json({ error: "Branch and website IDs are required." }, 400);
  let input;
  try { input = await request.json(); }
  catch { return json({ error: "Invalid JSON request." }, 400); }
  const name = typeof input?.name === "string" ? input.name.trim() : "";
  const slug = typeof input?.slug === "string" ? input.slug.trim() : "";
  const errors = {};
  if (!name || name.length > 120) errors.name = "Enter a page name of at most 120 characters.";
  if (slug.length < 3 || slug.length > 60 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) errors.slug = "Use 3-60 lowercase letters, numbers, or single hyphens between words.";
  if (Object.keys(errors).length) return json({ error: "Check the page details.", errors }, 400);
  try {
    const tenants = await getActiveTenants();
    if (!tenants.some((tenant) => tenant.id === tenantId)) return json({ error: "You do not have access to this branch." }, 403);
  } catch (error) {
    return json({ error: "Unable to verify branch access. Please try again." }, [401, 403].includes(error.status) ? error.status : 502);
  }
  let response;
  try { response = await createSitePage(tenantId, siteId, { name, slug }); }
  catch { return json({ error: "Unable to confirm creation. Check the page list before retrying to avoid a duplicate." }, 502); }
  if (!response.ok) {
    const messages = {
      400: "The page details were rejected. Check the name and slug.",
      401: "Please sign in again.", 403: "You do not have permission to create pages in this website.",
      404: "This website was not found in this branch.", 409: "A page with these details already exists. Try a different slug.",
      422: "The page details were rejected. Check the name and slug.", 429: "Too many requests. Please try again shortly.",
    };
    return json({ error: messages[response.status] || "Unable to create the page. Please try again later." }, messages[response.status] ? response.status : 502);
  }
  return json({ success: true }, 201);
}
export async function GET(request, { params }) {
  if (!(await getSession())) return json({ error: "Please sign in again." }, 401);
  const { tenantId, siteId } = await params;
  if (typeof tenantId !== "string" || !tenantId || typeof siteId !== "string" || !siteId) return json({ error: "Branch and website IDs are required." }, 400);
  try {
    const tenants = await getActiveTenants();
    if (!tenants.some((tenant) => tenant.id === tenantId)) return json({ error: "You do not have access to this branch." }, 403);
    const response = await listSitePages(tenantId, siteId);
    if (!response.ok) {
      const messages = { 401: "Please sign in again.", 403: "You do not have access to this website.", 404: "This website was not found in this branch.", 429: "Too many requests. Please try again shortly." };
      return json({ error: messages[response.status] || "Unable to load pages. Please try again." }, messages[response.status] ? response.status : 502);
    }
    return json(parsePageList(await response.json(), siteId));
  } catch (error) {
    return json({ error: "Unable to load pages. Please try again." }, [401, 403].includes(error.status) ? error.status : 502);
  }
}
