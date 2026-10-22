"use server";

import { redirect } from "next/navigation";
import { loginUser, registerUser } from "../../services/auth.service";
import { writeSession } from "../../lib/auth";
import { sessionFromAuthResponse } from "../../lib/login-session";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export async function register(previousState, formData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const tenantName = String(formData.get("tenantName") ?? "").trim();
  const tenantSlug = String(formData.get("tenantSlug") ?? "").trim();
  if (!name || name.length > 120) return { error: "Enter your name (up to 120 characters)." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254)
    return { error: "Enter a valid email address." };
  if (password.length < 8 || password.length > 1024)
    return { error: "Use a password of at least 8 characters." };
  if ((tenantName && !tenantSlug) || (!tenantName && tenantSlug))
    return { error: "Enter both a branch name and slug, or leave both empty." };
  if (tenantName.length > 120) return { error: "Branch name must be at most 120 characters." };
  if (tenantSlug && (tenantSlug.length < 3 || tenantSlug.length > 60 || !slugPattern.test(tenantSlug)))
    return { error: "Use 3-60 lowercase letters, numbers, or single hyphens for the branch slug." };
  let session = null;
  try {
    const response = await registerUser({ name, email, password, tenantName, tenantSlug });
    if (!response.ok) {
      return {
        error:
          response.status === 409
            ? "An account or branch with these details already exists."
            : response.status === 400 || response.status === 422
              ? "The registration details were rejected. Check them and try again."
              : response.status === 429
                ? "Too many attempts. Please try again shortly."
                : "Unable to create the account. Please try again.",
      };
    }
    // The register response shape is undocumented; use it if it is a login
    // response, otherwise sign in with the credentials just registered.
    try {
      session = sessionFromAuthResponse(await response.json());
    } catch {
      /* Account already created; sign in below. */
    }
    if (!session) {
      const loginResponse = await loginUser({ email, password });
      if (loginResponse.ok) session = sessionFromAuthResponse(await loginResponse.json());
    }
    if (session && session.expiresAt > Date.now()) await writeSession(session);
    else session = null;
  } catch {
    return { error: "Unable to connect to the service. Please try again shortly." };
  }
  redirect(session ? "/dashboard" : "/login");
}
