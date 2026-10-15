import "server-only";
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

export const SESSION_COOKIE = "site-studio-session";

function key() {
  const secret = process.env.AUTH_SESSION_SECRET;
  if (!secret || secret.length < 32)
    throw new Error("AUTH_SESSION_SECRET must contain at least 32 characters.");
  return createHash("sha256").update(secret).digest();
}

export function sealSession(session) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(session), "utf8"),
    cipher.final(),
  ]);
  const value = Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString(
    "base64url",
  );
  if (value.length > 3800) throw new Error("Session exceeds cookie capacity.");
  return value;
}

export function openSession(value) {
  if (!value) return null;
  try {
    const buffer = Buffer.from(value, "base64url");
    const decipher = createDecipheriv(
      "aes-256-gcm",
      key(),
      buffer.subarray(0, 12),
    );
    decipher.setAuthTag(buffer.subarray(12, 28));
    const session = JSON.parse(
      Buffer.concat([
        decipher.update(buffer.subarray(28)),
        decipher.final(),
      ]).toString("utf8"),
    );
    return session.expiresAt > Date.now() &&
      session.accessToken &&
      session.user?.id
      ? session
      : null;
  } catch {
    return null;
  }
}

export function tokenExpiry(token) {
  // The token is received directly from the trusted authentication API over HTTPS.
  // Decode only to bound the local session lifetime; API calls validate the JWT.
  const payload = JSON.parse(
    Buffer.from(token.split(".")[1], "base64url").toString("utf8"),
  );
  if (!Number.isFinite(payload.exp))
    throw new Error("Access token is missing its expiry.");
  return Math.min(payload.exp * 1000, Date.now() + 24 * 60 * 60 * 1000);
}

export function safeReturnTo(value) {
  return typeof value === "string" &&
    /^\/dashboard(?:\/|\?|$)/.test(value) &&
    !value.includes("\\")
    ? value
    : "/dashboard";
}
