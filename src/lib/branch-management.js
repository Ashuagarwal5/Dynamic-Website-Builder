import {
  listBranchDrafts,
  createBranchDraft,
  validateBranchDraft,
} from "./tenant-drafts.js";
import { websiteScope } from "./demo-workspace.js";

const keyFor = (userId) =>
  `site-studio-branch-changes:${encodeURIComponent(userId)}`;
function readChanges(userId) {
  const raw = window.localStorage.getItem(keyFor(userId));
  if (raw === null) return {};
  try {
    const changes = JSON.parse(raw);
    if (
      !changes ||
      typeof changes !== "object" ||
      Array.isArray(changes) ||
      !Object.values(changes).every(
        (change) =>
          change &&
          (change.deleted === true ||
            !Object.keys(validateBranchDraft(change)).length),
      )
    )
      throw new Error();
    return changes;
  } catch {
    throw new Error(
      "Saved branch changes could not be read. Your data has been preserved.",
    );
  }
}
function writeChanges(userId, changes) {
  try {
    window.localStorage.setItem(keyFor(userId), JSON.stringify(changes));
  } catch {
    throw new Error(
      "Unable to save branch changes. Browser storage may be full or blocked.",
    );
  }
}
export async function listManagedBranches(userId, tenants) {
  const drafts = await listBranchDrafts(userId);
  const changes = readChanges(userId);
  return [
    ...tenants.map((branch) => ({
      ...branch,
      kind: "backend",
      key: `backend:${branch.id}`,
    })),
    ...drafts.map((branch) => ({
      ...branch,
      kind: "demo",
      key: `demo:${branch.id}`,
    })),
  ]
    .filter((branch) => !changes[branch.key]?.deleted)
    .map((branch) => {
      const change = changes[branch.key];
      return change
        ? {
            ...branch,
            name: change.name,
            city: change.city,
            address: change.address,
          }
        : branch;
    });
}
function details(values, branches, excludeKey) {
  if (Object.keys(validateBranchDraft(values)).length)
    throw new Error("Check the branch details and try again.");
  const data = {
    name: values.name.trim(),
    city: values.city.trim(),
    address: values.address.trim(),
  };
  if (
    branches.some(
      (branch) =>
        branch.key !== excludeKey &&
        branch.name.toLowerCase() === data.name.toLowerCase() &&
        (branch.city || "").toLowerCase() === data.city.toLowerCase(),
    )
  )
    throw new Error("A branch with this name and city already exists.");
  return data;
}
export async function createManagedBranch(userId, tenants, values) {
  const branches = await listManagedBranches(userId, tenants);
  // Check the visible, updated names rather than the legacy source records.
  return createBranchDraft(userId, details(values, branches), {
    skipDuplicateCheck: true,
  });
}
export async function updateManagedBranch(userId, tenants, key, values) {
  const branches = await listManagedBranches(userId, tenants);
  if (!branches.some((branch) => branch.key === key))
    throw new Error("Branch not found.");
  const data = details(values, branches, key);
  const changes = readChanges(userId);
  changes[key] = data;
  writeChanges(userId, changes);
}
export async function deleteManagedBranch(userId, tenants, key) {
  const branches = await listManagedBranches(userId, tenants);
  const branch = branches.find((item) => item.key === key);
  if (!branch) throw new Error("Branch not found.");
  const raw = window.localStorage.getItem(
    websiteScope(userId, branch.kind, branch.id),
  );
  if (raw !== null) {
    let sites;
    try {
      sites = JSON.parse(raw);
    } catch {
      throw new Error(
        "Website data could not be read. This branch cannot be deleted.",
      );
    }
    if (!Array.isArray(sites))
      throw new Error(
        "Website data could not be read. This branch cannot be deleted.",
      );
    if (sites.length)
      throw new Error(
        "Delete this branch's websites before deleting the branch.",
      );
  }
  const changes = readChanges(userId);
  changes[key] = { deleted: true };
  writeChanges(userId, changes);
}
