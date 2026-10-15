"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { loginUser } from "../../services/auth.service";
import { writeSession } from "../../lib/auth";
import {
  safeReturnTo,
  SESSION_COOKIE,
  tokenExpiry,
} from "../../lib/session-codec";

export async function login(previousState, formData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    !password ||
    email.length > 254 ||
    password.length > 1024
  ) {
    return { error: "Enter a valid email address and password." };
  }
  try {
    const response = await loginUser({ email, password });
    if (!response.ok) {
      return {
        error:
          response.status === 401 || response.status === 403
            ? "Email or password is incorrect."
            : response.status === 429
              ? "Too many attempts. Please try again shortly."
              : "Unable to sign in. Please try again.",
      };
    }
    const data = await response.json();
    if (
      typeof data.accessToken !== "string" ||
      !data.user?.id ||
      !data.user?.email ||
      !Array.isArray(data.tenants)
    ) {
      return { error: "The login service returned an unexpected response." };
    }
    const expiresAt = tokenExpiry(data.accessToken);
    if (expiresAt <= Date.now())
      return {
        error: "The login service returned an expired token. Please try again.",
      };
    const session = {
      accessToken: data.accessToken,
      user: { id: data.user.id, name: data.user.name, email: data.user.email },
      tenants: data.tenants.map(({ id, name, slug, role }) => ({
        id,
        name,
        slug,
        role,
      })),
      expiresAt,
    };
    await writeSession(session);
  } catch {
    return {
      error:
        "Unable to connect to the login service. Please try again shortly.",
    };
  }
  redirect(safeReturnTo(formData.get("returnTo")));
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}
