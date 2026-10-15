import { NextResponse } from "next/server";
import { openSession, SESSION_COOKIE } from "./lib/session-codec";

export function proxy(request) {
  if (openSession(request.cookies.get(SESSION_COOKIE)?.value))
    return NextResponse.next();
  const url = new URL("/login", request.url);
  if (request.nextUrl.pathname.startsWith("/dashboard"))
    url.searchParams.set(
      "returnTo",
      request.nextUrl.pathname + request.nextUrl.search,
    );
  const response = NextResponse.redirect(url);
  response.cookies.delete(SESSION_COOKIE);
  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/builder-preview/:path*"],
};
