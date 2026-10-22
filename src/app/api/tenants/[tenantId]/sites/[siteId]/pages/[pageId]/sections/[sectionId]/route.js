import { getSession } from "../../../../../../../../../../lib/auth";
import { getActiveTenants } from "../../../../../../../../../../services/tenant.service";
import { deletePageSection, listPageSections, updatePageSection } from "../../../../../../../../../../services/section.service";
import { validateHeroSection } from "../../../../../../../../../../lib/section-create";
import { parseSectionList } from "../../../../../../../../../../lib/section-list";

const json = (data, status = 200) => Response.json(data, { status, headers: { "Cache-Control": "no-store" } });

export async function DELETE(request, { params }) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return json({ error: "Request origin is not allowed." }, 403);
  if (!(await getSession())) return json({ error: "Please sign in again." }, 401);
  const { tenantId, siteId, pageId, sectionId } = await params;
  if (![tenantId, siteId, pageId, sectionId].every((id) => typeof id === "string" && id)) return json({ error: "Branch, website, page, and section IDs are required." }, 400);
  try {
    const tenants = await getActiveTenants();
    if (!tenants.some((tenant) => tenant.id === tenantId)) return json({ error: "You do not have access to this branch." }, 403);
    const response = await listPageSections(tenantId, siteId, pageId);
    if (!response.ok) return json({ error: "Unable to verify the current section. Refresh sections and try again." }, [401, 403, 404, 429].includes(response.status) ? response.status : 502);
    const sections = parseSectionList(await response.json(), pageId);
    if (!sections.some((section) => section.id === sectionId)) return json({ error: "This section was not found in this page. Refresh the list." }, 404);
  } catch (error) {
    return json({ error: "Unable to verify the current section. Refresh sections and try again." }, [401, 403].includes(error.status) ? error.status : 502);
  }
  let response;
  try { response = await deletePageSection(tenantId, siteId, pageId, sectionId); }
  catch { return json({ error: "Unable to confirm deletion. Refresh sections before retrying." }, 502); }
  if (!response.ok) {
    const messages = { 400: "The section deletion was rejected.", 401: "Please sign in again.", 403: "You do not have permission to delete this section.", 404: "This section was not found. Refresh sections.", 409: "This section cannot be deleted in its current state.", 422: "The section deletion was rejected.", 429: "Too many requests. Please try again shortly." };
    return json({ error: messages[response.status] || "Unable to delete the section. Please try again later." }, messages[response.status] ? response.status : 502);
  }
  return json({ success: true });
}
export async function PATCH(request, { params }) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return json({ error: "Request origin is not allowed." }, 403);
  if (!(await getSession())) return json({ error: "Please sign in again." }, 401);
  if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") return json({ error: "Send an application/json request." }, 415);
  const { tenantId, siteId, pageId, sectionId } = await params;
  if (![tenantId, siteId, pageId, sectionId].every((id) => typeof id === "string" && id)) return json({ error: "Branch, website, page, and section IDs are required." }, 400);
  let input;
  try { input = await request.json(); } catch { return json({ error: "Invalid JSON request." }, 400); }
  const { errors, payload } = validateHeroSection(input);
  if (Object.keys(errors).length) return json({ error: "Check the section details.", errors }, 400);
  let existing;
  try {
    const tenants = await getActiveTenants();
    if (!tenants.some((tenant) => tenant.id === tenantId)) return json({ error: "You do not have access to this branch." }, 403);
    const response = await listPageSections(tenantId, siteId, pageId);
    if (!response.ok) return json({ error: "Unable to verify the current section. Refresh sections and try again." }, [401, 403, 404, 429].includes(response.status) ? response.status : 502);
    existing = parseSectionList(await response.json(), pageId).find((section) => section.id === sectionId);
    if (!existing) return json({ error: "This section was not found in this page. Refresh the list." }, 404);
    if (existing.type !== "HERO") return json({ error: "Editing is currently available for Hero sections only." }, 400);
  } catch (error) {
    return json({ error: "Unable to verify the current section. Refresh sections and try again." }, [401, 403].includes(error.status) ? error.status : 502);
  }
  // Send full current config with edited fields overlaid. This preserves fields
  // outside this form with either backend merge or replacement semantics.
  const update = { ...payload, config: { ...existing.config, ...payload.config } };
  let response;
  try { response = await updatePageSection(tenantId, siteId, pageId, sectionId, update); }
  catch { return json({ error: "Unable to confirm the update. Refresh sections before retrying." }, 502); }
  if (!response.ok) {
    const messages = { 400: "The section update was rejected.", 401: "Please sign in again.", 403: "You do not have permission to edit this section.", 404: "This section was not found. Refresh sections.", 409: "The section conflicts with existing content. Refresh sections and try again.", 422: "The section update was rejected.", 429: "Too many requests. Please try again shortly." };
    return json({ error: messages[response.status] || "Unable to update the section. Please try again later." }, messages[response.status] ? response.status : 502);
  }
  return json({ success: true });
}
