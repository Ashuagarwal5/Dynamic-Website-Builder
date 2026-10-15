import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import "./helpers/server-only.mjs";

const serviceUrl = new URL("../src/services/tenant.service.js", import.meta.url).href;
const routeUrl = new URL("../src/app/api/tenants/route.js", import.meta.url).href;
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (context.parentURL === routeUrl) {
      if (specifier === "../../../lib/auth") return { url: "data:text/javascript,export async function getSession() { return globalThis.tenantServiceSession; }", shortCircuit: true };
      if (specifier === "../../../services/tenant.service") return { url: serviceUrl, shortCircuit: true };
    }
    if (context.parentURL === serviceUrl) {
      if (specifier === "../lib/api") return { url: "data:text/javascript,export async function apiFetch(...args) { return globalThis.tenantServiceFetch(...args); }", shortCircuit: true };
      if (specifier === "../lib/auth") return { url: "data:text/javascript,export async function requireSession() { return globalThis.tenantServiceSession; }", shortCircuit: true };
      if (specifier === "../lib/tenant-context") return { url: new URL("../src/lib/tenant-context.js", import.meta.url).href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});
const { listTenants, createTenant, getActiveTenants, requireActiveTenant } = await import(serviceUrl);
const { POST } = await import(routeUrl);
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
