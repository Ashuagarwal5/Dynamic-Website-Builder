import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import "./helpers/server-only.mjs";
import { parseSiteList } from "../src/lib/site-list.js";
const serviceUrl = new URL("../src/services/website.service.js", import.meta.url).href;
const routeUrl = new URL("../src/app/api/tenants/[tenantId]/sites/route.js", import.meta.url).href;
registerHooks({ resolve(specifier, context, nextResolve) {
  if (context.parentURL === serviceUrl && specifier === "../lib/api") return { url: "data:text/javascript,export async function apiFetch(...args) { return globalThis.siteApiFetch(...args); }", shortCircuit: true };
  if (decodeURI(context.parentURL || "") === decodeURI(routeUrl)) {
    if (specifier === "../../../../../lib/auth") return { url: "data:text/javascript,export async function getSession() { return globalThis.siteApiSession; }", shortCircuit: true };
    if (specifier === "../../../../../services/tenant.service") return { url: "data:text/javascript,export async function getActiveTenants() { if (globalThis.siteMembershipError) throw globalThis.siteMembershipError; return globalThis.siteApiTenants; }", shortCircuit: true };
    if (specifier === "../../../../../services/website.service") return { url: serviceUrl, shortCircuit: true };
    if (specifier === "../../../../../lib/site-list") return { url: new URL("../src/lib/site-list.js", import.meta.url).href, shortCircuit: true };
  }
  return nextResolve(specifier, context);
} });
const { listTenantSites, createTenantSite } = await import(serviceUrl);
const { GET, POST } = await import(routeUrl);
afterEach(() => { for (const key of ["siteApiFetch", "siteApiSession", "siteApiTenants", "siteMembershipError"]) delete globalThis[key]; });
const site = { id: "site-a", tenantId: "tenant-a", name: "Website A", slug: "website-a", domain: null, subdomain: null, status: "DRAFT", createdAt: "2026-10-09T06:12:19.567Z", updatedAt: "2026-10-12T09:48:35.298Z" };
const get = (tenantId = "tenant-a") => GET(new Request("http://localhost/api/tenants/tenant-a/sites"), { params: Promise.resolve({ tenantId }) });
function authorize() { globalThis.siteApiSession = { accessToken: "private" }; globalThis.siteApiTenants = [{ id: "tenant-a" }]; }

test("service uses the encoded tenant path and GET transport", async () => {
  const response = Response.json([]);
  globalThis.siteApiFetch = async (...args) => { assert.deepEqual(args, ["/tenants/tenant%2Fa/sites", { method: "GET" }]); return response; };
  assert.equal(await listTenantSites("tenant/a"), response);
  assert.throws(() => listTenantSites(""), /tenant ID/);
});
test("route rejects missing sessions and removed memberships before fetching sites", async () => {
  globalThis.siteApiFetch = () => assert.fail("Must not call site endpoint");
  assert.equal((await get()).status, 401);
  authorize();
  assert.equal((await get("not-a-member")).status, 403);
  globalThis.siteApiTenants = [];
  assert.equal((await get()).status, 403);
});
test("route returns safe JSON and empty lists without manufacturing editor drafts", async () => {
  authorize();
  globalThis.siteApiFetch = async () => Response.json([{ ...site, accessToken: "secret", draft: { private: true } }]);
  const response = await get();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.deepEqual(await response.json(), [site]);
  globalThis.siteApiFetch = async () => Response.json([]);
  assert.deepEqual(await (await get()).json(), []);
});
test("malformed, duplicate, and cross-tenant responses fail safely", async () => {
  authorize();
  for (const data of [{ sites: [] }, [null], [site, site], [{ ...site, tenantId: "another" }], [{ ...site, updatedAt: "invalid" }]]) {
    assert.throws(() => parseSiteList(data, "tenant-a"), /Invalid website list/);
    globalThis.siteApiFetch = async () => Response.json(data);
    assert.equal((await get()).status, 502);
  }
});
test("backend and membership failures return safe errors without local fallback", async () => {
  authorize();
  for (const status of [401, 403, 404, 429, 500]) {
    globalThis.siteApiFetch = async () => new Response("secret backend details", { status });
    const response = await get();
    assert.equal(response.status, status === 500 ? 502 : status);
    assert.ok(!(await response.json()).error.includes("secret"));
  }
  globalThis.siteApiFetch = async () => { throw new Error("private network error"); };
  assert.equal((await get()).status, 502);
  globalThis.siteMembershipError = Object.assign(new Error("private"), { status: 401 });
  assert.equal((await get()).status, 401);
});
test("unknown statuses are preserved instead of being mislabeled draft", () => {
  assert.equal(parseSiteList([{ ...site, status: "UNPUBLISHED" }], "tenant-a")[0].status, "UNPUBLISHED");
});

