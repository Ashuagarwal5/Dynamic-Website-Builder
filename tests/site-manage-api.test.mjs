import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import "./helpers/server-only.mjs";

const url = (path) => new URL(path, import.meta.url).href;
const service = url("../src/services/website.service.js");
const route = url("../src/app/api/tenants/[tenantId]/sites/[siteId]/route.js");
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (context.parentURL === service && specifier === "../lib/api")
      return { url: "data:text/javascript,export async function apiFetch(...args) { return globalThis.manageFetch(...args); }", shortCircuit: true };
    if (decodeURI(context.parentURL || "") === decodeURI(route)) {
      if (specifier.endsWith("/lib/auth")) return { url: "data:text/javascript,export async function getSession() { return globalThis.manageSession; }", shortCircuit: true };
      if (specifier.endsWith("/services/tenant.service")) return { url: "data:text/javascript,export async function getActiveTenants() { return globalThis.manageTenants; }", shortCircuit: true };
      if (specifier.endsWith("/services/website.service")) return { url: service, shortCircuit: true };
      if (specifier.endsWith("/lib/site-edit")) return { url: url("../src/lib/site-edit.js"), shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});
const { updateTenantSite, deleteTenantSite } = await import(service);
const { PATCH, DELETE } = await import(route);
const { validateSiteEdit } = await import("../src/lib/site-edit.js");

afterEach(() => { for (const key of ["manageFetch", "manageSession", "manageTenants"]) delete globalThis[key]; });
const params = { params: Promise.resolve({ tenantId: "t", siteId: "s" }) };
const patch = (body, origin = "http://localhost") => PATCH(new Request("http://localhost/x", { method: "PATCH", headers: { "Content-Type": "application/json", Origin: origin }, body: JSON.stringify(body) }), params);
const del = (origin = "http://localhost") => DELETE(new Request("http://localhost/x", { method: "DELETE", headers: { Origin: origin } }), params);
const authorize = () => { globalThis.manageSession = {}; globalThis.manageTenants = [{ id: "t" }]; };

test("site update and delete use encoded IDs", async () => {
  const calls = [];
  globalThis.manageFetch = async (path, options) => { calls.push([path, options]); return new Response(null, { status: 200 }); };
  await updateTenantSite("t/1", "s/1", { name: "N" });
  await deleteTenantSite("t/1", "s/1");
  assert.equal(calls[0][0], "/tenants/t%2F1/sites/s%2F1");
  assert.deepEqual(calls[0][1], { method: "PATCH", body: JSON.stringify({ name: "N" }) });
  assert.deepEqual(calls[1][1], { method: "DELETE" });
  assert.throws(() => deleteTenantSite("t", ""), /IDs are required/);
});

test("edit validation keeps only supplied, valid fields", () => {
  assert.deepEqual(validateSiteEdit({ name: " New " }).changes, { name: "New" });
  assert.ok(validateSiteEdit({ slug: "Bad Slug" }).errors.slug);
  assert.ok(validateSiteEdit({ name: "" }).errors.name);
  assert.ok(validateSiteEdit({}).errors.form);
  assert.deepEqual(validateSiteEdit({ subdomain: "my-site", slug: "my-slug" }).changes, { subdomain: "my-site", slug: "my-slug" });
});

test("edit and delete require session, same origin and membership", async () => {
  globalThis.manageFetch = () => assert.fail("Must not call the backend");
  assert.equal((await patch({ name: "A" })).status, 401);
  assert.equal((await del()).status, 401);
  authorize();
  assert.equal((await patch({ name: "A" }, "http://other")).status, 403);
  assert.equal((await del("http://other")).status, 403);
  assert.equal((await patch({})).status, 400);
  globalThis.manageTenants = [{ id: "other" }];
  assert.equal((await patch({ name: "A" })).status, 403);
  assert.equal((await del()).status, 403);
});

test("edit sends only changes and maps errors without leaking backend details", async () => {
  authorize();
  let body;
  globalThis.manageFetch = async (path, options) => { body = options.body; return new Response(null, { status: 200 }); };
  const ok = await patch({ name: "A", ignored: "x" });
  assert.deepEqual(await ok.json(), { success: true });
  assert.deepEqual(JSON.parse(body), { name: "A" });
  for (const status of [400, 403, 404, 409, 422, 429, 500]) {
    globalThis.manageFetch = async () => new Response("private", { status });
    const response = await patch({ name: "A" });
    assert.equal(response.status, status === 500 ? 502 : status);
    assert.ok(!(await response.json()).error.includes("private"));
  }
  globalThis.manageFetch = async () => { throw new Error("private"); };
  assert.equal((await patch({ name: "A" })).status, 502);
});

test("delete maps success and failures without retrying", async () => {
  authorize();
  let calls = 0;
  globalThis.manageFetch = async () => { calls++; return new Response(null, { status: 200 }); };
  assert.deepEqual(await (await del()).json(), { success: true });
  for (const status of [403, 404, 409, 500]) {
    globalThis.manageFetch = async () => new Response("private", { status });
    const response = await del();
    assert.equal(response.status, status === 500 ? 502 : status);
    assert.ok(!(await response.json()).error.includes("private"));
  }
  calls = 0;
  globalThis.manageFetch = async () => { calls++; throw new Error("private"); };
  assert.equal((await del()).status, 502);
  assert.equal(calls, 1);
});
