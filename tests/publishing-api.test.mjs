import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import "./helpers/server-only.mjs";
const serviceUrl = new URL("../src/services/publishing.service.js", import.meta.url).href;
const routeUrl = new URL("../src/app/api/tenants/[tenantId]/sites/[siteId]/publish/route.js", import.meta.url).href;
const unpublishUrl = new URL("../src/app/api/tenants/[tenantId]/sites/[siteId]/unpublish/route.js", import.meta.url).href;
const pagePublishUrl = new URL("../src/app/api/tenants/[tenantId]/sites/[siteId]/pages/[pageId]/publish/route.js", import.meta.url).href;
registerHooks({ resolve(specifier, context, nextResolve) {
  if (context.parentURL === serviceUrl && specifier === "../lib/api") return { url: "data:text/javascript,export async function apiFetch(...args) { return globalThis.publishFetch(...args); }", shortCircuit: true };
  if ([routeUrl, unpublishUrl, pagePublishUrl].some((url) => decodeURI(context.parentURL || "") === decodeURI(url))) {
    if (specifier.endsWith("/lib/auth")) return { url: "data:text/javascript,export async function getSession() { return globalThis.publishSession; }", shortCircuit: true };
    if (specifier.endsWith("/services/tenant.service")) return { url: "data:text/javascript,export async function getActiveTenants() { if(globalThis.publishMembershipError) throw globalThis.publishMembershipError; return globalThis.publishTenants; }", shortCircuit: true };
    if (specifier.endsWith("/services/publishing.service")) return { url: serviceUrl, shortCircuit: true };
  }
  return nextResolve(specifier, context);
} });
const { publishTenantSite, unpublishTenantSite, publishTenantPage } = await import(serviceUrl);
const { POST } = await import(routeUrl);
const { POST: UNPUBLISH } = await import(unpublishUrl);
const post = (tenantId = "tenant-a", origin = "http://localhost") => POST(new Request("http://localhost/api/publish", { method: "POST", headers: { Origin: origin, Accept: "application/json" } }), { params: Promise.resolve({ tenantId, siteId: "site-a" }) });
function authorize() { globalThis.publishSession = {}; globalThis.publishTenants = [{ id: "tenant-a" }]; }
afterEach(() => { for(const key of ["publishFetch", "publishSession", "publishTenants", "publishMembershipError"]) delete globalThis[key]; });
test("website publication uses encoded IDs and a body-free authenticated POST", async () => {
  const response = new Response(null, { status: 201 });
  globalThis.publishFetch = async (path, options) => { assert.equal(path, "/tenants/t%2Fa/sites/s%2Fa/publish"); assert.deepEqual(options, { method: "POST" }); return response; };
  assert.equal(await publishTenantSite("t/a", "s/a"), response);
  assert.throws(() => publishTenantSite("t", ""), /IDs are required/);
});
test("publication requires session, same origin, and current active membership", async () => {
  globalThis.publishFetch = () => assert.fail("Must not publish");
  assert.equal((await post()).status, 401);
  authorize();
  assert.equal((await post("tenant-a", "http://other")).status, 403);
  assert.equal((await post("other")).status, 403);
  globalThis.publishTenants = [];
  assert.equal((await post()).status, 403);
});
test("publication succeeds with empty backend body and returns safe JSON", async () => {
  authorize();
  let calls = 0;
  globalThis.publishFetch = async (path, options) => { calls++; assert.equal(path, "/tenants/tenant-a/sites/site-a/publish"); assert.deepEqual(options, { method: "POST" }); return new Response(null, { status: 201 }); };
  const response = await post();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.deepEqual(await response.json(), { success: true });
  assert.equal(calls, 1);
});
test("publication errors keep expected statuses and never retry uncertain actions", async () => {
  authorize();
  for (const status of [400, 401, 403, 404, 409, 422, 429, 500]) {
    globalThis.publishFetch = async () => new Response("private", { status });
    const response = await post();
    assert.equal(response.status, status === 500 ? 502 : status);
    assert.ok(!(await response.json()).error.includes("private"));
  }
  let calls = 0;
  globalThis.publishFetch = async () => { calls++; throw new Error("private"); };
  const response = await post();
  assert.equal(response.status, 502);
  assert.match((await response.json()).error, /Refresh websites/);
  assert.equal(calls, 1);
  globalThis.publishMembershipError = Object.assign(new Error("private"), { status: 401 });
  assert.equal((await post()).status, 401);
});

