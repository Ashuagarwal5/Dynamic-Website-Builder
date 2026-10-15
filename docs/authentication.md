# Authentication setup

The local `.env.local` contains `BASEURL` and a generated `AUTH_SESSION_SECRET`. Keep both server-side. For another environment, copy `.env.example` to `.env.local` and generate a unique secret using the command in that file. Restart Next.js after editing environment variables. Production must use HTTPS; production cookies are Secure.

`/login` posts email and password to `POST /auth/login` using a Server Action. It accepts the documented `{ accessToken, user, tenants }` response. The access token, user, and tenant memberships are encrypted into an authenticated HTTP-only cookie. The browser receives only user details, tenant memberships, and the expiry through the dashboard provider. Tokens and passwords are never saved in localStorage.

Dashboard and builder-preview routes require an unexpired session. Dashboard rendering checks the session again. Sessions expire at the JWT `exp`, capped at 24 hours. Sign out clears the cookie. No refresh or backend revocation endpoint was supplied, so expiration requires another login and sign out is local. Rotating the secret invalidates existing sessions.

For subsequent integrations, add endpoint-specific functions under `src/services/` that call `apiFetch('/endpoint', options)`. Use those services from server code. The shared transport attaches `Authorization: Bearer` using the session, disables caching, and applies a 15-second timeout. Always enforce session and tenant permissions in each future mutation/API handler and handle upstream 401 responses. The backend remains responsible for verifying token signatures, revocation, and tenant authorization. Current website CRUD still uses the existing mock services. See [API architecture](api-architecture.md) for migration boundaries and pending contracts.

Run authentication checks with `node --test tests/auth.test.mjs`.
