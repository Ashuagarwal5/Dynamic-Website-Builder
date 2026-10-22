import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import "./helpers/server-only.mjs";

const serviceUrl = new URL("../src/services/tenant.service.js", import.meta.url).href;
const routeUrl = new URL("../src/app/api/tenants/route.js", import.meta.url).href;
const editUrl = new URL("../src/app/api/tenants/[tenantId]/route.js", import.meta.url).href;
const statusUrl = new URL("../src/app/api/tenants/[tenantId]/status/route.js", import.meta.url).href;
registerHooks({
  resolve(specifier, context, nextResolve) {
    if ([routeUrl, editUrl, statusUrl].some((url) => decodeURI(context.parentURL || "") === decodeURI(url))) {
      if (specifier.endsWith("/lib/auth")) return { url: "data:text/javascript,export async function getSession() { return globalThis.tenantServiceSession; }", shortCircuit: true };
      if (specifier.endsWith("/services/tenant.service")) return { url: serviceUrl, shortCircuit: true };
    }
    if (context.parentURL === serviceUrl) {
      if (specifier === "../lib/api") return { url: "data:text/javascript,export async function apiFetch(...args) { return globalThis.tenantServiceFetch(...args); }", shortCircuit: true };
      if (specifier === "../lib/auth") return { url: "data:text/javascript,export async function requireSession() { return globalThis.tenantServiceSession; }", shortCircuit: true };
      if (specifier === "../lib/tenant-context") return { url: new URL("../src/lib/tenant-context.js", import.meta.url).href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});
const { listTenants, createTenant, updateTenant, deleteTenant, setTenantStatus, getTenantMemberships, getActiveTenants, requireActiveTenant } = await import(serviceUrl);
const { POST } = await import(routeUrl);
const { PATCH, DELETE } = await import(editUrl);
const { PATCH: PATCH_STATUS } = await import(statusUrl);
afterEach(() => {
  delete globalThis.tenantServiceFetch;
  delete globalThis.tenantServiceSession;
});
const tenant = { id: "a", name: "Branch A", slug: "branch-a", role: "OWNER", isActive: true };
function respond(data) {
  globalThis.tenantServiceFetch = async () => Response.json(data);
}

test("tenant service uses the authenticated transport and preserves the response", async () => {
  const response = Response.json([]);
  globalThis.tenantServiceFetch = async (...args) => {
    assert.deepEqual(args, ["/tenants", { method: "GET" }]);
    return response;
  };
  assert.equal(await listTenants(), response);
});
test("membership reads exclude inactive tenants and unexpected fields", async () => {
  respond([{ ...tenant, secret: "omit", createdAt: "timestamp" }, { ...tenant, id: "inactive", isActive: false }]);
  assert.deepEqual(await getActiveTenants(), [tenant]);
  respond([]);
  assert.deepEqual(await getActiveTenants(), []);
});

test("creation sends only the documented name and slug and preserves the upstream response", async () => {
  const response = new Response(null, { status: 201 });
  globalThis.tenantServiceFetch = async (path, options) => {
    assert.equal(path, "/tenants");
    assert.equal(options.method, "POST");
    assert.deepEqual(JSON.parse(options.body), { name: "Jaipur Pharma", slug: "jaipur-pharma" });
    return response;
  };
  assert.equal(await createTenant({ name: "Jaipur Pharma", slug: "jaipur-pharma", role: "OWNER", city: "Jaipur" }), response);
});
test("malformed or duplicate memberships fail instead of using stale access", async () => {
  for (const data of [{ tenants: [] }, [null], [{ ...tenant, isActive: "true" }], [tenant, tenant]]) {
    respond(data);
    await assert.rejects(getActiveTenants(), /Unable to load branches/);
  }
  globalThis.tenantServiceFetch = async () => new Response("not JSON");
  await assert.rejects(getActiveTenants());
});
test("upstream failures preserve status for sign-in handling and do not expose bodies", async () => {
  for (const status of [401, 403, 500]) {
    globalThis.tenantServiceFetch = async () => new Response("private backend details", { status });
    await assert.rejects(getActiveTenants(), (error) => error.status === status && error.message === "Unable to load branches. Please try again.");
  }
  globalThis.tenantServiceFetch = async () => { throw new Error("Network unavailable"); };
  await assert.rejects(getActiveTenants());
});
test("active tenant resolution uses fresh memberships and handles removal and empty lists", async () => {
  globalThis.tenantServiceSession = { tenants: [{ id: "stale" }], activeTenantId: "stale" };
  respond([tenant]);
  assert.deepEqual(await requireActiveTenant(), tenant);
  respond([]);
  await assert.rejects(requireActiveTenant(), /No branch membership/);
});

function request(body, headers = {}) {
  return new Request("http://localhost:3001/api/tenants", { method: "POST", headers: { "Content-Type": "application/json", Origin: "http://localhost:3001", ...headers }, body: typeof body === "string" ? body : JSON.stringify(body) });
}
test("JSON route blocks unauthenticated, cross-origin, malformed, and invalid requests before creation", async () => {
  globalThis.tenantServiceFetch = () => assert.fail("Must not call backend");
  assert.equal((await POST(request({}))).status, 401);
  globalThis.tenantServiceSession = { accessToken: "private" };
  assert.equal((await POST(request({}, { Origin: "https://elsewhere.example" }))).status, 403);
  assert.equal((await POST(request({}, { "Content-Type": "text/plain" }))).status, 415);
  assert.equal((await POST(request("not JSON"))).status, 400);
  for (const body of [null, [], { name: " ", slug: "valid" }, { name: "Valid", slug: "UPPER CASE" }, { name: "x".repeat(121), slug: "valid" }]) {
    const response = await POST(request(body));
    assert.equal(response.status, 400);
    assert.ok((await response.json()).errors);
  }
});
test("JSON creation trims exact payload keys, returns safe fields and does not redirect", async () => {
  globalThis.tenantServiceSession = { accessToken: "private" };
  globalThis.tenantServiceFetch = async (path, options) => {
    assert.equal(path, "/tenants");
    assert.deepEqual(JSON.parse(options.body), { name: "Jaipur Pharma", slug: "jaipur-pharma" });
    return Response.json({ id: "created", name: "Jaipur Pharma", slug: "jaipur-pharma", accessToken: "secret" }, { status: 201 });
  };
  const response = await POST(request({ name: " Jaipur Pharma ", slug: " jaipur-pharma ", role: "OWNER" }));
  assert.equal(response.status, 201);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.deepEqual(await response.json(), { success: true, tenant: { id: "created", name: "Jaipur Pharma", slug: "jaipur-pharma" } });
  globalThis.tenantServiceFetch = async () => new Response(null, { status: 201 });
  assert.deepEqual(await (await POST(request({ name: "Valid", slug: "valid" }))).json(), { success: true });
});
test("JSON errors preserve expected statuses, hide backend details, and never retry creation", async () => {
  globalThis.tenantServiceSession = {};
  for (const status of [400, 401, 403, 409, 422, 429, 500]) {
    globalThis.tenantServiceFetch = async () => new Response("sensitive details", { status });
    const response = await POST(request({ name: "Valid", slug: "valid" }));
    assert.equal(response.status, status === 500 ? 502 : status);
    assert.ok(!(await response.json()).error.includes("sensitive"));
  }
  let calls = 0;
  globalThis.tenantServiceFetch = async () => { calls++; throw new Error("private network details"); };
  const response = await POST(request({ name: "Valid", slug: "valid" }));
  assert.equal(response.status, 502);
  assert.match((await response.json()).error, /Check the Branches page before retrying/);
  assert.equal(calls, 1);
});

const edit = (body, { tenantId = "a", headers = {} } = {}) => PATCH(new Request("http://localhost/api/tenants/a", { method: "PATCH", headers: { "Content-Type": "application/json", Origin: "http://localhost", ...headers }, body: typeof body === "string" ? body : JSON.stringify(body) }), { params: Promise.resolve({ tenantId }) });
test("tenant editing transport sends exact documented fields to encoded endpoint", async () => {
  const response = new Response(null, { status: 200 });
  globalThis.tenantServiceFetch = async (path, options) => {
    assert.equal(path, "/tenants/tenant%2Fa");
    assert.equal(options.method, "PATCH");
    assert.deepEqual(JSON.parse(options.body), { name: "Updated", slug: "updated" });
    return response;
  };
  assert.equal(await updateTenant("tenant/a", { name: "Updated", slug: "updated", role: "OWNER", city: "ignore" }), response);
});
test("tenant editing rejects invalid requests and stale memberships before PATCH", async () => {
  globalThis.tenantServiceFetch = async (path) => { assert.equal(path, "/tenants"); return Response.json([tenant]); };
  assert.equal((await edit({})).status, 401);
  globalThis.tenantServiceSession = {};
  assert.equal((await edit({}, { headers: { Origin: "http://other" } })).status, 403);
  assert.equal((await edit({}, { headers: { "Content-Type": "text/plain" } })).status, 415);
  assert.equal((await edit("broken" )).status, 400);
  for (const body of [null, { name: " ", slug: "valid" }, { name: "Valid", slug: "BAD" }]) assert.equal((await edit(body)).status, 400);
  assert.equal((await edit({ name: "Valid", slug: "valid" }, { tenantId: "not-member" })).status, 403);
});
test("tenant editing returns success JSON only after the backend confirms update", async () => {
  globalThis.tenantServiceSession = {};
  const mutations = [];
  globalThis.tenantServiceFetch = async (path, options) => {
    if (path === "/tenants") return Response.json([tenant]);
    mutations.push({ path, options });
    return new Response(null, { status: 200 });
  };
  const response = await edit({ name: " Updated ", slug: " updated ", role: "ADMIN", isActive: false });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { success: true });
  assert.equal(mutations.length, 1);
  assert.equal(mutations[0].path, "/tenants/a");
  assert.deepEqual(JSON.parse(mutations[0].options.body), { name: "Updated", slug: "updated" });
});
test("tenant editing preserves known failure status codes and never retries updates", async () => {
  globalThis.tenantServiceSession = {};
  for (const status of [400, 401, 403, 404, 409, 422, 429, 500]) {
    globalThis.tenantServiceFetch = async (path) => path === "/tenants" ? Response.json([tenant]) : new Response("private details", { status });
    const response = await edit({ name: "Updated", slug: "updated" });
    assert.equal(response.status, status === 500 ? 502 : status);
    assert.ok(!(await response.json()).error.includes("private"));
  }
  let calls = 0;
  globalThis.tenantServiceFetch = async (path) => { if (path === "/tenants") return Response.json([tenant]); calls++; throw new Error("private"); };
  const response = await edit({ name: "Updated", slug: "updated" });
  assert.equal(response.status, 502);
  assert.match((await response.json()).error, /Refresh branches/);
  assert.equal(calls, 1);
});

const statusRequest = (body, { tenantId = "a", headers = {} } = {}) => PATCH_STATUS(new Request("http://localhost/api/tenants/a/status", { method: "PATCH", headers: { "Content-Type": "application/json", Origin: "http://localhost", ...headers }, body: typeof body === "string" ? body : JSON.stringify(body) }), { params: Promise.resolve({ tenantId }) });
test("status transport sends only a strict boolean and encoded tenant ID", async () => {
  globalThis.tenantServiceFetch = async (path, options) => {
    assert.equal(path, "/tenants/tenant%2Fa/status");
    assert.equal(options.method, "PATCH");
    assert.deepEqual(JSON.parse(options.body), { isActive: false });
    return new Response(null, { status: 200 });
  };
  assert.equal((await setTenantStatus("tenant/a", false)).status, 200);
  assert.throws(() => setTenantStatus("a", "false"), /boolean/);
});
test("full memberships include inactive branches for management but active reads exclude them", async () => {
  const inactive = { ...tenant, id: "inactive", isActive: false };
  respond([tenant, inactive]);
  assert.deepEqual(await getTenantMemberships(), [tenant, inactive]);
  respond([tenant, inactive]);
  assert.deepEqual(await getActiveTenants(), [tenant]);
});
test("status rejects missing sessions, invalid booleans, cross-origin requests and unknown memberships", async () => {
  assert.equal((await statusRequest({ isActive: false })).status, 401);
  globalThis.tenantServiceSession = {};
  respond([tenant]);
  assert.equal((await statusRequest({}, { headers: { Origin: "http://other" } })).status, 403);
  assert.equal((await statusRequest({}, { headers: { "Content-Type": "text/plain" } })).status, 415);
  assert.equal((await statusRequest("bad json")).status, 400);
  for (const body of [null, {}, { isActive: "false" }, { isActive: 0 }]) assert.equal((await statusRequest(body)).status, 400);
  assert.equal((await statusRequest({ isActive: false }, { tenantId: "other" })).status, 403);
});
test("status supports reactivating a verified inactive member and deactivating an active one", async () => {
  globalThis.tenantServiceSession = {};
  for (const isActive of [true, false]) {
    let mutations = 0;
    globalThis.tenantServiceFetch = async (path, options) => {
      if (path === "/tenants") return Response.json([{ ...tenant, isActive: !isActive }]);
      mutations++;
      assert.equal(path, "/tenants/a/status");
      assert.deepEqual(JSON.parse(options.body), { isActive });
      return new Response(null, { status: 200 });
    };
    const response = await statusRequest({ isActive, name: "ignore", role: "ADMIN" });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { success: true });
    assert.equal(mutations, 1);
  }
});
test("status failures keep known status codes and do not retry ambiguous mutations", async () => {
  globalThis.tenantServiceSession = {};
  for (const status of [400, 401, 403, 404, 409, 422, 429, 500]) {
    globalThis.tenantServiceFetch = async (path) => path === "/tenants" ? Response.json([tenant]) : new Response("private", { status });
    const response = await statusRequest({ isActive: false });
    assert.equal(response.status, status === 500 ? 502 : status);
    assert.ok(!(await response.json()).error.includes("private"));
  }
  let calls = 0;
  globalThis.tenantServiceFetch = async (path) => { if (path === "/tenants") return Response.json([tenant]); calls++; throw new Error("private"); };
  const response = await statusRequest({ isActive: false });
  assert.equal(response.status, 502);
  assert.equal(calls, 1);
});

const remove = (tenantId = "a", origin = "http://localhost") => DELETE(new Request(`http://localhost/api/tenants/${tenantId}`, { method: "DELETE", headers: { Origin: origin, Accept: "application/json" } }), { params: Promise.resolve({ tenantId }) });
test("tenant deletion uses the encoded DELETE endpoint with no request body", async () => {
  const response = new Response(null, { status: 200 });
  globalThis.tenantServiceFetch = async (path, options) => { assert.equal(path, "/tenants/tenant%2Fa"); assert.deepEqual(options, { method: "DELETE" }); return response; };
  assert.equal(await deleteTenant("tenant/a"), response);
  assert.throws(() => deleteTenant(""), /tenant ID/);
});
test("deletion rejects anonymous, cross-origin and removed memberships before mutation", async () => {
  globalThis.tenantServiceFetch = async (path) => { assert.equal(path, "/tenants"); return Response.json([tenant]); };
  assert.equal((await remove()).status, 401);
  globalThis.tenantServiceSession = {};
  assert.equal((await remove("a", "http://other")).status, 403);
  assert.equal((await remove("not-a-member")).status, 403);
});
test("deletion accepts active or inactive verified memberships and empty success bodies", async () => {
  globalThis.tenantServiceSession = {};
  for (const isActive of [true, false]) {
    let mutations = 0;
    globalThis.tenantServiceFetch = async (path, options) => {
      if (path === "/tenants") return Response.json([{ ...tenant, isActive }]);
      mutations++;
      assert.equal(path, "/tenants/a");
      assert.deepEqual(options, { method: "DELETE" });
      return new Response(null, { status: 200 });
    };
    const response = await remove();
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("Cache-Control"), "no-store");
    assert.deepEqual(await response.json(), { success: true });
    assert.equal(mutations, 1);
  }
});
test("deletion keeps conflicts and permission errors visible and never retries ambiguous failures", async () => {
  globalThis.tenantServiceSession = {};
  for (const status of [400, 401, 403, 404, 409, 422, 429, 500]) {
    globalThis.tenantServiceFetch = async (path) => path === "/tenants" ? Response.json([tenant]) : new Response("private backend details", { status });
    const response = await remove();
    assert.equal(response.status, status === 500 ? 502 : status);
    assert.ok(!(await response.json()).error.includes("private"));
  }
  let calls = 0;
  globalThis.tenantServiceFetch = async (path) => { if (path === "/tenants") return Response.json([tenant]); calls++; throw new Error("private"); };
  const response = await remove();
  assert.equal(response.status, 502);
  assert.match((await response.json()).error, /Refresh branches/);
  assert.equal(calls, 1);
});