const unpublish = (tenantId = "tenant-a", origin = "http://localhost") => UNPUBLISH(new Request("http://localhost/api/unpublish", { method: "POST", headers: { Origin: origin, Accept: "application/json" } }), { params: Promise.resolve({ tenantId, siteId: "site-a" }) });
test("unpublish sends a body-free POST to the encoded endpoint", async () => {
  const response = new Response(null, { status: 201 });
  globalThis.publishFetch = async (path, options) => { assert.equal(path, "/tenants/t%2Fa/sites/s%2Fa/unpublish"); assert.deepEqual(options, { method: "POST" }); return response; };
  assert.equal(await unpublishTenantSite("t/a", "s/a"), response);
  assert.throws(() => unpublishTenantSite("", "site"), /IDs are required/);
});
test("unpublish requires session, same origin and fresh membership", async () => {
  globalThis.publishFetch = () => assert.fail("Must not unpublish");
  assert.equal((await unpublish()).status, 401);
  authorize();
  assert.equal((await unpublish("tenant-a", "http://other")).status, 403);
  assert.equal((await unpublish("other")).status, 403);
  globalThis.publishTenants = [];
  assert.equal((await unpublish()).status, 403);
});
test("unpublish returns success JSON only after backend confirmation", async () => {
  authorize();
  let calls = 0;
  globalThis.publishFetch = async (path, options) => { calls++; assert.equal(path, "/tenants/tenant-a/sites/site-a/unpublish"); assert.deepEqual(options, { method: "POST" }); return new Response(null, { status: 201 }); };
  const response = await unpublish();
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { success: true });
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.equal(calls, 1);
});
test("unpublish failures keep known statuses, hide backend details and do not retry", async () => {
  authorize();
  for (const status of [400, 401, 403, 404, 409, 422, 429, 500]) {
    globalThis.publishFetch = async () => new Response("private", { status });
    const response = await unpublish();
    assert.equal(response.status, status === 500 ? 502 : status);
    assert.ok(!(await response.json()).error.includes("private"));
  }
  let calls = 0;
  globalThis.publishFetch = async () => { calls++; throw new Error("private"); };
  const response = await unpublish();
  assert.equal(response.status, 502);
  assert.equal(calls, 1);
});

const { POST: PUBLISH_PAGE } = await import(pagePublishUrl);
const publishPage = (tenantId = "tenant-a", origin = "http://localhost", pageId = "page-a") => PUBLISH_PAGE(new Request("http://localhost/api/page-publish", { method: "POST", headers: { Origin: origin } }), { params: Promise.resolve({ tenantId, siteId: "site-a", pageId }) });
test("page publish encodes all parent IDs and sends no body", async () => {
  globalThis.publishFetch = async (path, options) => { assert.equal(path, "/tenants/t%2Fa/sites/s%2Fa/pages/p%2Fa/publish"); assert.deepEqual(options, { method: "POST" }); return new Response(null, { status: 201 }); };
  await publishTenantPage("t/a", "s/a", "p/a");
  assert.throws(() => publishTenantPage("t", "s", ""), /IDs are required/);
});
test("page publish checks session, origin, membership and page ID", async () => {
  globalThis.publishFetch = () => assert.fail("Must not publish");
  assert.equal((await publishPage()).status, 401);
  authorize();
  assert.equal((await publishPage("tenant-a", "http://other")).status, 403);
  assert.equal((await publishPage("other")).status, 403);
  assert.equal((await publishPage("tenant-a", "http://localhost", "")).status, 400);
});
test("page publish maps empty success to JSON and handles failures without retries", async () => {
  authorize();
  globalThis.publishFetch = async (path, options) => { assert.equal(path, "/tenants/tenant-a/sites/site-a/pages/page-a/publish"); assert.deepEqual(options, { method: "POST" }); return new Response(null, { status: 201 }); };
  const response = await publishPage();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.deepEqual(await response.json(), { success: true });
  for (const status of [400,401,403,404,409,422,429,500]) {
    globalThis.publishFetch = async () => new Response("private", { status });
    const result = await publishPage();
    assert.equal(result.status, status === 500 ? 502 : status);
    assert.ok(!(await result.json()).error.includes("private"));
  }
  let calls=0;
  globalThis.publishFetch = async () => { calls++; throw new Error("private"); };
  assert.equal((await publishPage()).status, 502);
  assert.equal(calls, 1);
});
