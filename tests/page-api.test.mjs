import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import "./helpers/server-only.mjs";
import { parsePageList } from "../src/lib/page-list.js";
const serviceUrl = new URL("../src/services/page.service.js", import.meta.url).href;
const routeUrl = new URL("../src/app/api/tenants/[tenantId]/sites/[siteId]/pages/route.js", import.meta.url).href;
const detailsUrl = new URL("../src/app/api/tenants/[tenantId]/sites/[siteId]/pages/[pageId]/route.js", import.meta.url).href;
registerHooks({ resolve(specifier, context, nextResolve) {
  if (context.parentURL === serviceUrl && specifier === "../lib/api") return { url: "data:text/javascript,export async function apiFetch(...args) { return globalThis.pageFetch(...args); }", shortCircuit: true };
  if ([routeUrl, detailsUrl].some((url) => decodeURI(context.parentURL || "") === decodeURI(url))) {
    if (specifier.endsWith("/lib/auth")) return { url: "data:text/javascript,export async function getSession() { return globalThis.pageSession; }", shortCircuit: true };
    if (specifier.endsWith("/services/tenant.service")) return { url: "data:text/javascript,export async function getActiveTenants() { if(globalThis.pageMembershipError) throw globalThis.pageMembershipError; return globalThis.pageTenants; }", shortCircuit: true };
    if (specifier.endsWith("/services/page.service")) return { url: serviceUrl, shortCircuit: true };
    if (specifier.endsWith("/lib/page-list")) return { url: new URL("../src/lib/page-list.js", import.meta.url).href, shortCircuit: true };
  }
  return nextResolve(specifier, context);
} });
const { listSitePages, createSitePage, getSitePage } = await import(serviceUrl);
const { GET, POST } = await import(routeUrl);
const { GET: GET_DETAILS } = await import(detailsUrl);
const page = { id: "page-a", siteId: "site-a", name: "Home", slug: "home", status: "PUBLISHED", createdAt: "2026-10-09T09:39:09.031Z", updatedAt: "2026-10-12T11:12:14.872Z" };
const get = (tenantId = "tenant-a", siteId = "site-a") => GET(new Request("http://localhost/api/pages"), { params: Promise.resolve({ tenantId, siteId }) });
function authorize() { globalThis.pageSession = {}; globalThis.pageTenants = [{ id: "tenant-a" }]; }
afterEach(() => { for(const key of ["pageFetch", "pageSession", "pageTenants", "pageMembershipError"]) delete globalThis[key]; });
test("page service uses encoded IDs and GET with the authenticated transport", async () => {
  const response = Response.json([]);
  globalThis.pageFetch = async (...args) => { assert.deepEqual(args, ["/tenants/tenant%2Fa/sites/site%2Fa/pages", { method: "GET" }]); return response; };
  assert.equal(await listSitePages("tenant/a", "site/a"), response);
  assert.throws(() => listSitePages("", "site-a"), /IDs are required/);
});
test("page reads require current membership and return only safe page metadata", async () => {
  globalThis.pageFetch = () => assert.fail("Must not request pages");
  assert.equal((await get()).status, 401);
  authorize();
  assert.equal((await get("other")).status, 403);
  globalThis.pageFetch = async () => Response.json([{ ...page, private: "secret" }]);
  const response = await get();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.deepEqual(await response.json(), [page]);
  globalThis.pageFetch = async () => Response.json([]);
  assert.deepEqual(await (await get()).json(), []);
});
test("invalid or cross-site page responses fail rather than showing another website's data", async () => {
  authorize();
  for (const data of [{ pages: [] }, [null], [page, page], [{ ...page, siteId: "other" }], [{ ...page, updatedAt: "bad" }]]) {
    assert.throws(() => parsePageList(data, "site-a"));
    globalThis.pageFetch = async () => Response.json(data);
    assert.equal((await get()).status, 502);
  }
  assert.equal(parsePageList([{ ...page, status: "UNPUBLISHED" }], "site-a")[0].status, "UNPUBLISHED");
});
test("page errors retain known statuses and hide private upstream details", async () => {
  authorize();
  for (const status of [401, 403, 404, 429, 500]) {
    globalThis.pageFetch = async () => new Response("private detail", { status });
    const response = await get();
    assert.equal(response.status, status === 500 ? 502 : status);
    assert.ok(!(await response.json()).error.includes("private"));
  }
  globalThis.pageFetch = async () => { throw new Error("private"); };
  assert.equal((await get()).status, 502);
  globalThis.pageMembershipError = Object.assign(new Error("private"), { status: 401 });
  assert.equal((await get()).status, 401);
});

