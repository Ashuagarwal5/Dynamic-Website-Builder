# Registration, current user, page unpublish, and public sites

These cover the last Swagger endpoints (`/api-json`) that were not yet integrated.

## POST /auth/register

`auth.service.js#registerUser` sends `{ name, email, password }` plus `tenantName` and `tenantSlug` only when both are provided. The `/register` page (`RegisterForm`) uses the `register` Server Action in `src/app/register/actions.js`, which validates input, calls the backend without a bearer token, and maps 400/409/422/429 to safe messages.

The register response schema is not documented. If it is a login-shaped body (`accessToken`, `user`, `tenants`), the session is created from it; otherwise the action signs in with the same credentials through `POST /auth/login`. If neither works the user is sent to `/login`. Session building is shared in `src/lib/login-session.js`. The login page links to `/register`.

## GET /auth/me

`auth.service.js#getCurrentUser` is called by the profile page (server side). Only `name` and `email` are used; if the call fails the session snapshot is shown.

## POST .../pages/{pageId}/unpublish

`publishing.service.js#unpublishTenantPage` and the browser route `POST /api/tenants/{tenantId}/sites/{siteId}/pages/{pageId}/unpublish` mirror page publish (same-origin, session and fresh active-membership checks, safe errors, no retries). In the pages table, published pages show Unpublish with a confirmation dialog; success refetches the page list.

## GET /public/sites/{subdomain}

`public-site.service.js#getPublicSite` calls the endpoint without authentication. `/sites/{subdomain}` (public, not covered by the auth proxy) renders the result server-side with the site's theme. Published website cards with a `subdomain` show **View live**.

The response schema is undocumented ("website, theme, pages and sections"), so `src/lib/public-site.js` parses tolerantly: `site` or top-level fields, `theme`, `pages[].sections[]` with `type`, `sortOrder`, `isActive` and a free-form `config`. Only active sections render, ordered by `sortOrder`; `?page=<slug>` selects a page. Theme values and links are validated before use. `PublicSiteView` renders common `config` keys (heading, title, subtitle, text, image, items, buttonText/buttonLink, contact fields) for all 16 section types. Confirm real response and `config` shapes against the backend and adjust the parser and renderer accordingly.

The old local `/site/[slug]` simulation remains for the local builder.

Run `npm run test:remaining`.
