import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import "./helpers/server-only.mjs";
import { resolveActiveTenant, backendBranches } from "../src/lib/tenant-context.js";

test("backend branch listing ignores local overrides and works without browser storage", () => {
  const original = globalThis.window;
  globalThis.window = { localStorage: { getItem() { throw new Error("Blocked storage"); }, setItem() { throw new Error("Unexpected storage write"); } } };
  try {
    const tenants = [{ id: "a", name: "Backend name", isActive: true }, { id: "b", isActive: false }];
    assert.deepEqual(backendBranches(tenants), [{ ...tenants[0], kind: "backend", key: "backend:a" }]);
    assert.deepEqual(backendBranches([]), []);
    assert.equal(tenants[0].kind, undefined);
  } finally {
    if (original === undefined) delete globalThis.window;
    else globalThis.window = original;
  }
});
import {
  createBranchDraft,
  listBranchDrafts,
  validateBranchDraft,
} from "../src/lib/tenant-drafts.js";
import {
  demoSelectionKey,
  switchBackendWorkspace,
} from "../src/lib/demo-workspace.js";

const actionUrl = new URL(
  "../src/app/dashboard/tenants/actions.js",
  import.meta.url,
).href;
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (
      context.parentURL === actionUrl &&
      specifier === "../../../services/tenant.service"
    ) {
      return {
        url: "data:text/javascript,export async function getActiveTenants() { if (globalThis.tenantTestFailure) throw new Error('Unavailable'); return globalThis.tenantTestMemberships ?? globalThis.tenantTestSession.tenants; } export async function createTenant(data) { return globalThis.tenantTestCreate(data); }",
        shortCircuit: true,
      };
    }
    if (context.parentURL === actionUrl && specifier === "next/cache")
      return {
        url: "data:text/javascript,export function revalidatePath(...args) { globalThis.tenantTestRevalidated = args; }",
        shortCircuit: true,
      };
    if (context.parentURL === actionUrl && specifier === "next/navigation")
      return {
        url: "data:text/javascript,export function redirect(path) { throw new Error('REDIRECT:' + path); }",
        shortCircuit: true,
      };
    if (context.parentURL === actionUrl && specifier === "../../../lib/auth") {
      return {
        url: "data:text/javascript,export async function requireSession() { return globalThis.tenantTestSession; } export async function writeSession(session) { globalThis.tenantTestSaved = session; }",
        shortCircuit: true,
      };
    }
    return nextResolve(specifier, context);
  },
});
const { switchTenant } = await import(actionUrl);
const originalWindow = globalThis.window;
afterEach(() => {
  if (originalWindow === undefined) delete globalThis.window;
  else globalThis.window = originalWindow;
  delete globalThis.tenantTestSession;
  delete globalThis.tenantTestSaved;
  delete globalThis.tenantTestMemberships;
  delete globalThis.tenantTestFailure;
  delete globalThis.tenantTestCreate;
  delete globalThis.tenantTestRevalidated;
});

function browserStorage() {
  const data = new Map();
  globalThis.window = {
    localStorage: {
      getItem: (key) => data.get(key) ?? null,
      setItem: (key, value) => data.set(key, value),
      removeItem: (key) => data.delete(key),
    },
  };
  return data;
}
const values = {
  name: " Central Clinic ",
  city: " Jaipur ",
  address: " Main Street ",
};

test("backend switching clears the demo override before the server reload and keeps it cleared", async () => {
  const data = browserStorage();
  data.set(demoSelectionKey("user-a"), "draft-ajmer");
  data.set(demoSelectionKey("user-b"), "draft-jaipur");
  await switchBackendWorkspace("user-a", async () => {
    assert.equal(window.localStorage.getItem(demoSelectionKey("user-a")), null);
  });
  assert.equal(window.localStorage.getItem(demoSelectionKey("user-a")), null);
  assert.equal(data.get(demoSelectionKey("user-b")), "draft-jaipur");
});

test("failed backend switching preserves the previous demo selection on refresh", async () => {
  const data = browserStorage();
  data.set(demoSelectionKey("user-a"), "draft-ajmer");
  await assert.rejects(
    switchBackendWorkspace("user-a", async () => {
      throw new Error("Switch rejected");
    }),
    /Switch rejected/,
  );
  assert.equal(
    window.localStorage.getItem(demoSelectionKey("user-a")),
    "draft-ajmer",
  );
});

