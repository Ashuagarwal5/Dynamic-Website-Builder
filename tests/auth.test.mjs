import { test } from "node:test";
import assert from "node:assert/strict";
import "./helpers/server-only.mjs";
const { openSession, sealSession, tokenExpiry, safeReturnTo } =
  await import("../src/lib/session-codec.js");

process.env.AUTH_SESSION_SECRET =
  "test-secret-with-at-least-thirty-two-characters";
const session = {
  accessToken: "private-token",
  user: { id: "user-1" },
  tenants: [],
  expiresAt: Date.now() + 60000,
};

test("encrypted session round trips without exposing the token", () => {
  const cookie = sealSession(session);
  assert.deepEqual(openSession(cookie), session);
  assert.ok(!cookie.includes(session.accessToken));
});
test("tampered, malformed, expired, and differently keyed cookies are rejected", () => {
  const cookie = sealSession(session);
  assert.equal(openSession(`x${cookie.slice(1)}`), null);
  assert.equal(openSession("invalid"), null);
  assert.equal(openSession(sealSession({ ...session, expiresAt: 1 })), null);
  const secret = process.env.AUTH_SESSION_SECRET;
  process.env.AUTH_SESSION_SECRET =
    "another-secret-with-at-least-thirty-two-characters";
  assert.equal(openSession(cookie), null);
  process.env.AUTH_SESSION_SECRET = secret;
});
test("token lifetime is bounded and missing expiry is rejected", () => {
  const exp = Math.floor(Date.now() / 1000) + 60;
  const token = `header.${Buffer.from(JSON.stringify({ exp })).toString("base64url")}.signature`;
  assert.equal(tokenExpiry(token), exp * 1000);
  assert.throws(() => tokenExpiry("invalid"));
});
test("return destinations stay within the dashboard", () => {
  assert.equal(
    safeReturnTo("/dashboard/websites?q=test"),
    "/dashboard/websites?q=test",
  );
  for (const value of [
    "https://example.com",
    "//example.com",
    "/dashboard\\evil",
    "/dashboard-other",
    null,
  ])
    assert.equal(safeReturnTo(value), "/dashboard");
});
