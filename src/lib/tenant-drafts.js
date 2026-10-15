// Browser-only planning data. These IDs never represent API tenant memberships.
const keyFor = (userId) => {
  if (typeof userId !== "string" || !userId)
    throw new Error("Sign in to manage branches.");
  return `site-studio-branch-drafts:${encodeURIComponent(userId)}`;
};

export function validateBranchDraft(values) {
  const errors = {};
  for (const [field, label, limit] of [
    ["name", "Branch name", 120],
    ["city", "City", 100],
  ]) {
    if (
      typeof values[field] !== "string" ||
      !values[field].trim() ||
      values[field].trim().length > limit
    ) {
      errors[field] =
        `${label} is required and must be at most ${limit} characters.`;
    }
  }
  if (typeof values.address !== "string" || values.address.trim().length > 500)
    errors.address = "Address must be at most 500 characters.";
  return errors;
}

function storage() {
  if (typeof window === "undefined")
    throw new Error("Branch drafts are available in your browser.");
  return window.localStorage;
}

export async function listBranchDrafts(userId) {
  const raw = storage().getItem(keyFor(userId));
  if (raw === null) return [];
  try {
    const drafts = JSON.parse(raw);
    if (
      !Array.isArray(drafts) ||
      !drafts.every(
        (draft) =>
          draft &&
          typeof draft.id === "string" &&
          draft.id.startsWith("draft-") &&
          typeof draft.createdAt === "string" &&
          !Object.keys(validateBranchDraft(draft)).length,
      )
    )
      throw new Error();
    return drafts;
  } catch {
    throw new Error(
      "Saved branches could not be read. Your saved data has been preserved.",
    );
  }
}

export async function createBranchDraft(
  userId,
  values,
  { skipDuplicateCheck = false } = {},
) {
  const errors = validateBranchDraft(values);
  if (Object.keys(errors).length)
    throw new Error("Check the branch details and try again.");
  const drafts = await listBranchDrafts(userId);
  const data = {
    name: values.name.trim(),
    city: values.city.trim(),
    address: values.address.trim(),
  };
  if (
    !skipDuplicateCheck &&
    drafts.some(
      (draft) =>
        draft.name.toLowerCase() === data.name.toLowerCase() &&
        draft.city.toLowerCase() === data.city.toLowerCase(),
    )
  )
    throw new Error("A branch with this name and city already exists.");
  const draft = {
    ...data,
    id: `draft-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`}`,
    createdAt: new Date().toISOString(),
  };
  try {
    storage().setItem(keyFor(userId), JSON.stringify([...drafts, draft]));
  } catch {
    throw new Error(
      "Unable to save the branch. Browser storage may be full or blocked.",
    );
  }
  return draft;
}
