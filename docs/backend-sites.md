# Backend website listing

GET /tenants/{tenantId}/sites is integrated for Dashboard and My Websites. Browser requests use GET /api/tenants/{tenantId}/sites with readable JSON. The server keeps the bearer token private, verifies current active membership through GET /tenants, and calls the backend site-list endpoint.

The selected backend branch supplies tenantId. List responses are validated for duplicate IDs, cross-tenant records, names/slugs/status, timestamps, and nullable domains. Only documented site metadata is sent to the browser. No draft content is invented. Unknown statuses are displayed as supplied; dashboard Draft counts include only DRAFT records.

The screens fetch on mount, branch changes, and window focus. Focus refreshes share an in-flight request. Cleanup marks the loader as disposed rather than aborting fetch; late results and errors are ignored so they cannot update a different branch or trigger cleanup AbortErrors. Search, status filtering, sorting, grid/list display, and recent-site cards operate on the returned metadata. Loading, empty lists, missing branches, and retryable errors are handled without local-storage fallback.

Creation now uses POST /tenants/{tenantId}/sites through the browser JSON endpoint POST /api/tenants/{tenantId}/sites. My Websites and Dashboard offer Create Website. The form collects only name and slug, validates input, verifies current backend membership, and sends only those fields. Errors retain form input; duplicate submissions are locked. Success navigates client-side to My Websites and refreshes the list without a document reload. An uncertain network result advises checking the list before retrying; creation is never retried automatically. Editing, public viewing, duplication, deletion, and publishing remain disabled until their backend integrations are available. Existing local website data remains preserved, but Dashboard and My Websites no longer list it. The old editor/public-preview implementation remains separate pending page/section integration.

No backend payload changes are required for this GET endpoint. POST site creation is integrated with the existing name/slug payload. Automatic legacy website-storage migration was removed from SessionProvider; backend listing and creation never read/write local website collections. Legacy data is preserved. Business details/template selection need a documented storage contract before those fields can be persisted.

Validation: npm run test:sites includes website-api.test.mjs for the service transport, membership isolation, safe JSON responses, empty lists, malformed responses, upstream failures, and status preservation. Existing local website tests remain for legacy compatibility.

Settings is now enabled for read-only backend theme display through GET site theme. Theme editing remains pending PATCH integration.

## Edit and delete website

`PATCH /tenants/{tenantId}/sites/{siteId}` and `DELETE /tenants/{tenantId}/sites/{siteId}` are integrated through the browser route `/api/tenants/{tenantId}/sites/{siteId}` (same origin, session and fresh active-membership checks, safe errors, no retries). On a website card, Edit opens a dialog for name, slug and subdomain and sends only the changed fields. Delete asks the user to type the website name, then calls DELETE. Success refetches the website list.

`UpdateSiteDto` is empty in Swagger, so name, slug and subdomain are assumed. Confirm the real fields with the backend team; unsupported fields would be rejected with 400. `GET /tenants/{tenantId}/sites/{siteId}` exists in the API but is not used yet. Duplicate stays disabled until a backend endpoint exists. Run `npm run test:site-manage`.

## Create from template and the website editor

**Use template** (Templates page) opens `/dashboard/websites/new?template=business-essentials`. Submitting calls `POST /api/tenants/{t}/sites/from-template` with `{ name, slug, templateId }`. The server creates the site (`POST /sites`), a Home page (`POST /pages`, slug `home`), one section per template section (`POST /sections`, `sortOrder` = position) and the default theme (`PATCH /theme`), then returns `{ siteId, pageId, warnings }`. The browser opens the editor at `/dashboard/websites/{siteId}/edit?tenantId={t}`. If a later step fails, the website still exists and the editor explains what is missing (it can create the Home page and start from the template again).

**Editor** (`BackendSiteEditor`): left = section list (show/hide, select, add section) and Theme & colors; middle = form for the selected section (content, links, items, move up/down, remove); right = live preview using the same `WebsiteTemplate` renderer as the public page. **Save changes** sends everything in one request, `POST /api/tenants/{t}/sites/{s}/pages/{p}/content`, which deletes removed sections, creates or updates the rest in order (`sortOrder` = array index; unchanged sections are skipped) and then updates the theme. It stops at the first failure and reports what was saved; the editor then reloads from the backend. **Publish** publishes the Home page (if needed) and the website; **Unpublish** unpublishes the website. Publishing is disabled while there are unsaved changes.

