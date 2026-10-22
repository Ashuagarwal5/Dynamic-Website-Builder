import { getSession } from "../../../../../../../../../lib/auth";
import { getActiveTenants } from "../../../../../../../../../services/tenant.service";
import { createPageSection, deletePageSection, updatePageSection } from "../../../../../../../../../services/section.service";
import { updateSiteTheme } from "../../../../../../../../../services/theme.service";
import { validateBackendSection } from "../../../../../../../../../lib/section-config";
import { validateThemeInput } from "../../../../../../../../../lib/site-theme";

const json = (data, status = 200) => Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
const failure = (error, status = 502, extra = {}) => json({ error, ...extra }, status);

// Saves the editor in one request: deletions, then ordered create/update of
// sections (sortOrder is the array index), then the theme. Work stops at the
// first failure and reports what was already saved; callers reload to see it.
export async function POST(request, { params }) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return json({ error: "Request origin is not allowed." }, 403);
  if (!(await getSession())) return json({ error: "Please sign in again." }, 401);
  if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") return json({ error: "Send an application/json request." }, 415);
  const { tenantId, siteId, pageId } = await params;
  if (![tenantId, siteId, pageId].every((id) => typeof id === "string" && id)) return json({ error: "Branch, website, and page IDs are required." }, 400);
  let input;
  try { input = await request.json(); } catch { return json({ error: "Invalid JSON request." }, 400); }
  const sections = input?.sections;
  const deleted = input?.deleted ?? [];
  if (!Array.isArray(sections) || sections.length > 100 || !Array.isArray(deleted) || deleted.length > 100 || !deleted.every((id) => typeof id === "string" && id)) return json({ error: "Check the website content." }, 400);
  const bad = sections.findIndex((section) => !validateBackendSection(section) || (section.backendId !== undefined && (typeof section.backendId !== "string" || !section.backendId)));
  if (bad >= 0) return json({ error: `Check section ${bad + 1}: its content is not valid.` }, 400);
  let theme = null;
  if (input.theme !== undefined && input.theme !== null) {
    const checked = validateThemeInput(input.theme);
    if (Object.keys(checked.errors).length) return json({ error: "Check the theme details.", errors: checked.errors }, 400);
    theme = checked.payload;
  }
  try {
    const tenants = await getActiveTenants();
    if (!tenants.some((tenant) => tenant.id === tenantId)) return json({ error: "You do not have access to this branch." }, 403);
  } catch (error) {
    return json({ error: "Unable to verify branch access. Please try again." }, [401, 403].includes(error.status) ? error.status : 502);
  }
  const saved = { deleted: 0, sections: 0, theme: false };
  const stop = (response, what) => {
    const messages = { 400: "was rejected", 401: "needs you to sign in again", 403: "is not allowed", 404: "was not found", 409: "conflicts with existing content", 422: "was rejected", 429: "was rate limited" };
    return failure(`Saving stopped: ${what} ${messages[response.status] || "could not be saved"}. Your earlier changes were saved; reload to check, then try again.`, [401, 403, 404, 409, 429].includes(response.status) ? response.status : 502, { saved });
  };
  for (const id of deleted) {
    let response;
    try { response = await deletePageSection(tenantId, siteId, pageId, id); }
    catch { return failure("Saving stopped: a removed section could not be deleted. Reload to check what was saved, then try again.", 502, { saved }); }
    if (!response.ok && response.status !== 404) return stop(response, "a removed section");
    saved.deleted++;
  }
  for (const [index, section] of sections.entries()) {
    if (section.dirty === false) continue;
    const payload = { type: section.type, sortOrder: index, isActive: section.isActive, config: section.config };
    let response;
    try { response = section.backendId ? await updatePageSection(tenantId, siteId, pageId, section.backendId, payload) : await createPageSection(tenantId, siteId, pageId, payload); }
    catch { return failure(`Saving stopped at section ${index + 1}. Reload to check what was saved, then try again.`, 502, { saved }); }
    if (!response.ok) return stop(response, `section ${index + 1}`);
    saved.sections++;
  }
  if (theme) {
    let response;
    try { response = await updateSiteTheme(tenantId, siteId, theme); }
    catch { return failure("Sections were saved, but the theme could not be confirmed. Reload to check it.", 502, { saved }); }
    if (!response.ok) return stop(response, "the theme");
    saved.theme = true;
  }
  return json({ success: true, saved });
}