test("blocked storage prevents backend switching before changing the session", async () => {
  browserStorage();
  window.localStorage.removeItem = () => {
    throw new Error("Storage blocked");
  };
  let called = false;
  await assert.rejects(
    switchBackendWorkspace("user-a", async () => {
      called = true;
    }),
    /Storage blocked/,
  );
  assert.equal(called, false);
});

test("local drafts are scoped to users and cannot become backend memberships", async () => {
  browserStorage();
  const draft = await createBranchDraft("user-a", values);
  assert.equal(draft.name, "Central Clinic");
  assert.equal(draft.city, "Jaipur");
  assert.ok(draft.id.startsWith("draft-"));
  assert.deepEqual(await listBranchDrafts("user-b"), []);
  assert.deepEqual(await listBranchDrafts("user-a"), [draft]);
  assert.equal(
    resolveActiveTenant({ tenants: [], activeTenantId: draft.id }),
    null,
  );
});

test("draft validation rejects empty fields, oversized details, and duplicate locations", async () => {
  browserStorage();
  assert.ok(validateBranchDraft({ ...values, name: " " }).name);
  assert.ok(validateBranchDraft({ ...values, city: "x".repeat(101) }).city);
  assert.ok(
    validateBranchDraft({ ...values, address: "x".repeat(501) }).address,
  );
  await createBranchDraft("user-a", values);
  await assert.rejects(
    createBranchDraft("user-a", { ...values, name: "central clinic" }),
    /already exists/,
  );
  assert.equal((await listBranchDrafts("user-a")).length, 1);
});

test("unreadable drafts are preserved and failed writes are reported", async () => {
  const data = browserStorage();
  const key = "site-studio-branch-drafts:user-a";
  data.set(key, "broken JSON");
  await assert.rejects(createBranchDraft("user-a", values), /preserved/);
  assert.equal(data.get(key), "broken JSON");
  data.clear();
  globalThis.window.localStorage.setItem = () => {
    throw new Error("Storage blocked");
  };
  await assert.rejects(createBranchDraft("user-a", values), /Unable to save/);
});

test("active branches resolve only from actual memberships", () => {
  const tenants = [{ id: "a" }, { id: "b" }];
  assert.equal(
    resolveActiveTenant({ tenants, activeTenantId: "b" }),
    tenants[1],
  );
  assert.equal(
    resolveActiveTenant({ tenants, activeTenantId: "forged" }),
    tenants[0],
  );
});

test("switching rejects non-members and draft IDs without writing a session", async () => {
  globalThis.tenantTestSession = {
    tenants: [{ id: "allowed" }],
    accessToken: "private",
  };
  for (const id of ["other-tenant", "draft-local"]) {
    const form = new FormData();
    form.set("tenantId", id);
    assert.ok((await switchTenant(null, form)).error);
    assert.equal(globalThis.tenantTestSaved, undefined);
  }
});

test("authorized switching preserves the session and returns no token", async () => {
  globalThis.tenantTestSession = {
    tenants: [{ id: "allowed" }],
    accessToken: "private",
    expiresAt: 12345,
  };
  const form = new FormData();
  form.set("tenantId", "allowed");
  assert.deepEqual(await switchTenant(null, form), { error: null });
  assert.deepEqual(globalThis.tenantTestSaved, {
    ...globalThis.tenantTestSession,
    activeTenantId: "allowed",
  });
});

test("switching uses current API memberships instead of the login snapshot", async () => {
  globalThis.tenantTestSession = { tenants: [{ id: "removed" }] };
  globalThis.tenantTestMemberships = [{ id: "new" }];
  const form = new FormData();
  form.set("tenantId", "removed");
  assert.ok((await switchTenant(null, form)).error);
  assert.equal(globalThis.tenantTestSaved, undefined);
  form.set("tenantId", "new");
  assert.deepEqual(await switchTenant(null, form), { error: null });
  assert.equal(globalThis.tenantTestSaved.activeTenantId, "new");
});

test("membership request failure prevents switching without leaking upstream errors", async () => {
  globalThis.tenantTestSession = { tenants: [{ id: "allowed" }] };
  globalThis.tenantTestFailure = true;
  const form = new FormData();
  form.set("tenantId", "allowed");
  assert.deepEqual(await switchTenant(null, form), {
    error: "Unable to switch branches. Please try again.",
  });
  assert.equal(globalThis.tenantTestSaved, undefined);
});
