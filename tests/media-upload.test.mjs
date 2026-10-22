import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import "./helpers/server-only.mjs";

const url = (path) => new URL(path, import.meta.url).href;
const service = url("../src/services/media.service.js");
const route = url("../src/app/api/tenants/[tenantId]/media/route.js");
registerHooks({
  resolve(specifier, context, nextResolve) {
    const parent = decodeURI(context.parentURL || "");
    if (context.parentURL === service && specifier === "../lib/api")
      return { url: "data:text/javascript,export async function apiFetch(...args) { return globalThis.mediaFetch(...args); }", shortCircuit: true };
    if (parent === decodeURI(route)) {
      if (specifier.endsWith("/lib/auth")) return { url: "data:text/javascript,export async function getSession() { return globalThis.mediaSession; }", shortCircuit: true };
      if (specifier.endsWith("/services/tenant.service")) return { url: "data:text/javascript,export async function getActiveTenants() { return globalThis.mediaTenants; }", shortCircuit: true };
      if (specifier.endsWith("/services/media.service")) return { url: service, shortCircuit: true };
    }
    if (specifier.startsWith(".") && !/\.[a-z]+$/.test(specifier) && parent.includes("/src/")) {
      const resolved = new URL(`${specifier}.js`, context.parentURL);
      if (existsSync(fileURLToPath(resolved))) return { url: resolved.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});
const { uploadTenantMedia } = await import(service);
const { POST } = await import(route);
const { matchesImageType, publicMediaUrl, validateUploadFile } = await import("../src/lib/media-upload.js");

const originalBase = process.env.BASEURL;
afterEach(() => {
  for (const key of ["mediaFetch", "mediaSession", "mediaTenants"]) delete globalThis[key];
  if (originalBase === undefined) delete process.env.BASEURL;
  else process.env.BASEURL = originalBase;
});
const png = () => new File([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0])], "a.png", { type: "image/png" });
const upload = (file, origin = "http://localhost") => {
  const form = new FormData();
  if (file) form.append("file", file);
  return POST(new Request("http://localhost/x", { method: "POST", headers: { Origin: origin }, body: form }), { params: Promise.resolve({ tenantId: "t" }) });
};
const authorize = () => { globalThis.mediaSession = {}; globalThis.mediaTenants = [{ id: "t" }]; };

test("upload service posts one multipart file to the encoded endpoint", async () => {
  globalThis.mediaFetch = async (path, options) => {
    assert.equal(path, "/tenants/t%2F1/media/upload");
    assert.equal(options.method, "POST");
    assert.ok(options.body instanceof FormData);
    assert.equal(options.body.get("file").name, "a.png");
    return new Response("{}", { status: 201 });
  };
  await uploadTenantMedia("t/1", png());
  assert.throws(() => uploadTenantMedia("", png()), /tenant ID is required/);
});

test("file validation checks type, size and magic bytes", () => {
  assert.equal(validateUploadFile(png()), "");
  assert.ok(validateUploadFile(new File(["x"], "a.gif", { type: "image/gif" })));
  assert.ok(validateUploadFile(new File([], "a.png", { type: "image/png" })));
  assert.ok(validateUploadFile({ type: "image/png", size: 6 * 1024 * 1024 }));
  assert.equal(matchesImageType("image/png", new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])), true);
  assert.equal(matchesImageType("image/png", new Uint8Array([0xff, 0xd8, 0xff, 0])), false);
});

test("backend upload URLs become same-origin /uploads paths; other hosts stay absolute", () => {
  const backend = "https://api.example.com/";
  assert.equal(publicMediaUrl("http://localhost:4000/uploads/t/a.webp?v=1", backend), "/uploads/t/a.webp?v=1");
  assert.equal(publicMediaUrl("https://api.example.com/uploads/t/a.webp", backend), "/uploads/t/a.webp");
  assert.equal(publicMediaUrl("https://cdn.example.com/uploads/a.webp", backend), "https://cdn.example.com/uploads/a.webp");
  assert.equal(publicMediaUrl("http://localhost:4000/files/a.webp", backend), "http://localhost:4000/files/a.webp");
  assert.equal(publicMediaUrl("http://localhost:4000/uploads/a.webp", ""), "http://localhost:4000/uploads/a.webp");
  assert.equal(publicMediaUrl("javascript:alert(1)", backend), "");
  assert.equal(publicMediaUrl("not a url", backend), "");
});

test("upload route checks session, origin, content, and membership before the backend", async () => {
  globalThis.mediaFetch = () => assert.fail("Must not call the backend");
  assert.equal((await upload(png())).status, 401);
  authorize();
  assert.equal((await upload(png(), "http://other")).status, 403);
  assert.equal((await upload(null)).status, 400);
  assert.equal((await upload(new File(["x"], "a.gif", { type: "image/gif" }))).status, 400);
  assert.equal((await upload(new File([new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])], "a.png", { type: "image/png" }))).status, 400);
  globalThis.mediaTenants = [{ id: "other" }];
  assert.equal((await upload(png())).status, 403);
});

test("upload route returns only safe fields and a reachable URL", async () => {
  authorize();
  process.env.BASEURL = "https://api.example.com/";
  globalThis.mediaFetch = async () => Response.json({ id: "m1", tenantId: "t", storageKey: "secret/key", uploadedById: "u", url: "http://localhost:4000/uploads/t/a.webp", originalName: "a.png", size: 12 }, { status: 201 });
  const response = await upload(png());
  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), { url: "/uploads/t/a.webp", id: "m1", originalName: "a.png", size: 12 });
});

test("upload route maps failures without leaking backend details", async () => {
  authorize();
  for (const status of [400, 401, 403, 404, 413, 415, 429, 500]) {
    globalThis.mediaFetch = async () => new Response("private", { status });
    const response = await upload(png());
    assert.equal(response.status, status === 500 ? 502 : status);
    assert.ok(!JSON.stringify(await response.json()).includes("private"));
  }
  globalThis.mediaFetch = async () => Response.json({ id: "m1" }, { status: 201 });
  assert.equal((await upload(png())).status, 502);
  let calls = 0;
  globalThis.mediaFetch = async () => { calls++; throw new Error("private"); };
  assert.equal((await upload(png())).status, 502);
  assert.equal(calls, 1);
});
