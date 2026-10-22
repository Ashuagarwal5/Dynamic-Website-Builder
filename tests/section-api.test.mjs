import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import "./helpers/server-only.mjs";
import { validateHeroSection } from "../src/lib/section-create.js";
import { parseSectionList } from "../src/lib/section-list.js";
const serviceUrl = new URL("../src/services/section.service.js", import.meta.url).href;
const routeUrl = new URL("../src/app/api/tenants/[tenantId]/sites/[siteId]/pages/[pageId]/sections/route.js", import.meta.url).href;
const itemUrl = new URL("../src/app/api/tenants/[tenantId]/sites/[siteId]/pages/[pageId]/sections/[sectionId]/route.js", import.meta.url).href;
registerHooks({ resolve(specifier, context, nextResolve) {
  if (context.parentURL === serviceUrl && specifier === "../lib/api") return { url: "data:text/javascript,export async function apiFetch(...args) { return globalThis.sectionFetch(...args); }", shortCircuit: true };
  if ([routeUrl, itemUrl].some((url) => decodeURI(context.parentURL || "") === decodeURI(url))) {
    if (specifier.endsWith("/lib/auth")) return { url: "data:text/javascript,export async function getSession() { return globalThis.sectionSession; }", shortCircuit: true };
    if (specifier.endsWith("/services/tenant.service")) return { url: "data:text/javascript,export async function getActiveTenants() { if(globalThis.sectionMembershipError) throw globalThis.sectionMembershipError; return globalThis.sectionTenants; }", shortCircuit: true };
    if (specifier.endsWith("/services/section.service")) return { url: serviceUrl, shortCircuit: true };
    if (specifier.endsWith("/lib/section-create")) return { url: new URL("../src/lib/section-create.js", import.meta.url).href, shortCircuit: true };
    if (specifier.endsWith("/lib/section-list")) return { url: new URL("../src/lib/section-list.js", import.meta.url).href, shortCircuit: true };
  }
  return nextResolve(specifier, context);
} });
const { listPageSections, createPageSection, updatePageSection, deletePageSection } = await import(serviceUrl);
const { GET, POST } = await import(routeUrl);
const { PATCH, DELETE } = await import(itemUrl);
const section = { id: "section-a", pageId: "page-a", type: "HERO", sortOrder: 0, isActive: true, config: { heading: "Welcome", items: [{ rating: 5 }] }, createdAt: "2026-10-09T10:06:19.468Z", updatedAt: "2026-10-09T10:06:19.468Z" };
const get = (tenantId = "tenant-a") => GET(new Request("http://localhost/api/sections"), { params: Promise.resolve({ tenantId, siteId: "site-a", pageId: "page-a" }) });
function authorize() { globalThis.sectionSession = {}; globalThis.sectionTenants = [{ id: "tenant-a" }]; }
afterEach(() => { for(const key of ["sectionFetch", "sectionSession", "sectionTenants", "sectionMembershipError"]) delete globalThis[key]; });
test("section service uses encoded IDs and GET transport", async () => {
  const response = Response.json([]);
  globalThis.sectionFetch = async (...args) => { assert.deepEqual(args, ["/tenants/t%2Fa/sites/s%2Fa/pages/p%2Fa/sections", { method: "GET" }]); return response; };
  assert.equal(await listPageSections("t/a", "s/a", "p/a"), response);
  assert.throws(() => listPageSections("t", "s", ""), /IDs are required/);
});
test("sections require current branch access and return ordered JSON preserving config", async () => {
  globalThis.sectionFetch = () => assert.fail("Must not fetch");
  assert.equal((await get()).status, 401);
  authorize();
  assert.equal((await get("other")).status, 403);
  const hidden = { ...section, id: "section-b", type: "CUSTOM", sortOrder: 2, isActive: false };
  globalThis.sectionFetch = async () => Response.json([{ ...hidden, private: "omit" }, section]);
  const response = await get();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.deepEqual(await response.json(), [section, hidden]);
  globalThis.sectionFetch = async () => Response.json([]);
  assert.deepEqual(await (await get()).json(), []);
});
test("section parser rejects malformed, duplicate, and cross-page records", async () => {
  authorize();
  for (const data of [{ sections: [] }, [null], [section, section], [{ ...section, pageId: "other" }], [{ ...section, config: [] }], [{ ...section, sortOrder: -1 }], [{ ...section, isActive: "true" }], [{ ...section, updatedAt: "bad" }]]) {
    assert.throws(() => parseSectionList(data, "page-a"));
    globalThis.sectionFetch = async () => Response.json(data);
    assert.equal((await get()).status, 502);
  }
});
test("section failures preserve known statuses and hide backend details", async () => {
  authorize();
  for (const status of [401, 403, 404, 429, 500]) {
    globalThis.sectionFetch = async () => new Response("private", { status });
    const response = await get();
    assert.equal(response.status, status === 500 ? 502 : status);
    assert.ok(!(await response.json()).error.includes("private"));
  }
  globalThis.sectionFetch = async () => { throw new Error("private"); };
  assert.equal((await get()).status, 502);
  globalThis.sectionMembershipError = Object.assign(new Error("private"), { status: 401 });
  assert.equal((await get()).status, 401);
});

