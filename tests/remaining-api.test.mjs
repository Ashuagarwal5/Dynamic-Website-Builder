import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import "./helpers/server-only.mjs";

const url = (path) => new URL(path, import.meta.url).href;
const authService = url("../src/services/auth.service.js");
const publicService = url("../src/services/public-site.service.js");
const publishingService = url("../src/services/publishing.service.js");
const unpublishRoute = url("../src/app/api/tenants/[tenantId]/sites/[siteId]/pages/[pageId]/unpublish/route.js");
const apiStub = "data:text/javascript,export async function apiFetch(...args) { return globalThis.remainingFetch(...args); }";
registerHooks({
  resolve(specifier, context, nextResolve) {
    const parent = decodeURI(context.parentURL || "");
    if ([authService, publicService, publishingService].includes(context.parentURL) && specifier === "../lib/api")
      return { url: apiStub, shortCircuit: true };
    if (parent === decodeURI(unpublishRoute)) {
      if (specifier.endsWith("/lib/auth")) return { url: "data:text/javascript,export async function getSession() { return globalThis.remainingSession; }", shortCircuit: true };
      if (specifier.endsWith("/services/tenant.service")) return { url: "data:text/javascript,export async function getActiveTenants() { return globalThis.remainingTenants; }", shortCircuit: true };
      if (specifier.endsWith("/services/publishing.service")) return { url: publishingService, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});
const { registerUser, getCurrentUser } = await import(authService);
const { getPublicSite } = await import(publicService);
const { unpublishTenantPage } = await import(publishingService);
const { POST: unpublishPage } = await import(unpublishRoute);
const { parsePublicSite, safeHref } = await import("../src/lib/public-site.js");

afterEach(() => {
  for (const key of ["remainingFetch", "remainingSession", "remainingTenants"]) delete globalThis[key];
});

test("register sends only provided fields without authentication", async () => {
  const response = new Response(null, { status: 201 });
  const calls = [];
  globalThis.remainingFetch = async (path, options) => { calls.push([path, options]); return response; };
  assert.equal(await registerUser({ name: "A", email: "a@b.co", password: "Password123!" }), response);
  await registerUser({ name: "A", email: "a@b.co", password: "Password123!", tenantName: "T", tenantSlug: "t-1" });
  assert.equal(calls[0][0], "/auth/register");
  assert.equal(calls[0][1].authenticated, false);
  assert.deepEqual(JSON.parse(calls[0][1].body), { name: "A", email: "a@b.co", password: "Password123!" });
  assert.deepEqual(JSON.parse(calls[1][1].body), { name: "A", email: "a@b.co", password: "Password123!", tenantName: "T", tenantSlug: "t-1" });
});

test("current user uses an authenticated GET", async () => {
  globalThis.remainingFetch = async (path, options) => { assert.equal(path, "/auth/me"); assert.deepEqual(options, { method: "GET" }); return new Response("{}"); };
  await getCurrentUser();
});

test("public site is fetched unauthenticated with an encoded subdomain", async () => {
  globalThis.remainingFetch = async (path, options) => { assert.equal(path, "/public/sites/a%2Fb"); assert.deepEqual(options, { authenticated: false, method: "GET" }); return new Response("{}"); };
  await getPublicSite("a/b");
  assert.throws(() => getPublicSite(""), /subdomain is required/);
});

test("page unpublish uses encoded IDs and a body-free POST", async () => {
  globalThis.remainingFetch = async (path, options) => { assert.equal(path, "/tenants/t%2F1/sites/s/pages/p/unpublish"); assert.deepEqual(options, { method: "POST" }); return new Response(null, { status: 201 }); };
  await unpublishTenantPage("t/1", "s", "p");
  assert.throws(() => unpublishTenantPage("t", "s", ""), /IDs are required/);
});

test("page unpublish route checks origin, session, and membership, and hides upstream details", async () => {
  const call = (origin = "http://localhost") => unpublishPage(new Request("http://localhost/x", { method: "POST", headers: { Origin: origin } }), { params: Promise.resolve({ tenantId: "t", siteId: "s", pageId: "p" }) });
  globalThis.remainingFetch = () => assert.fail("Must not call the backend");
  assert.equal((await call()).status, 401);
  globalThis.remainingSession = {};
  globalThis.remainingTenants = [{ id: "t" }];
  assert.equal((await call("http://other")).status, 403);
  globalThis.remainingTenants = [];
  assert.equal((await call()).status, 403);
  globalThis.remainingTenants = [{ id: "t" }];
  globalThis.remainingFetch = async () => new Response(null, { status: 201 });
  const ok = await call();
  assert.equal(ok.status, 200);
  assert.deepEqual(await ok.json(), { success: true });
  globalThis.remainingFetch = async () => new Response("private", { status: 500 });
  const failed = await call();
  assert.equal(failed.status, 502);
  assert.ok(!(await failed.json()).error.includes("private"));
});

test("public site parsing orders active sections and rejects unsafe values", () => {
  const site = parsePublicSite({
    site: { name: "Jaipur" },
    theme: { primaryColor: "red;background:url(x)", fontFamily: "Inter", borderRadius: "12px" },
    pages: [{ id: "1", name: "Home", slug: "home", sections: [
      { id: "b", type: "TEXT", sortOrder: 2, config: { text: "b" } },
      { id: "a", type: "HERO", sortOrder: 1, isActive: true, config: {} },
      { id: "c", type: "FAQ", isActive: false },
    ] }],
  });
  assert.equal(site.name, "Jaipur");
  assert.equal(site.theme.primaryColor, "#0987F5");
  assert.equal(site.theme.fontFamily, "Inter");
  assert.deepEqual(site.pages[0].sections.map((section) => section.id), ["a", "b"]);
  assert.throws(() => parsePublicSite(null));
  assert.equal(safeHref("javascript:alert(1)"), "");
  assert.equal(safeHref("//evil.example"), "");
  assert.equal(safeHref("/products"), "/products");
});
