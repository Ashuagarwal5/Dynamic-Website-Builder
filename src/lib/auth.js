import "server-only";
import { cookies } from "next/headers";
import { io } from "next/cache";
import { redirect } from "next/navigation";
import { openSession, sealSession, SESSION_COOKIE } from "./session-codec";

export async function getSession() {
  const value = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!value) return null;
  // Session expiry depends on the current time. Partial prefetches can already
  // know the cookie, so explicitly defer this check out of prerendering.
  await io();
  return openSession(value);
}

export async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function writeSession(session) {
  (await cookies()).set(SESSION_COOKIE, sealSession(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(session.expiresAt),
  });
}
