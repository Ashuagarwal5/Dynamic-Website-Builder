import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import "./helpers/server-only.mjs";
import { parseSiteTheme, validateThemeInput } from "../src/lib/site-theme.js";
const serviceUrl = new URL("../src/services/theme.service.js", import.meta.url).href;
const routeUrl = new URL("../src/app/api/tenants/[tenantId]/sites/[siteId]/theme/route.js", import.meta.url).href;
registerHooks({ resolve(specifier, context, nextResolve) {
  if (context.parentURL === serviceUrl && specifier === "../lib/api") return { url: "data:text/javascript,export async function apiFetch(...args) { return globalThis.themeFetch(...args); }", shortCircuit: true };
  if (decodeURI(context.parentURL || "") === decodeURI(routeUrl)) {
    if (specifier.endsWith("/lib/auth")) return { url: "data:text/javascript,export async function getSession() { return globalThis.themeSession; }", shortCircuit: true };
    if (specifier.endsWith("/services/tenant.service")) return { url: "data:text/javascript,export async function getActiveTenants() { if(globalThis.themeMembershipError) throw globalThis.themeMembershipError; return globalThis.themeTenants; }", shortCircuit: true };
    if (specifier.endsWith("/services/theme.service")) return { url: serviceUrl, shortCircuit: true };
    if (specifier.endsWith("/lib/site-theme")) return { url: new URL("../src/lib/site-theme.js", import.meta.url).href, shortCircuit: true };
  }
  return nextResolve(specifier, context);
} });
const { getSiteTheme, updateSiteTheme } = await import(serviceUrl);
const { GET, PATCH } = await import(routeUrl);
const theme = { primaryColor: "#6D28D9", secondaryColor: "#1E293B", accentColor: "#F59E0B", fontFamily: "Inter", borderRadius: "14px" };
const get = (tenantId = "tenant-a") => GET(new Request("http://localhost/api/theme"), { params: Promise.resolve({ tenantId, siteId: "site-a" }) });
function authorize() { globalThis.themeSession = {}; globalThis.themeTenants = [{ id: "tenant-a" }]; }
afterEach(() => { for(const key of ["themeFetch", "themeSession", "themeTenants", "themeMembershipError"]) delete globalThis[key]; });
test("theme service uses encoded parent IDs and authenticated GET transport", async () => {
  const response = Response.json(theme);
  globalThis.themeFetch = async (...args) => { assert.deepEqual(args, ["/tenants/t%2Fa/sites/s%2Fa/theme", { method: "GET" }]); return response; };
  assert.equal(await getSiteTheme("t/a", "s/a"), response);
  assert.throws(() => getSiteTheme("t", ""), /IDs are required/);
});
test("theme reads require current membership and expose only documented fields", async () => {
  globalThis.themeFetch = () => assert.fail("Must not fetch theme");
  assert.equal((await get()).status, 401);
  authorize();
  assert.equal((await get("other")).status, 403);
  globalThis.themeFetch = async () => Response.json({ ...theme, siteId: "site-a", accessToken: "private", id: "theme-id" });
  const response = await get();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.deepEqual(await response.json(), theme);
  globalThis.themeFetch = async () => Response.json(null);
  assert.equal(await (await get()).json(), null);
  // The backend answers 200 with an empty body when a site has no theme.
  globalThis.themeFetch = async () => new Response("", { status: 200 });
  const empty = await get();
  assert.equal(empty.status, 200);
  assert.equal(await empty.json(), null);
});
test("theme parsing rejects cross-site, invalid and unsafe values without inventing defaults", async () => {
  authorize();
  for (const data of [[], {}, { ...theme, siteId: "other" }, { ...theme, primaryColor: "url(evil)" }, { ...theme, fontFamily: "" }, { ...theme, borderRadius: "expression(evil)" }]) {
    assert.throws(() => parseSiteTheme(data, "site-a"));
    globalThis.themeFetch = async () => Response.json(data);
    assert.equal((await get()).status, 502);
  }
});
test("theme failures preserve known statuses and hide backend details", async () => {
  authorize();
  for (const status of [401, 403, 404, 429, 500]) {
    globalThis.themeFetch = async () => new Response("private", { status });
    const response = await get();
    assert.equal(response.status, status === 500 ? 502 : status);
    assert.ok(!(await response.json()).error.includes("private"));
  }
  globalThis.themeFetch = async () => { throw new Error("private"); };
  assert.equal((await get()).status, 502);
  globalThis.themeMembershipError = Object.assign(new Error("private"), { status: 401 });
  assert.equal((await get()).status, 401);
});