const post = (body, { tenantId = "tenant-a", headers = {} } = {}) => POST(new Request("http://localhost/api/tenants/tenant-a/sites", {
  method: "POST", headers: { "Content-Type": "application/json", Origin: "http://localhost", ...headers }, body: typeof body === "string" ? body : JSON.stringify(body),
}), { params: Promise.resolve({ tenantId }) });

test("creation service sends only documented fields to the selected tenant", async () => {
  const response = new Response(null, { status: 201 });
  globalThis.siteApiFetch = async (path, options) => {
    assert.equal(path, "/tenants/tenant%2Fa/sites");
    assert.equal(options.method, "POST");
    assert.deepEqual(JSON.parse(options.body), { name: "Website", slug: "website" });
    return response;
  };
  assert.equal(await createTenantSite("tenant/a", { name: "Website", slug: "website", tenantId: "forged", templateId: "unconfirmed" }), response);
});
test("creation route rejects unauthenticated, cross-origin, malformed, and invalid requests", async () => {
  globalThis.siteApiFetch = () => assert.fail("Must not create a website");
  assert.equal((await post({})).status, 401);
  authorize();
  assert.equal((await post({}, { headers: { Origin: "http://another.example" } })).status, 403);
  assert.equal((await post({}, { headers: { "Content-Type": "text/plain" } })).status, 415);
  assert.equal((await post("not json")).status, 400);
  for (const body of [null, { name: " ", slug: "valid" }, { name: "Valid", slug: "BAD SLUG" }, { name: "x".repeat(121), slug: "valid" }]) {
    assert.equal((await post(body)).status, 400);
  }
  assert.equal((await post({ name: "Valid", slug: "valid" }, { tenantId: "other" })).status, 403);
  globalThis.siteApiTenants = [];
  assert.equal((await post({ name: "Valid", slug: "valid" })).status, 403);
});
test("creation trims exact keys and returns plain JSON without relying on a backend response body", async () => {
  authorize();
  let calls = 0;
  globalThis.siteApiFetch = async (path, options) => {
    calls++;
    assert.equal(path, "/tenants/tenant-a/sites");
    assert.deepEqual(JSON.parse(options.body), { name: "Website", slug: "website" });
    return new Response(null, { status: 201 });
  };
  const response = await post({ name: " Website ", slug: " website ", tenantId: "forged" });
  assert.equal(response.status, 201);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.deepEqual(await response.json(), { success: true });
  assert.equal(calls, 1);
});
test("creation errors preserve known status codes, hide upstream details and do not retry", async () => {
  authorize();
  for (const status of [400, 401, 403, 404, 409, 422, 429, 500]) {
    globalThis.siteApiFetch = async () => new Response("secret backend details", { status });
    const response = await post({ name: "Website", slug: "website" });
    assert.equal(response.status, status === 500 ? 502 : status);
    assert.ok(!(await response.json()).error.includes("secret"));
  }
  let calls = 0;
  globalThis.siteApiFetch = async () => { calls++; throw new Error("private error"); };
  const response = await post({ name: "Website", slug: "website" });
  assert.equal(response.status, 502);
  assert.match((await response.json()).error, /Check My Websites before retrying/);
  assert.equal(calls, 1);
});
