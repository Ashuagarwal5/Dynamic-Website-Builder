import { getSession } from "../../../lib/auth";
import { createTenant } from "../../../services/tenant.service";

const json = (data, status) =>
  Response.json(data, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    return json({ error: "Request origin is not allowed." }, 403);
  if (!(await getSession()))
    return json({ error: "Please sign in again." }, 401);
  if (
    request.headers.get("content-type")?.split(";")[0].trim() !==
    "application/json"
  )
    return json({ error: "Send an application/json request." }, 415);
  let input;
  try {
    input = await request.json();
  } catch {
    return json({ error: "Invalid JSON request." }, 400);
  }
  const name = typeof input?.name === "string" ? input.name.trim() : "";
  const slug = typeof input?.slug === "string" ? input.slug.trim() : "";
  const errors = {};
  if (!name || name.length > 120)
    errors.name = "Enter a branch name of at most 120 characters.";
  if (
    slug.length < 3 ||
    slug.length > 60 ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
  )
    errors.slug =
      "Use 3-60 lowercase letters, numbers, or single hyphens between words.";
  if (Object.keys(errors).length)
    return json({ error: "Check the branch details.", errors }, 400);
  let response;
  try {
    response = await createTenant({ name, slug });
  } catch {
    return json(
      {
        error:
          "Unable to confirm creation. Check the Branches page before retrying to avoid a duplicate.",
      },
      502,
    );
  }
  if (!response.ok) {
    const messages = {
      400: "The branch details were rejected. Check the name and slug.",
      401: "Your session was rejected. Please sign in again.",
      403: "You do not have permission to create a branch.",
      409: "A branch with these details already exists. Try a different slug.",
      422: "The branch details were rejected. Check the name and slug.",
      429: "Too many requests. Please wait before trying again.",
    };
    return json(
      {
        error:
          messages[response.status] ||
          "Unable to create the branch. Please try again later.",
      },
      messages[response.status] ? response.status : 502,
    );
  }
  // Only return known safe fields; an empty success body still means created.
  let data;
  try {
    data = await response.json();
  } catch {
    /* Creation already succeeded. */
  }
  const tenant = {};
  for (const key of ["id", "name", "slug"])
    if (typeof data?.[key] === "string") tenant[key] = data[key];
  return json(
    { success: true, ...(Object.keys(tenant).length ? { tenant } : {}) },
    201,
  );
}