const hero = { type: "HERO", sortOrder: 0, isActive: true, config: { heading: "Welcome", subtitle: "Our story", buttonText: "Learn more", buttonLink: "/about-us" } };
const post = (body, { tenantId = "tenant-a", headers = {} } = {}) => POST(new Request("http://localhost/api/sections", { method: "POST", headers: { "Content-Type": "application/json", Origin: "http://localhost", ...headers }, body: typeof body === "string" ? body : JSON.stringify(body) }), { params: Promise.resolve({ tenantId, siteId: "site-a", pageId: "page-a" }) });
test("section creation transport sends exact documented fields to the encoded parent path", async () => {
  globalThis.sectionFetch = async (path, options) => { assert.equal(path, "/tenants/t%2Fa/sites/s%2Fa/pages/p%2Fa/sections"); assert.equal(options.method, "POST"); assert.deepEqual(JSON.parse(options.body), hero); return new Response(null, { status: 201 }); };
  assert.equal((await createPageSection("t/a", "s/a", "p/a", { ...hero, pageId: "forged" })).status, 201);
});
test("hero input validates order, visibility, supported type, content and safe links", () => {
  assert.deepEqual(validateHeroSection(hero).errors, {});
  for (const input of [null, { ...hero, type: "UNKNOWN" }, { ...hero, sortOrder: -1 }, { ...hero, sortOrder: 0.5 }, { ...hero, isActive: "true" }, { ...hero, config: {} }, { ...hero, config: { ...hero.config, buttonLink: "javascript:alert(1)" } }, { ...hero, config: { ...hero.config, buttonLink: "//evil.example" } }]) assert.ok(Object.keys(validateHeroSection(input).errors).length);
  assert.deepEqual(validateHeroSection({ ...hero, config: { ...hero.config, heading: " Welcome ", injected: "omit" } }).payload, hero);
});
test("section POST requires current membership and exact JSON shape", async () => {
  globalThis.sectionFetch = () => assert.fail("Must not create section");
  assert.equal((await post(hero)).status, 401);
  authorize();
  assert.equal((await post(hero, { headers: { Origin: "http://other" } })).status, 403);
  assert.equal((await post(hero, { headers: { "Content-Type": "text/plain" } })).status, 415);
  assert.equal((await post("bad json")).status, 400);
  assert.equal((await post({ ...hero, sortOrder: "0" })).status, 400);
  assert.equal((await post(hero, { tenantId: "other" })).status, 403);
});
test("successful section creation returns JSON with no dependency on backend body", async () => {
  authorize();
  let calls = 0;
  globalThis.sectionFetch = async (path, options) => { calls++; assert.deepEqual(JSON.parse(options.body), hero); return new Response(null, { status: 201 }); };
  const response = await post({ ...hero, pageId: "forged", config: { ...hero.config, unexpected: "omit" } });
  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), { success: true });
  assert.equal(calls, 1);
});
test("section creation errors retain known statuses and do not retry uncertain mutations", async () => {
  authorize();
  for (const status of [400, 401, 403, 404, 409, 422, 429, 500]) {
    globalThis.sectionFetch = async () => new Response("private", { status });
    const response = await post(hero);
    assert.equal(response.status, status === 500 ? 502 : status);
    assert.ok(!(await response.json()).error.includes("private"));
  }
  let calls = 0;
  globalThis.sectionFetch = async () => { calls++; throw new Error("private"); };
  const response = await post(hero);
  assert.equal(response.status, 502);
  assert.match((await response.json()).error, /Refresh sections before retrying/);
  assert.equal(calls, 1);
});

