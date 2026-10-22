// Shared by the upload route and the browser. Limits are ours: the backend
// documents none. Keep them conservative and let the backend reject more.
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const UPLOAD_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function validateUploadFile(file) {
  if (!file || typeof file.size !== "number" || !UPLOAD_TYPES.includes(file.type)) return "Choose a JPEG, PNG or WebP image.";
  if (file.size === 0 || file.size > MAX_UPLOAD_BYTES) return "Choose an image between 1 byte and 5 MB.";
  return "";
}

// True when the first bytes match the declared image type.
export function matchesImageType(type, bytes) {
  const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const png = [137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value);
  const webp = String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  return (type === "image/jpeg" && jpeg) || (type === "image/png" && png) || (type === "image/webp" && webp);
}

// The backend can return URLs built from its own local address (for example
// http://localhost:4000/uploads/...), which visitors cannot reach. Files served
// by our backend under /uploads are saved as same-origin paths (/uploads/...),
// which next.config.mjs forwards to the backend. Other hosts (a CDN or object
// storage) keep their absolute URL.
const localHosts = ["localhost", "127.0.0.1", "[::1]"];
export function publicMediaUrl(value, backendBase) {
  let url;
  try { url = new URL(value); } catch { return ""; }
  if (!["http:", "https:"].includes(url.protocol)) return "";
  let backendHost = "";
  try { backendHost = new URL(backendBase).hostname; } catch { /* No backend configured. */ }
  const ours = localHosts.includes(url.hostname) || (backendHost && url.hostname === backendHost);
  if (ours && backendHost && url.pathname.startsWith("/uploads/")) return `${url.pathname}${url.search}`;
  return url.href;
}
