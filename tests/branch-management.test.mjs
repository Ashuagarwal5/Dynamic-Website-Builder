import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  listManagedBranches,
  createManagedBranch,
  updateManagedBranch,
  deleteManagedBranch,
} from "../src/lib/branch-management.js";
import { websiteScope } from "../src/lib/demo-workspace.js";

const originalWindow = globalThis.window;
afterEach(() => {
  if (originalWindow === undefined) delete globalThis.window;
  else globalThis.window = originalWindow;
});
function browser() {
  const data = new Map();
  globalThis.window = {
    localStorage: {
      getItem: (key) => data.get(key) ?? null,
      setItem: (key, value) => data.set(key, value),
    },
  };
  return data;
}
const tenants = [{ id: "pharma", name: "Test Pharma", role: "OWNER" }];
const details = {
  name: "Health Square",
  city: "Ajmer",
  address: "Main Street",
};

test("edits persist for existing and created branches without moving website data or changing memberships", async () => {
  const data = browser();
  const draft = await createManagedBranch("user-a", tenants, details);
  const key = `demo:${draft.id}`;
  const scope = websiteScope("user-a", "demo", draft.id);
  data.set(scope, '[{"website":"preserved"}]');
  await updateManagedBranch("user-a", tenants, key, {
    ...details,
    name: "Renamed",
  });
  await updateManagedBranch("user-a", tenants, "backend:pharma", {
    name: "Pharma Updated",
    city: "Jaipur",
    address: "",
  });
  const branches = await listManagedBranches("user-a", tenants);
  assert.equal(branches.find((branch) => branch.key === key).name, "Renamed");
  assert.equal(branches[0].name, "Pharma Updated");
  assert.equal(branches[0].id, "pharma");
  assert.equal(branches[0].role, "OWNER");
  assert.equal(tenants[0].name, "Test Pharma");
  assert.equal(data.get(scope), '[{"website":"preserved"}]');
  assert.equal(
    (await listManagedBranches("user-b", tenants))[0].name,
    "Test Pharma",
  );
});

test("duplicate checks use edited names and allow reuse of deleted locations", async () => {
  browser();
  const first = await createManagedBranch("user-a", tenants, details);
  await updateManagedBranch("user-a", tenants, `demo:${first.id}`, {
    ...details,
    name: "Renamed",
  });
  const second = await createManagedBranch("user-a", tenants, details);
  await assert.rejects(
    updateManagedBranch("user-a", tenants, `demo:${second.id}`, {
      ...details,
      name: "renamed",
    }),
    /already exists/,
  );
  await assert.rejects(
    createManagedBranch("user-a", tenants, { ...details, name: "RENAMED" }),
    /already exists/,
  );
  await deleteManagedBranch("user-a", tenants, `demo:${second.id}`);
  const recreated = await createManagedBranch("user-a", tenants, details);
  assert.notEqual(recreated.id, second.id);
  assert.equal((await listManagedBranches("user-a", tenants)).length, 3);
});

test("deletion persists after refresh and protects website collections and invalid data", async () => {
  const data = browser();
  const scope = websiteScope("user-a", "backend", "pharma");
  data.set(scope, '[{"published":true}]');
  await assert.rejects(
    deleteManagedBranch("user-a", tenants, "backend:pharma"),
    /websites before/,
  );
  data.set(scope, "broken JSON");
  await assert.rejects(
    deleteManagedBranch("user-a", tenants, "backend:pharma"),
    /could not be read/,
  );
  assert.equal(data.get(scope), "broken JSON");
  data.set(scope, "[]");
  await deleteManagedBranch("user-a", tenants, "backend:pharma");
  assert.deepEqual(await listManagedBranches("user-a", tenants), []);
  assert.equal((await listManagedBranches("user-b", tenants)).length, 1);
  await assert.rejects(
    updateManagedBranch("user-a", tenants, "backend:pharma", details),
    /not found/,
  );
  await assert.rejects(
    deleteManagedBranch("user-a", tenants, "backend:other"),
    /not found/,
  );
});

test("storage errors and invalid branch details preserve the previous values", async () => {
  const data = browser();
  await assert.rejects(
    updateManagedBranch("user-a", tenants, "backend:pharma", {
      ...details,
      name: " ",
    }),
    /Check/,
  );
  await updateManagedBranch("user-a", tenants, "backend:pharma", details);
  const bytes = data.get("site-studio-branch-changes:user-a");
  window.localStorage.setItem = () => {
    throw new Error("quota");
  };
  await assert.rejects(
    updateManagedBranch("user-a", tenants, "backend:pharma", {
      ...details,
      name: "New",
    }),
    /Unable to save/,
  );
  await assert.rejects(
    deleteManagedBranch("user-a", tenants, "backend:pharma"),
    /Unable to save/,
  );
  assert.equal(data.get("site-studio-branch-changes:user-a"), bytes);
  data.set("site-studio-branch-changes:user-a", "invalid JSON");
  await assert.rejects(listManagedBranches("user-a", tenants), /preserved/);
  assert.equal(data.get("site-studio-branch-changes:user-a"), "invalid JSON");
});