const patch = (body, { tenantId = "tenant-a", sectionId = "section-a", headers = {} } = {}) => PATCH(new Request("http://localhost/api/section", { method: "PATCH", headers: { "Content-Type": "application/json", Origin: "http://localhost", ...headers }, body: typeof body === "string" ? body : JSON.stringify(body) }), { params: Promise.resolve({ tenantId, siteId: "site-a", pageId: "page-a", sectionId }) });
test("section update uses encoded IDs and documented PATCH fields", async () => {
  globalThis.sectionFetch = async (path, options) => { assert.equal(path, "/tenants/t%2Fa/sites/s%2Fa/pages/p%2Fa/sections/x%2Fa"); assert.equal(options.method, "PATCH"); assert.deepEqual(JSON.parse(options.body), hero); return new Response(null, { status: 200 }); };
  assert.equal((await updatePageSection("t/a", "s/a", "p/a", "x/a", { ...hero, ignored: true })).status, 200);
});
test("section PATCH verifies session, JSON, input and membership", async () => {
  globalThis.sectionFetch = () => assert.fail("Must not mutate");
  assert.equal((await patch(hero)).status, 401);
  authorize();
  assert.equal((await patch(hero, { headers: { Origin: "http://other" } })).status, 403);
  assert.equal((await patch(hero, { headers: { "Content-Type": "text/plain" } })).status, 415);
  assert.equal((await patch("bad json")).status, 400);
  assert.equal((await patch({ ...hero, isActive: "true" })).status, 400);
  assert.equal((await patch(hero, { tenantId: "other" })).status, 403);
});
test("PATCH merges edited fields over fresh config and preserves hidden settings and arrays", async () => {
  authorize();
  let mutations = 0;
  const freshConfig = { heading: "Old", subtitle: "Old", imageUrl: "https://example.com/photo.webp", items: [{ id: "item-a", rating: 5 }], layout: "split" };
  globalThis.sectionFetch = async (path, options) => {
    if (options.method === "GET") return Response.json([{ ...section, config: freshConfig }]);
    mutations++;
    assert.equal(path, "/tenants/tenant-a/sites/site-a/pages/page-a/sections/section-a");
    assert.deepEqual(JSON.parse(options.body), { ...hero, config: { ...freshConfig, ...hero.config } });
    return new Response(null, { status: 200 });
  };
  const response = await patch({ ...hero, config: { ...hero.config, injected: "omit" } });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { success: true });
  assert.equal(mutations, 1);
});
test("PATCH rejects missing, cross-page and unsupported sections before update", async () => {
  authorize();
  for (const [data, status] of [[[], 404], [[{ ...section, pageId: "other" }], 502], [[{ ...section, type: "IMAGE" }], 400]]) {
    globalThis.sectionFetch = async (path, options) => { assert.equal(options.method, "GET"); return Response.json(data); };
    assert.equal((await patch(hero)).status, status);
  }
});
test("PATCH errors remain safe and no ambiguous update is retried", async () => {
  authorize();
  for (const status of [400, 401, 403, 404, 409, 422, 429, 500]) {
    globalThis.sectionFetch = async (path, options) => options.method === "GET" ? Response.json([section]) : new Response("private", { status });
    const response = await patch(hero);
    assert.equal(response.status, status === 500 ? 502 : status);
    assert.ok(!(await response.json()).error.includes("private"));
  }
  let calls = 0;
  globalThis.sectionFetch = async (path, options) => { if (options.method === "GET") return Response.json([section]); calls++; throw new Error("private"); };
  const response = await patch(hero);
  assert.equal(response.status, 502);
  assert.equal(calls, 1);
});

const remove = (tenantId = "tenant-a", sectionId = "section-a", origin = "http://localhost") => DELETE(new Request("http://localhost/api/section", { method: "DELETE", headers: { Origin: origin, Accept: "application/json" } }), { params: Promise.resolve({ tenantId, siteId: "site-a", pageId: "page-a", sectionId }) });
test("section deletion uses encoded IDs and no body", async () => {
  globalThis.sectionFetch = async (path, options) => { assert.equal(path, "/tenants/t%2Fa/sites/s%2Fa/pages/p%2Fa/sections/x%2Fa"); assert.deepEqual(options, { method: "DELETE" }); return new Response(null, { status: 200 }); };
  assert.equal((await deletePageSection("t/a", "s/a", "p/a", "x/a")).status, 200);
  assert.throws(() => deletePageSection("t", "s", "p", ""), /IDs are required/);
});
test("section deletion rejects anonymous, cross-origin and unknown memberships before mutation", async () => {
  globalThis.sectionFetch = () => assert.fail("Must not mutate");
  assert.equal((await remove()).status, 401);
  authorize();
  assert.equal((await remove("tenant-a", "section-a", "http://other")).status, 403);
  assert.equal((await remove("other")).status, 403);
});
test("deletion works for non-HERO sections after checking the page relationship", async () => {
  authorize();
  let mutations = 0;
  globalThis.sectionFetch = async (path, options) => {
    if (options.method === "GET") return Response.json([{ ...section, type: "IMAGE", isActive: false }]);
    mutations++;
    assert.equal(path, "/tenants/tenant-a/sites/site-a/pages/page-a/sections/section-a");
    assert.deepEqual(options, { method: "DELETE" });
    return new Response(null, { status: 200 });
  };
  const response = await remove();
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { success: true });
  assert.equal(mutations, 1);
});
test("deletion prevents missing or cross-page section mutation", async () => {
  authorize();
  for (const [data, status] of [[[], 404], [[{ ...section, pageId: "other" }], 502]]) {
    globalThis.sectionFetch = async (path, options) => { assert.equal(options.method, "GET"); return Response.json(data); };
    assert.equal((await remove()).status, status);
  }
});
test("deletion preserves known failure statuses and never retries uncertain requests", async () => {
  authorize();
  for (const status of [400, 401, 403, 404, 409, 422, 429, 500]) {
    globalThis.sectionFetch = async (path, options) => options.method === "GET" ? Response.json([section]) : new Response("private detail", { status });
    const response = await remove();
    assert.equal(response.status, status === 500 ? 502 : status);
    assert.ok(!(await response.json()).error.includes("private"));
  }
  let calls = 0;
  globalThis.sectionFetch = async (path, options) => { if (options.method === "GET") return Response.json([section]); calls++; throw new Error("private"); };
  const response = await remove();
  assert.equal(response.status, 502);
  assert.match((await response.json()).error, /Refresh sections/);
  assert.equal(calls, 1);
});