const patch = (body, { tenantId = "tenant-a", headers = {} } = {}) => PATCH(new Request("http://localhost/api/theme", { method: "PATCH", headers: { "Content-Type": "application/json", Origin: "http://localhost", ...headers }, body: typeof body === "string" ? body : JSON.stringify(body) }), { params: Promise.resolve({ tenantId, siteId: "site-a" }) });
test("theme PATCH transport sends exactly the five documented fields", async () => {
  globalThis.themeFetch = async (path, options) => { assert.equal(path, "/tenants/t%2Fa/sites/s%2Fa/theme"); assert.equal(options.method, "PATCH"); assert.deepEqual(JSON.parse(options.body), theme); return new Response(null, { status: 200 }); };
  assert.equal((await updateSiteTheme("t/a", "s/a", { ...theme, siteId: "forged", ignored: true })).status, 200);
});
test("theme input validation trims values and rejects invalid colors, radius, and missing fields", () => {
  assert.deepEqual(validateThemeInput({ ...theme, fontFamily: " Inter ", ignored: true }), { errors: {}, payload: theme });
  for (const input of [null, {}, { ...theme, accentColor: "url(evil)" }, { ...theme, borderRadius: "-1px" }, { ...theme, fontFamily: " " }]) assert.ok(Object.keys(validateThemeInput(input).errors).length);
});
test("theme PATCH rejects missing sessions, invalid bodies, cross-origin and unknown memberships", async () => {
  globalThis.themeFetch = () => assert.fail("Must not mutate");
  assert.equal((await patch(theme)).status, 401);
  authorize();
  assert.equal((await patch(theme, { headers: { Origin: "http://other" } })).status, 403);
  assert.equal((await patch(theme, { headers: { "Content-Type": "text/plain" } })).status, 415);
  assert.equal((await patch("bad json")).status, 400);
  assert.equal((await patch({ ...theme, borderRadius: "bad" })).status, 400);
  assert.equal((await patch(theme, { tenantId: "other" })).status, 403);
});
test("theme PATCH returns JSON after backend confirmation without requiring an upstream body", async () => {
  authorize();
  let calls = 0;
  globalThis.themeFetch = async (path, options) => { calls++; assert.deepEqual(JSON.parse(options.body), theme); return new Response(null, { status: 200 }); };
  const response = await patch({ ...theme, siteId: "forged", fontFamily: " Inter " });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.deepEqual(await response.json(), { success: true });
  assert.equal(calls, 1);
});
test("theme mutation failures preserve known status codes and never retry uncertain saves", async () => {
  authorize();
  for (const status of [400, 401, 403, 404, 409, 422, 429, 500]) {
    globalThis.themeFetch = async () => new Response("private", { status });
    const response = await patch(theme);
    assert.equal(response.status, status === 500 ? 502 : status);
    assert.ok(!(await response.json()).error.includes("private"));
  }
  let calls = 0;
  globalThis.themeFetch = async () => { calls++; throw new Error("private"); };
  const response = await patch(theme);
  assert.equal(response.status, 502);
  assert.match((await response.json()).error, /Refresh the theme before retrying/);
  assert.equal(calls, 1);
});
