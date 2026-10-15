import { getSession } from "../../../../../lib/auth";
import { getActiveTenants } from "../../../../../services/tenant.service";
import { createTenantSite, listTenantSites } from "../../../../../services/website.service";
import { parseSiteList } from "../../../../../lib/site-list";

const json = (body, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request, { params }) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return json({ error: "Request origin is not allowed." }, 403);
  if (!(await getSession())) return json({ error: "Please sign in again." }, 401);
  if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") return json({ error: "Send an application/json request." }, 415);
  const { tenantId } = await params;
  if (!tenantId || typeof tenantId !== "string") return json({ error: "A branch is required." }, 400);
  let input;
  try { input = await request.json(); }
  catch { return json({ error: "Invalid JSON request." }, 400); }
  const name = typeof input?.name === "string" ? input.name.trim() : "";
  const slug = typeof input?.slug === "string" ? input.slug.trim() : "";
  const errors = {};
  if (!name || name.length > 120) errors.name = "Enter a website name of at most 120 characters.";
  if (slug.length < 3 || slug.length > 60 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) errors.slug = "Use 3-60 lowercase letters, numbers, or single hyphens between words.";
  if (Object.keys(errors).length) return json({ error: "Check the website details.", errors }, 400);
  try {
    const tenants = await getActiveTenants();
    if (!tenants.some((tenant) => tenant.id === tenantId)) return json({ error: "You do not have access to this branch." }, 403);
  } catch (error) {
    return json({ error: "Unable to verify branch access. Please try again." }, [401, 403].includes(error.status) ? error.status : 502);
  }
  let response;
  try { response = await createTenantSite(tenantId, { name, slug }); }
  catch { return json({ error: "Unable to confirm creation. Check My Websites before retrying to avoid a duplicate." }, 502); }
  if (!response.ok) {
    const messages = {
      400: "The website details were rejected. Check the name and slug.",
      401: "Please sign in again.", 403: "You do not have permission to create websites in this branch.",
      404: "This branch was not found.", 409: "A website with these details already exists. Try a different slug.",
      422: "The website details were rejected. Check the name and slug.",
      429: "Too many requests. Please try again shortly.",
    };
    return json({ error: messages[response.status] || "Unable to create the website. Please try again later." }, messages[response.status] ? response.status : 502);
  }
  // Creation is complete even if the backend returns no JSON body. The list
  // endpoint supplies authoritative website metadata after navigation.
  return json({ success: true }, 201);
}

export async function GET(request, { params }) {
  if (!(await getSession())) return json({ error: "Please sign in again." }, 401);
  const { tenantId } = await params;
  if (!tenantId || typeof tenantId !== "string") return json({ error: "A branch is required." }, 400);
  try {
    const tenants = await getActiveTenants();
    if (!tenants.some((tenant) => tenant.id === tenantId)) return json({ error: "You do not have access to this branch." }, 403);
    const response = await listTenantSites(tenantId);
    if (!response.ok) {
      const messages = { 401: "Please sign in again.", 403: "You do not have access to this branch.", 404: "This branch was not found.", 429: "Too many requests. Please try again shortly." };
      return json({ error: messages[response.status] || "Unable to load websites. Please try again." }, messages[response.status] ? response.status : 502);
    }
    return json(parseSiteList(await response.json(), tenantId));
  } catch (error) {
    if (error.status === 401 || error.status === 403) return json({ error: "Your branch access could not be verified. Please sign in again." }, error.status);
    return json({ error: "Unable to load websites. Please try again." }, 502);
  }
}
