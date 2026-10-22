import { getSession } from "../../../../../../lib/auth";
import { getActiveTenants } from "../../../../../../services/tenant.service";
import { createTenantSite, listTenantSites } from "../../../../../../services/website.service";
import { createSitePage, listSitePages } from "../../../../../../services/page.service";
import { createPageSection } from "../../../../../../services/section.service";
import { updateSiteTheme } from "../../../../../../services/theme.service";
import { parseSiteList } from "../../../../../../lib/site-list";
import { parsePageList } from "../../../../../../lib/page-list";
import { TEMPLATE_ID, buildTemplateSections, defaultTheme } from "../../../../../../lib/section-config";

const json = (data, status = 200) => Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

async function readId(response) {
  try { const data = await response.json(); return typeof data?.id === "string" ? data.id : null; } catch { return null; }
}

// Creates a website from the template: site, Home page, template sections and
// theme. The site is created first; later steps report warnings instead of
// failing, so the user can still open the editor and finish setup there.
export async function POST(request, { params }) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return json({ error: "Request origin is not allowed." }, 403);
  if (!(await getSession())) return json({ error: "Please sign in again." }, 401);
  if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") return json({ error: "Send an application/json request." }, 415);
  const { tenantId } = await params;
  if (!tenantId || typeof tenantId !== "string") return json({ error: "A branch is required." }, 400);
  let input;
  try { input = await request.json(); } catch { return json({ error: "Invalid JSON request." }, 400); }
  const name = typeof input?.name === "string" ? input.name.trim() : "";
  const slug = typeof input?.slug === "string" ? input.slug.trim() : "";
  const errors = {};
  if (!name || name.length > 120) errors.name = "Enter a website name of at most 120 characters.";
  if (slug.length < 3 || slug.length > 60 || !slugPattern.test(slug)) errors.slug = "Use 3-60 lowercase letters, numbers, or single hyphens between words.";
  if (input?.templateId !== TEMPLATE_ID) errors.templateId = "Choose an available template.";
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
    const messages = { 400: "The website details were rejected. Check the name and slug.", 401: "Please sign in again.", 403: "You do not have permission to create websites in this branch.", 404: "This branch was not found.", 409: "A website with these details already exists. Try a different slug.", 422: "The website details were rejected. Check the name and slug.", 429: "Too many requests. Please try again shortly." };
    return json({ error: messages[response.status] || "Unable to create the website. Please try again later." }, messages[response.status] ? response.status : 502);
  }
  const warnings = [];
  let siteId = await readId(response);
  try {
    if (!siteId) {
      const list = await listTenantSites(tenantId);
      if (list.ok) siteId = parseSiteList(await list.json(), tenantId).find((site) => site.slug === slug)?.id || null;
    }
  } catch { /* Handled below. */ }
  if (!siteId) return json({ success: true, siteId: null, pageId: null, warnings: ["The website was created, but it could not be opened automatically. Open it from My Websites."] }, 201);
  let pageId = null;
  try {
    const created = await createSitePage(tenantId, siteId, { name: "Home", slug: "home" });
    if (!created.ok) warnings.push("The Home page could not be created.");
    else {
      pageId = await readId(created);
      if (!pageId) {
        const list = await listSitePages(tenantId, siteId);
        if (list.ok) pageId = parsePageList(await list.json(), siteId).find((page) => page.slug === "home")?.id || null;
      }
    }
  } catch { warnings.push("The Home page could not be created."); }
  if (pageId) {
    let failed = 0;
    for (const section of buildTemplateSections(name)) {
      try { if (!(await createPageSection(tenantId, siteId, pageId, section)).ok) failed++; } catch { failed++; }
    }
    if (failed) warnings.push(`${failed} template section${failed === 1 ? "" : "s"} could not be added.`);
  } else if (!warnings.length) warnings.push("The template sections could not be added.");
  try { if (!(await updateSiteTheme(tenantId, siteId, defaultTheme)).ok) warnings.push("The default theme could not be saved."); }
  catch { warnings.push("The default theme could not be saved."); }
  return json({ success: true, siteId, pageId, warnings }, 201);
}
