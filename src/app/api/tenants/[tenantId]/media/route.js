import { getSession } from "../../../../../lib/auth";
import { getActiveTenants } from "../../../../../services/tenant.service";
import { uploadTenantMedia } from "../../../../../services/media.service";
import { matchesImageType, publicMediaUrl, validateUploadFile } from "../../../../../lib/media-upload";

const json = (data, status = 200) => Response.json(data, { status, headers: { "Cache-Control": "no-store" } });

// Browser upload endpoint: validates the image, forwards it to the backend and
// returns only the safe fields the editor needs.
export async function POST(request, { params }) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return json({ error: "Request origin is not allowed." }, 403);
  if (!(await getSession())) return json({ error: "Please sign in again." }, 401);
  if (!request.headers.get("content-type")?.startsWith("multipart/form-data")) return json({ error: "Send a multipart/form-data request." }, 415);
  const { tenantId } = await params;
  if (!tenantId || typeof tenantId !== "string") return json({ error: "A branch is required." }, 400);
  let file;
  try { file = (await request.formData()).get("file"); } catch { return json({ error: "Invalid upload request." }, 400); }
  const problem = validateUploadFile(file);
  if (problem) return json({ error: problem }, 400);
  if (!matchesImageType(file.type, new Uint8Array(await file.slice(0, 12).arrayBuffer()))) return json({ error: "The file contents do not match its image type." }, 400);
  try {
    const tenants = await getActiveTenants();
    if (!tenants.some((tenant) => tenant.id === tenantId)) return json({ error: "You do not have access to this branch." }, 403);
  } catch (error) {
    return json({ error: "Unable to verify branch access. Please try again." }, [401, 403].includes(error.status) ? error.status : 502);
  }
  let response;
  try { response = await uploadTenantMedia(tenantId, file); }
  catch { return json({ error: "Unable to upload the image. Please try again." }, 502); }
  if (!response.ok) {
    const messages = { 400: "The image was rejected by the server.", 401: "Please sign in again.", 403: "You do not have permission to upload images.", 404: "This branch was not found.", 413: "The image is too large.", 415: "This image type is not supported.", 422: "The image was rejected by the server.", 429: "Too many requests. Please try again shortly." };
    return json({ error: messages[response.status] || "Unable to upload the image. Please try again later." }, messages[response.status] ? response.status : 502);
  }
  let data;
  try { data = await response.json(); } catch { /* Reported below. */ }
  const url = typeof data?.url === "string" ? publicMediaUrl(data.url, process.env.BASEURL || "") : "";
  if (!url) return json({ error: "The server did not return an image URL." }, 502);
  return json({
    url,
    ...(typeof data.id === "string" ? { id: data.id } : {}),
    ...(typeof data.originalName === "string" ? { originalName: data.originalName } : {}),
    ...(Number.isFinite(data.size) ? { size: data.size } : {}),
  }, 201);
}
