import { getSession } from "../../../../../../../lib/auth";
import { getActiveTenants } from "../../../../../../../services/tenant.service";
import { getSiteTheme, updateSiteTheme } from "../../../../../../../services/theme.service";
import { parseSiteTheme, validateThemeInput } from "../../../../../../../lib/site-theme";

const json = (data, status = 200) => Response.json(data, { status, headers: { "Cache-Control": "no-store" } });

export async function PATCH(request, { params }) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return json({ error: "Request origin is not allowed." }, 403);
  if (!(await getSession())) return json({ error: "Please sign in again." }, 401);
  if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") return json({ error: "Send an application/json request." }, 415);
  const { tenantId, siteId } = await params;
  if (![tenantId, siteId].every((id) => typeof id === "string" && id)) return json({ error: "Branch and website IDs are required." }, 400);
  let input;
  try { input = await request.json(); } catch { return json({ error: "Invalid JSON request." }, 400); }
  const { errors, payload } = validateThemeInput(input);
  if (Object.keys(errors).length) return json({ error: "Check the theme details.", errors }, 400);
  try {
    const tenants = await getActiveTenants();
    if (!tenants.some((tenant) => tenant.id === tenantId)) return json({ error: "You do not have access to this branch." }, 403);
  } catch (error) {
    return json({ error: "Unable to verify branch access. Please try again." }, [401, 403].includes(error.status) ? error.status : 502);
  }
  let response;
  try { response = await updateSiteTheme(tenantId, siteId, payload); }
  catch { return json({ error: "Unable to confirm the update. Refresh the theme before retrying." }, 502); }
  if (!response.ok) {
    const messages = { 400: "The theme update was rejected. Check its values.", 401: "Please sign in again.", 403: "You do not have permission to edit this theme.", 404: "This website was not found in this branch.", 409: "The theme cannot be updated in its current state.", 422: "The theme update was rejected. Check its values.", 429: "Too many requests. Please try again shortly." };
    return json({ error: messages[response.status] || "Unable to update the theme. Please try again later." }, messages[response.status] ? response.status : 502);
  }
  return json({ success: true });
}
export async function GET(request, { params }) {
  if (!(await getSession())) return json({ error: "Please sign in again." }, 401);
  const { tenantId, siteId } = await params;
  if (![tenantId, siteId].every((id) => typeof id === "string" && id)) return json({ error: "Branch and website IDs are required." }, 400);
  try {
    const tenants = await getActiveTenants();
    if (!tenants.some((tenant) => tenant.id === tenantId)) return json({ error: "You do not have access to this branch." }, 403);
    const response = await getSiteTheme(tenantId, siteId);
    if (!response.ok) {
      // Server-side diagnostics only; the browser still gets a generic message.
      console.error(`[theme GET] backend responded ${response.status}:`, (await response.text().catch(() => "")).slice(0, 300));
      const messages = { 401: "Please sign in again.", 403: "You do not have access to this website theme.", 404: "The website or its theme was not found in this branch.", 429: "Too many requests. Please try again shortly." };
      return json({ error: messages[response.status] || "Unable to load the theme. Please try again." }, messages[response.status] ? response.status : 502);
    }
    // The backend answers 200 with an empty body when a site has no theme yet.
    const raw = await response.text();
    const body = raw.trim() ? JSON.parse(raw) : null;
    try { return json(parseSiteTheme(body, siteId)); }
    catch (parseError) {
      console.error("[theme GET] unexpected backend response:", parseError.message, JSON.stringify(body).slice(0, 300));
      throw parseError;
    }
  } catch (error) {
    if (!error.status) console.error("[theme GET] failed:", error.message);
    return json({ error: "Unable to load the theme. Please try again." }, [401, 403].includes(error.status) ? error.status : 502);
  }
}
