# API architecture

## Current integration status

`POST /auth/login`, `GET /tenants`, `POST /tenants`, `GET /tenants/{tenantId}/sites`, and `POST /tenants/{tenantId}/sites` are integrated with the backend. The login request remains `{ email, password }`, and its response remains `{ accessToken, user, tenants }`. `/auth/register`, `/auth/me`, page unpublish and `/public/sites/{subdomain}` are now integrated; see [Registration, current user, page unpublish, and public sites](backend-account-and-public.md).

| Module | Responsibility | Status |
| --- | --- | --- |
| `src/services/auth.service.js` | Backend login and future registration | Login implemented; registration contract pending |
| `src/services/theme.service.js` | Backend theme operations | GET/PATCH site theme integrated |
| `src/services/template.service.js` | Backend template operations | Server-only integration point; contract pending |
| `src/services/website.service.js` | Backend website operations | GET/POST tenant sites integrated; editing pending |
| `src/services/publishing.service.js` | Backend publish/unpublish | Website publish/unpublish and page publish integrated |
| `src/services/media.service.js` | Backend media operations | Server-only integration point; contract pending |
| `src/services/tenant.service.js` | Authorized active tenant context and future branch APIs | GET /tenants, POST /tenants, and current membership checks implemented |

Pending modules intentionally expose no callable operations. Implementing these requires the actual paths, methods, tenant identifier placement, payloads, response schemas, and pagination/upload formats. Do not infer routes from frontend page paths or existing local service methods.

Tenant context and local draft behavior are documented in [Branches and tenants](tenants.md). Create branch sends JSON { name, slug } to POST /api/tenants. The authenticated Route Handler calls the backend and returns a JSON success envelope with known safe tenant fields when available, or a safe JSON error with an HTTP status. After success, the browser navigates to Branches with router.replace and refreshes server data with router.refresh, without reloading the document. The JSON creation request stays inspectable in DevTools. Existing local branch data is preserved but ignored by the UI; branch editing/deletion are disabled until backend endpoints arrive.

## Request flow

Login form → login Server Action → authentication service → `lib/api.js` → backend.

Services contain endpoint-specific functions, explicit HTTP methods, and payload serialization. They return the backend `Response` unchanged, so the server caller can handle its status and parse its documented body once. They do not manage cookies, redirect, or expose Server Actions. Import services directly by feature; no barrel, base service class, or generic public proxy is needed.

`lib/api.js` owns `BASEURL`, bearer authorization from the HTTP-only session, uncached requests, and the 15-second default timeout. JSON string bodies default to `application/json`. Explicit content types are preserved; `FormData` is passed through without forcing a content type, allowing fetch to set its multipart boundary.

Missing sessions produce a 401 response without contacting the backend. Backend error responses, including 401, are returned unchanged. Network failures throw. Server callers must translate errors into safe UI messages; future authenticated actions should clear rejected sessions where appropriate. No automatic mutation retries are performed.

## Server and client boundaries

Every backend service imports `server-only`. The session codec also imports `server-only` because it accesses the encryption secret. `lib/auth.js` and `lib/api.js` already have this guard.

The login action validates input, handles backend status, validates the response, writes the encrypted cookie, and redirects. Its only returned data is a safe error message. The token-bearing login service response must never be returned directly from an action or route handler to the browser. Client Components receive only explicitly selected safe data, such as the dashboard's user, tenants, and expiry.

Use Server Components for initial server-side reads and Server Actions for form mutations. Add Route Handlers when a client feature needs an HTTP interface, such as interactive listing or uploads. Authenticate and validate each entry point; enforce tenant permissions in the backend. Do not call your own Route Handler from server code when it can call the service directly.

## Gradual migration

The local `lib/site-service.js`, `lib/media-service.js`, builder hooks, and existing UI remain unchanged. These are browser storage and file-preview utilities, not backend integrations; do not move them into server-only modules.

When each backend contract arrives, add named functions to its feature module, then connect the corresponding screen through a server entry point. Adapt backend fields to the existing UI deliberately. Verify each replacement before replacing the local implementation. Publishing and media should use their own feature services while sharing the same HTTP transport.

Run `npm run test:api` for transport and authentication service checks, and `npm run test:auth` for encrypted session checks. The Node test helper replaces only the `server-only` build marker; Next.js retains the guard in the application build. API tests mock the session dependency and transport, so they do not require credentials or a reachable backend.

Website listing now uses backend JSON only; see [Backend website listing](backend-sites.md). Dashboard/My Websites no longer read local website collections. Site creation uses backend POST with name/slug; other unsupported site actions are disabled pending their own integrations.

Page listing is integrated through GET /tenants/{tenantId}/sites/{siteId}/pages and a browser JSON route. See [Backend page listing](backend-pages.md). Page creation now uses POST on the same browser JSON route with name/slug and refreshes the list in place; page editing remains separate.

Section listing is integrated via GET /tenants/{tenantId}/sites/{siteId}/pages/{pageId}/sections. The Sections action uses a browser JSON route and backend data only. See [Backend sections](backend-sections.md).

Tenant editing is integrated through PATCH /tenants/{tenantId} with { name, slug }, via browser PATCH /api/tenants/{tenantId}. Edit actions use backend data only. Tenant status changes are integrated via PATCH /tenants/{tenantId}/status; tenant deletion is integrated via DELETE /tenants/{tenantId}.

Website theme reads are integrated; Settings now displays backend theme data instead of the old local settings form. See [Backend theme](backend-theme.md).

Theme updates are integrated via PATCH /tenants/{tenantId}/sites/{siteId}/theme with the five documented fields. Settings editing uses backend data only.

Website publishing now calls the backend through a browser JSON route. See [Backend publishing](backend-publishing.md).
