import "server-only";
import { getSession } from "./auth";

export async function apiFetch(
  path,
  { authenticated = true, ...options } = {},
) {
  const base = process.env.BASEURL;
  if (!base) throw new Error("BASEURL is not configured.");
  if (!path.startsWith("/") || path.startsWith("//"))
    throw new Error("Use a relative API path.");
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  // Existing JSON requests keep their format. Let fetch supply multipart
  // boundaries for FormData uploads, and preserve explicit content types.
  if (typeof options.body === "string" && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (authenticated) {
    const session = await getSession();
    if (!session) return new Response(null, { status: 401 });
    headers.set("Authorization", `Bearer ${session.accessToken}`);
  }
  return fetch(`${base.replace(/\/$/, "")}${path}`, {
    ...options,
    headers,
    cache: "no-store",
    signal: options.signal ?? AbortSignal.timeout(15000),
  });
}
