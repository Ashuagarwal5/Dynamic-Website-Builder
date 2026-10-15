import { parseSiteList } from "./site-list.js";

// Read-only requests may finish after navigation. Ignore their results rather
// than aborting browser fetches during effect cleanup or a focus refresh.
export function createSiteListLoader(tenantId, onResult, fetcher = fetch) {
  let disposed = false;
  let inFlight = null;
  function load() {
    if (disposed) return Promise.resolve();
    if (inFlight) return inFlight;
    inFlight = (async () => {
      try {
        const response = await fetcher(`/api/tenants/${encodeURIComponent(tenantId)}/sites`, { headers: { Accept: "application/json" }, cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load websites. Please try again.");
        const sites = parseSiteList(data, tenantId);
        if (!disposed) onResult({ sites, error: null });
      } catch (error) {
        if (!disposed) onResult({ sites: null, error });
      } finally {
        inFlight = null;
      }
    })();
    return inFlight;
  }
  return { load, dispose() { disposed = true; } };
}
