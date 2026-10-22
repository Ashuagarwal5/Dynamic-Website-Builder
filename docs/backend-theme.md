# Backend website theme

GET /tenants/{tenantId}/sites/{siteId}/theme is integrated. Settings on a backend website card opens Theme & branding at /dashboard/websites/{siteId}/settings?tenantId={tenantId}. This route now uses backend IDs and no longer mounts the local-storage settings form.

The browser fetches JSON through /api/tenants/{tenantId}/sites/{siteId}/theme. The route verifies the session and fresh active membership, calls theme.service.js, validates the supplied theme fields, and maps only primaryColor, secondaryColor, accentColor, fontFamily, and borderRadius. Optional backend siteId metadata must match the requested website. Invalid data is an error rather than a fabricated default. A null successful response displays no saved theme; 404 remains a website/theme-not-found error because its meaning is not more specific in the supplied contract.

The view displays color swatches, font family, and radius with loading, retry, and branch mismatch handling. Cleanup ignores late responses rather than aborting fetch. No local storage is read or written. No backend payload changes are required for the supplied response. PATCH theme is integrated below.

Run npm run test:theme for transport, access checks, mapping, invalid/cross-site response rejection, null themes, and backend failures.

PATCH /tenants/{tenantId}/sites/{siteId}/theme is integrated via the same /api JSON route. Settings now has an edit form prefilled from saved backend values; a null theme offers a blank creation form because the supplied PATCH contract supports create/update. The form submits only primaryColor, secondaryColor, accentColor, fontFamily, and borderRadius. Shared client/server validation returns field-level errors. Success refetches GET theme in place without local storage or a document reload; failures preserve input. Reset changes restores the initial saved values. Duplicate submissions are locked and ambiguous failures are not retried automatically. No backend payload changes are needed for the supplied contract. This integration does not establish whether theme edits require publishing before becoming public.
