# Branches and tenants

Branches use only active memberships from backend GET /tenants. The table, cards, sidebar, and profile ignore local branch drafts, name overrides, deletion markers, and demo selections. Existing browser data is preserved for recovery but cannot affect branch visibility or selection. Backend branches previously hidden locally will reappear with their backend names.

Creation submits JSON { name, slug } to POST /api/tenants. The authenticated Route Handler validates input and returns safe JSON. On success the browser navigates client-side to Branches and refreshes memberships without reloading the document.

Edit/Delete are disabled in both views until backend endpoints are provided. They do not open dialogs or modify browser storage.

Switching uses the switchTenant Server Action to validate fresh memberships and save activeTenantId in the encrypted HTTP-only session. Branch selection no longer requires browser storage. Empty memberships show the empty state; failed reads do not fall back to local data.

Website listing and creation now use backend APIs only. Automatic local website migration was removed from SessionProvider. Legacy editor content remains separate until its API integration; old browser data is preserved.

Legacy branch-storage helpers remain disconnected from the active UI, with old data preserved.
