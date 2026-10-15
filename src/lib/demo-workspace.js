export function websiteScope(userId, kind, branchId) {
  return `site-studio-sites:${encodeURIComponent(userId)}:${kind}:${encodeURIComponent(branchId)}`;
}

export function migrateLegacyWebsites(userId, tenantId) {
  if (!tenantId) return;
  const scope = websiteScope(userId, "backend", tenantId);
  const store = window.localStorage;
  // Assign old browser-wide data once. Keep its original bytes as a backup.
  const ownerKey = "site-studio-legacy-sites-owner";
  const owner = store.getItem(ownerKey);
  if (owner && owner !== scope) return;
  const legacy = store.getItem("dynamic-builder-sites-v1");
  if (store.getItem(scope) === null && legacy !== null)
    store.setItem(scope, legacy);
  store.setItem(ownerKey, scope);
}

export function demoSelectionKey(userId) {
  return `site-studio-demo-branch:${encodeURIComponent(userId)}`;
}

export async function switchBackendWorkspace(userId, switchBranch) {
  const store = window.localStorage;
  const key = demoSelectionKey(userId);
  const previous = store.getItem(key);
  // Cookie updates re-render the dashboard. Clear the demo override before
  // that response can reload the workspace from browser storage.
  store.removeItem(key);
  try {
    await switchBranch();
  } catch (error) {
    if (previous !== null) store.setItem(key, previous);
    throw error;
  }
}

export function siteViewUrl(slug, preview, scope) {
  const query = new URLSearchParams();
  if (preview) query.set("preview", "1");
  if (scope) query.set("workspace", scope);
  return `/site/${encodeURIComponent(slug)}${query.size ? `?${query}` : ""}`;
}