const post = (body, { tenantId = "tenant-a", siteId = "site-a", headers = {} } = {}) => POST(new Request("http://localhost/api/pages", { method: "POST", headers: { "Content-Type": "application/json", Origin: "http://localhost", ...headers }, body: typeof body === "string" ? body : JSON.stringify(body) }), { params: Promise.resolve({ tenantId, siteId }) });
test("page creation sends only name/slug to the encoded parent path", async () => {
  const response = new Response(null, { status: 201 });
  globalThis.pageFetch = async (path, options) => {
    assert.equal(path, "/tenants/tenant%2Fa/sites/site%2Fa/pages");
    assert.equal(options.method, "POST");
    assert.deepEqual(JSON.parse(options.body), { name: "Home", slug: "home" });
    return response;
  };
  assert.equal(await createSitePage("tenant/a", "site/a", { name: "Home", slug: "home", status: "PUBLISHED" }), response);
});
test("page creation requires JSON, valid fields, and current branch membership", async () => {
  globalThis.pageFetch = () => assert.fail("Must not create page");
  assert.equal((await post({})).status, 401);
  authorize();
  assert.equal((await post({}, { headers: { Origin: "http://other" } })).status, 403);
  assert.equal((await post({}, { headers: { "Content-Type": "text/plain" } })).status, 415);
  assert.equal((await post("broken json")).status, 400);
  for (const body of [null, { name: "", slug: "home" }, { name: "Home", slug: "../bad" }, { name: "x".repeat(121), slug: "home" }]) assert.equal((await post(body)).status, 400);
  assert.equal((await post({ name: "Home", slug: "home" }, { tenantId: "other" })).status, 403);
  globalThis.pageMembershipError = new Error("private");
  assert.equal((await post({ name: "Home", slug: "home" })).status, 502);
});
test("page creation trims fields and returns JSON without relying on upstream body", async () => {
  authorize();
  let calls = 0;
  globalThis.pageFetch = async (path, options) => {
    calls++;
    assert.equal(path, "/tenants/tenant-a/sites/site-a/pages");
    assert.deepEqual(JSON.parse(options.body), { name: "Home", slug: "home" });
    return new Response(null, { status: 201 });
  };
  const response = await post({ name: " Home ", slug: " home ", siteId: "forged", status: "PUBLISHED" });
  assert.equal(response.status, 201);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.deepEqual(await response.json(), { success: true });
  assert.equal(calls, 1);
});
test("page creation preserves known failure statuses and never retries ambiguous failures", async () => {
  authorize();
  for (const status of [400, 401, 403, 404, 409, 422, 429, 500]) {
    globalThis.pageFetch = async () => new Response("secret", { status });
    const response = await post({ name: "Home", slug: "home" });
    assert.equal(response.status, status === 500 ? 502 : status);
    assert.ok(!(await response.json()).error.includes("secret"));
  }
  let calls = 0;
  globalThis.pageFetch = async () => { calls++; throw new Error("private"); };
  const response = await post({ name: "Home", slug: "home" });
  assert.equal(response.status, 502);
  assert.match((await response.json()).error, /Check the page list before retrying/);
  assert.equal(calls, 1);
});

const details = (tenantId = "tenant-a", siteId = "site-a", pageId = "page-a") => GET_DETAILS(new Request("http://localhost/api/page-details"), { params: Promise.resolve({ tenantId, siteId, pageId }) });
test("page details service uses an encoded GET path", async () => {
  const response = Response.json(page);
  globalThis.pageFetch = async (...args) => { assert.deepEqual(args, ["/tenants/tenant%2Fa/sites/site%2Fa/pages/page%2Fa", { method: "GET" }]); return response; };
  assert.equal(await getSitePage("tenant/a", "site/a", "page/a"), response);
  assert.throws(() => getSitePage("tenant-a", "site-a", ""), /IDs are required/);
});
test("details require current membership and return only known page fields", async () => {
  globalThis.pageFetch = () => assert.fail("Must not fetch page");
  assert.equal((await details()).status, 401);
  authorize();
  assert.equal((await details("other")).status, 403);
  globalThis.pageFetch = async () => Response.json({ ...page, private: "secret" });
  const response = await details();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.deepEqual(await response.json(), page);
});
test("details reject mismatched page IDs, website IDs, and malformed responses", async () => {
  authorize();
  for (const data of [null, [], { ...page, id: "another-page" }, { ...page, siteId: "another-site" }, { ...page, createdAt: "bad" }]) {
    globalThis.pageFetch = async () => Response.json(data);
    assert.equal((await details()).status, 502);
  }
});
test("details preserve known errors while hiding upstream details", async () => {
  authorize();
  for (const status of [401, 403, 404, 429, 500]) {
    globalThis.pageFetch = async () => new Response("private detail", { status });
    const response = await details();
    assert.equal(response.status, status === 500 ? 502 : status);
    assert.ok(!(await response.json()).error.includes("private"));
  }
  globalThis.pageFetch = async () => { throw new Error("private network error"); };
  assert.equal((await details()).status, 502);
});
