# Backend page listing

GET /tenants/{tenantId}/sites/{siteId}/pages is integrated. Click Pages on a backend website card to open /dashboard/websites/{siteId}/pages?tenantId={tenantId}. The existing dynamic route folder is named [slug], but this new subroute uses the backend website ID.

The browser fetches plain JSON at /api/tenants/{tenantId}/sites/{siteId}/pages. The route checks the session and current tenant membership, then calls the backend through page.service.js. The backend must enforce that siteId belongs to tenantId. Returned records are validated against the requested siteId and mapped to documented page metadata. No local-storage fallback is used.

The page list handles loading, empty arrays, errors with retry, unmount cancellation, and branch changes. A website from a different selected branch is not fetched or displayed; users return to My Websites to select a current website. Page creation is now enabled through the Create page form. Editing/publishing remain unavailable pending their own integrations.

No backend request-payload changes are needed for GET. The expected list is an array of page metadata matching the previously supplied page detail shape: id, siteId, name, slug, status, createdAt, updatedAt. Live response verification remains necessary.

Run npm run test:pages for transport, membership checks, safe response mapping, malformed/cross-site response rejection, and error handling.

POST /tenants/{tenantId}/sites/{siteId}/pages is integrated through the same browser JSON route. The form submits only name and slug, preserves values on failure, locks duplicate submissions, and refreshes GET pages in place after success without a document reload. Access, origin, content type, and input are validated server-side; backend errors become safe JSON with appropriate status codes. Ambiguous failures advise checking the page list before retrying. No local storage is used. No backend payload change is needed for basic page creation.

GET /tenants/{tenantId}/sites/{siteId}/pages/{pageId} is integrated. View details in the page table opens a details panel and fetches the selected page through the matching /api/tenants/... JSON route. It displays name, slug, status, IDs, and created/updated timestamps. The route verifies current membership, maps only documented fields, and rejects mismatched page/website IDs. Pending reads are aborted when the panel closes or changes; no local storage is used. No backend payload change is needed. Page content/sections remain a separate integration.