### Section config shape

Editor fields map to the backend's free-form `config` in `src/lib/section-config.js`: `eyebrow`, `heading`, `subtitle` (editor "description"), `image`, `buttonText`, `buttonLink` (editor "button link"), `url`, `address`, `phone`, `email`, and `items: [{ title, description, image }]` for FEATURES, TESTIMONIALS, FAQ and GALLERY. Images are stored as URLs or small data URLs (up to 256 KB) until a media API exists. The backend and public renderer must agree on these keys.

Not covered: site-wide header/footer/logo/SEO settings (no backend API), undo/redo, drag-and-drop ordering (use Move up/down), multi-page editing (the editor edits the Home page). Run `npm run test:template-flow`.

**Editor UI update:** `/dashboard/websites/{siteId}/edit` now uses the same full-screen builder as the original editor (toolbar, section sidebar, live iframe preview, undo/redo, desktop/tablet/mobile preview), without the dashboard menu. `useBackendWebsiteEditor` replaces the browser-storage hook. Header, footer and SEO panels are hidden for backend websites because the backend has no API for them; sections and theme (colors, font, corner radius) are editable and saved.

**Header, footer and SEO (stored as a section):** the backend has no site settings API, so the editor saves the Header & Navigation (business name, logo, menu links, CTA), Footer and SEO panels in one extra `TEXT` section whose `config.role` is `SITE_SETTINGS`. It is saved last on the Home page (after the real sections) and is skipped by the editor's section list and by the public renderer. Other clients that read the sections API will see this one extra entry; ignore sections with `config.role === "SITE_SETTINGS"`. When a settings endpoint exists (`GET/PATCH /sites/{s}/settings`, see `backend-api-requests.md`), move this data there and delete the section. Sites created before this change have no settings section; the editor derives defaults and creates it on the first save.

**Public page SEO:** `/sites/{subdomain}` sets its `<title>` and meta description from the settings section's `seo.title` and `seo.description` (falling back to the website name, and omitting the description when empty). Missing or unavailable sites get a non-indexed title.

## Media upload

`POST /tenants/{tenantId}/media/upload` (multipart, one `file` field) is integrated through `media.service.js` and the browser route `POST /api/tenants/{tenantId}/media`. The route checks origin, session and active branch membership, accepts JPEG, PNG or WebP up to 5 MB (our limit; the backend documents none) with a magic-byte check, forwards the file, and returns only `{ url, id, originalName, size }`.

In the backend-backed editor, the image picker uploads the file as soon as it is chosen and the section keeps only the returned URL (no more base64 in `config`). The local (localStorage) editor still uses local data URLs. Backend response: `{ id, tenantId, uploadedById, storageKey, url, mediaType, originalName, mimeType, format, size, createdAt }`.

**Backend issue:** `url` is built from the server's local address (`http://localhost:4000/uploads/...`). The route replaces a local origin with the origin of `BASEURL`, but the backend should return its public base URL and serve `/uploads` there. Existing images that are base64 keep working; re-upload them to switch to URLs. Run `npm run test:media`.

**Media URLs (same-origin proxy):** `next.config.mjs` rewrites `/uploads/:path*` to `${BASEURL}/uploads/:path*`. The upload route saves backend-hosted files as same-origin paths (`/uploads/tenants/.../file.webp`) instead of `localhost:4000` or devtunnel URLs, so the editor, preview and public pages load images from the app's own origin. Images on other hosts (a CDN or object storage) keep their absolute URL. Restart `next dev` after changing `next.config.mjs` or `BASEURL`. This only works once the backend serves `/uploads` as static files (it returned 404 `Cannot GET /uploads/...` when checked); until then images stay unavailable. If the app and public sites are later served from different origins, switch the saved value to an absolute public URL (backend `PUBLIC_BASE_URL`).
