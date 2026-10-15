# PROJECT_CONTEXT.md

> Repository handover for `dynamic-website-builder`.
> Inspected on 2026-10-08 at `C:\Ashu\projects\Meditix\dynamic-website-builder`.
> This describes actual source files, not just the original roadmap. Reinspect the repository before changes because this snapshot can become stale.

## 1. Project objective and implementation status

Build a Dynamic Website Builder SaaS in which customers manage websites from a dashboard and customize one reusable business website template. The intended product is multi-tenant, but the current implementation is a frontend mock workspace. It has no tenant accounts, authentication, authorization, database or backend API. Website records live in the current browser's localStorage.

Editable content includes business identity, logo, colors, navigation, hero, about, services, testimonials, contact, footer and SEO fields. Later backend integration should use the existing asynchronous service boundary.

| Area                            | Actual repository status                                                                                                                                                                                               |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Phase 1: Admin Dashboard        | Implemented; service regression checks and production build have passed.                                                                                                                                               |
| Phase 2: Website Management     | Implemented: creation, settings, slug changes, duplication, deletion, filters and persistence.                                                                                                                         |
| Phase 3: Visual Website Builder | Already implemented beyond planning: dedicated workspace, section forms, unsaved live preview, device viewports, images, history, save and local publish. Browser interaction/visual acceptance checks remain pending. |
| Recent UI fixes                 | Present: iframe-only section scrolling, fixed builder workspace, borderless builder fields, no blue field focus outlines anywhere, sticky admin navbar and Tailwind utility styling.                                   |
| Phase 4                         | Not implemented. No approved specification is stored here. Do not start it automatically.                                                                                                                              |

Do not describe Phase 3 as only planned or recreate the existing editor. Equally, do not call it fully browser-verified: automated checks do not establish every visual acceptance criterion.

## 2. Technology stack and local setup

| Item                 | Actual version / implementation                                                                        |
| -------------------- | ------------------------------------------------------------------------------------------------------ |
| Next.js              | `16.4.0`, App Router                                                                                   |
| React / React DOM    | `19.3.0`                                                                                               |
| Language             | JavaScript / JSX; no TypeScript application source                                                     |
| Tailwind CSS         | `^4`, through `@tailwindcss/turbopack`                                                                 |
| Icons                | `lucide-react`, `^1.53.0`                                                                              |
| State                | Native React hooks/reducer; no Redux or large UI framework                                             |
| Persistence          | JSON collection in browser localStorage through `site-service.js`                                      |
| Tests                | Node built-in test runner; shared-renderer tests use installed Next SWC and React DOM server rendering |
| Lint                 | ESLint 9 / `eslint-config-next` 16.4.0                                                                 |
| Package manager      | npm / `package-lock.json`                                                                              |
| Inspected local Node | `v24.16.0`; local runtime, not a declared engines requirement                                          |

Commands:

```sh
npm ci
npm run dev
npm run dev -- --port 3001
npm run lint -- src tests
npm run test:sites
npm run test:builder
npm run build
npm run start -- --port 3001
```

Use `npm ci` to install locked dependencies when needed. Development defaults to port 3000; 3001 has been used here. Avoid occupied ports and do not stop unrelated servers.

`next.config.mjs` enables `cacheComponents` and `partialPrefetching`, configures the Tailwind Turbopack CSS loader, and permits development origin `192.168.1.39`. That LAN address is environment-specific. Do not replace working CSS integration with generic PostCSS configuration without a reason.

`jsconfig.json` maps `@/*` to `./src/*`. No API credentials/environment variables are currently required. There is no `src/app/api` directory.

Read root `AGENTS.md`: it requires the relevant installed documentation in `node_modules/next/dist/docs/` before writing Next.js code. Useful guides include:

- `01-app/01-getting-started/03-layouts-and-pages.md`
- `01-app/01-getting-started/11-css.md`
- `01-app/03-api-reference/01-directives/use-client.md`

`README.md` is mostly create-next-app starter content. Its generic route/font instructions do not accurately describe the current JSX routes and Arial-based defaults. Prefer inspected source and this handover.

## 3. Complete project-owned folder structure

All inspected project-owned files are listed below. Generated, dependency and version-control directories are shown but not expanded; their internals are not application architecture.

```text
dynamic-website-builder/
|-- .git/                                  # Git metadata
|-- .next/                                 # Generated Next output; ignored
|-- node_modules/                          # Dependencies and bundled Next docs; ignored
|-- .gitignore
|-- AGENTS.md
|-- PROJECT_CONTEXT.md
|-- README.md
|-- eslint.config.mjs
|-- jsconfig.json
|-- next.config.mjs
|-- package.json
|-- package-lock.json
|-- docs/
|   |-- phase-2-website-management.md
|   `-- phase-3-builder.md
|-- public/
|   |-- file.svg
|   |-- globe.svg
|   |-- next.svg
|   |-- vercel.svg
|   `-- window.svg
|-- src/
|   |-- app/
|   |   |-- globals.css                     # Only Tailwind import
|   |   |-- layout.jsx                      # Metadata and global Tailwind utilities
|   |   |-- not-found.jsx
|   |   |-- page.jsx                        # Redirect / -> /dashboard
|   |   |-- builder-preview/
|   |   |   `-- [slug]/
|   |   |       `-- page.jsx                # Isolated iframe preview; noindex
|   |   |-- dashboard/
|   |   |   |-- layout.jsx                  # Suspense + DashboardFrame
|   |   |   |-- loading.jsx
|   |   |   |-- page.jsx                    # Overview
|   |   |   |-- sites/
|   |   |   |   `-- [slug]/
|   |   |   |       `-- page.jsx            # BuilderWorkspace
|   |   |   `-- websites/
|   |   |       |-- page.jsx                # Management
|   |   |       |-- new/
|   |   |       |   `-- page.jsx            # Creation wizard
|   |   |       `-- [slug]/
|   |   |           `-- settings/
|   |   |               `-- page.jsx        # Settings
|   |   `-- site/
|   |       `-- [slug]/
|   |           `-- page.jsx                # Public snapshot / saved draft preview
|   |-- components/
|   |   |-- WebsiteTemplate.jsx             # Canonical shared renderer
|   |   |-- admin/
|   |   |   |-- AdminShell.jsx              # Sidebar, sticky navbar, search
|   |   |   |-- DashboardFrame.jsx          # Omits admin shell for builder
|   |   |   |-- States.jsx                  # Loading/empty/not-found states
|   |   |   |-- WebsiteCard.jsx             # Shared grid/list card
|   |   |   |-- WebsitesView.jsx            # Overview/list data and actions
|   |   |   `-- navigation.js               # Central navigation/breadcrumb labels
|   |   |-- websites/
|   |   |   |-- CreateWebsiteWizard.jsx
|   |   |   |-- DeleteWebsiteDialog.jsx
|   |   |   |-- ServiceError.jsx            # Retry / corruption backup download
|   |   |   |-- StatusBadge.jsx
|   |   |   |-- WebsiteDetailsFields.jsx
|   |   |   |-- WebsiteFilters.jsx
|   |   |   `-- WebsiteSettingsForm.jsx
|   |   `-- builder/
|   |       |-- BuilderDialog.jsx
|   |       |-- BuilderSidebar.jsx
|   |       |-- BuilderToolbar.jsx
|   |       |-- BuilderWorkspace.jsx
|   |       |-- PreviewCanvas.jsx           # Iframe parent, sizing, synchronization
|   |       |-- PreviewDocument.jsx         # Iframe child and shared renderer
|   |       |-- SectionEditor.jsx           # Nine controlled section forms
|   |       |-- ViewportSwitcher.jsx
|   |       `-- fields/
|   |           |-- EditorField.jsx         # EditorField / ColorField
|   |           `-- ImagePicker.jsx         # ImagePicker / ImagePreview
|   |-- hooks/
|   |   `-- useWebsiteEditor.js
|   `-- lib/
|       |-- builder-sections.js             # Sections, devices, protocol
|       |-- editor-state.js                 # Immutable updates / history
|       |-- media-service.js                # Image validation / reading
|       |-- mock-sites.js                   # Seed content only
|       |-- site-service.js                 # Storage and future API boundary
|       `-- site-validation.js              # Validation / normalization / sort
`-- tests/
    |-- builder.test.mjs
    `-- site-service.test.mjs
```

There are no separate section-editor modules, builder stylesheet, backend routes, ORM models or media database. The actual `SectionEditor.jsx` supplies all section forms; suggested filenames from older plans do not imply those files exist.

## 4. Implemented features and routes

| Route                                 | Actual behavior                                                                                                                                                      |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                                   | Redirect to `/dashboard`.                                                                                                                                            |
| `/dashboard`                          | Service-derived total/published/unpublished counts and three most recently updated websites.                                                                         |
| `/dashboard/websites`                 | Grid/list management, search (`?q=`), status filters, sorting and card actions.                                                                                      |
| `/dashboard/websites/new`             | Business Information -> Business Template -> Review and Create wizard.                                                                                               |
| `/dashboard/websites/[slug]/settings` | Display/business name, industry, slug and draft SEO editing; deletion. `?saved=1` supports successful slug-change feedback.                                          |
| `/dashboard/sites/[slug]`             | Dedicated visual builder.                                                                                                                                            |
| `/site/[slug]`                        | Locally published `live` snapshot after hydration; unavailable UI for missing/unpublished sites.                                                                     |
| `/site/[slug]?preview=1`              | Saved draft preview with banner and editor link; excludes unsaved working edits.                                                                                     |
| `/builder-preview/[slug]?session=...` | Internal iframe for unsaved working content; no service lookup or temporary storage. Direct visits wait for parent data; robots index/follow false and nocache true. |

`not-found.jsx` is the Next fallback, not a navigation destination. Missing site states are client-rendered after lookup; do not assume a server HTTP 404. The public website is a browser-local simulation, not a deployment visible on other devices.

### Phase 1

- Site Studio brand; centralized admin navigation.
- Persistent desktop sidebar and mobile slide-out with Escape/focus management and inert background.
- Sticky navbar, breadcrumbs, sidebar toggle and functional search navigation; notification/profile placeholders.
- Templates, Media Library and workspace Settings are visibly Coming soon with no fake routes.
- Counts derive from `listSites()`. Draft count means unpublished records, not pending edits on published sites.
- Loading skeletons, empty/filtered-empty, recoverable error and unavailable states.

### Phase 2

- Case-insensitive search over display name, draft business name and slug.
- All/Published/Draft filters; recent/oldest/alphabetical sorting with deterministic name/ID ties.
- Responsive grid/list cards: names, slug, status, timestamps and draft-derived thumbnail when available.
- Edit opens builder. View opens published website or saved draft preview depending on status.
- Wizard requires business/display names and slug, optionally industry. Slug follows display name until manually edited. Step navigation retains form state; full reload does not.
- One usable Business Template (`business-v1`); illustration reuses `WebsiteTemplate`. No switching system.
- Creation generates a fresh ID, ISO timestamps, complete base content, `published: false`, `live: null`, then opens builder; duplicate submission guarded.
- Settings updates metadata plus draft business name/SEO, preserving live content/published status. Slug changes preserve ID/content and navigate to the updated URL.
- Slug changes immediately change local route lookups, including public URLs. Old slug redirects/custom domains do not exist.
- Duplicate deep-copies the editable draft into an independent unpublished record with fresh ID/timestamps, unique `-copy` slug and `Copy of ...` name, then opens builder.
- Delete uses a native named confirmation with a browser-data warning. List deletion refreshes records; settings deletion returns to My Websites. Cancel does not mutate data.

## 5. Mock data architecture and service functions

### Seeds, persistence and origin boundaries

`mock-sites.js` exports `mockSites` and `initialSites`:

| Seed ID  | Slug         | Name       | Initial status |
| -------- | ------------ | ---------- | -------------- |
| `site_1` | `abc-dental` | ABC Dental | Published      |
| `site_2` | `xyz-clinic` | XYZ Clinic | Published      |

`initialSites` adds an independent JSON clone of each draft as `live`. Samples omit timestamps: do not invent historical update dates. Actual browser records can have different content/names/statuses, additional sites or an empty collection.

All collection storage access is centralized in `src/lib/site-service.js`. The versioned localStorage key is:

```text
dynamic-builder-sites-v1
```

Its JSON value is the entire array of site records, not a wrapper object. Preserve this key/format unless implementing an explicit, tested, data-preserving migration.

- Seed only when `getItem()` returns null. A saved empty array remains empty after deleting all sites.
- Reads never silently overwrite populated or malformed data. Invalid JSON, duplicate IDs/slugs and incompatible required content produce `CORRUPT_STORAGE`, leaving raw saved data untouched.
- `ServiceError` offers raw-data backup download and Retry for corrupt storage. Repair/import/reset UI does not exist.
- Legacy `industry` and `templateId` defaults are added in memory; old timestamps are not invented and reads do not rewrite storage.
- JSON cloning/serialization isolates returned and duplicated nested objects.
- Mutations are serialized through a Promise queue in the current JavaScript context and write the whole collection. Reads await queued mutations. This is not cross-tab/backend concurrency control.
- Failed writes report controlled errors and do not replace the prior saved string.
- Browser-only storage access happens after hydration or in user-triggered mutations, never during server rendering.
- Data is scoped to profile AND exact origin: scheme/host/port. `localhost:3001`, `localhost:3000` and `192.168.1.39:3001` have separate collections. Changing origin can appear to lose sites without deleting anything.

### Canonical data contract

Keep the actual field names `draft` and `live`; do not introduce incompatible `draftContent`/`publishedContent` replacements.

```js
{
  id: "stable record ID",
  name: "Website display name",       // different from draft.businessName
  slug: "lowercase-kebab-case",
  industry: "Clinic",                // legacy optional; default ""
  templateId: "business-v1",          // legacy optional; supplied in memory
  published: false,
  createdAt: "ISO timestamp",         // legacy samples may omit
  updatedAt: "ISO timestamp",         // legacy samples may omit
  draft: {
    businessName: "Business name",
    logo: "",                        // remote/public image path or limited data URL
    phone: "",                       // root header/fallback phone
    email: "",                       // preserved business email
    theme: { primary: "#0987F5", secondary: "#06325E", background: "#ffffff", font: "sans" },
    hero: { eyebrow: "", heading: "", description: "", buttonText: "", buttonUrl: "#contact", image: "" },
    about: { heading: "", description: "", image: "" },
    services: [{ id: "stable item ID", title: "", description: "", image: "" }],
    testimonials: [{ id: "stable item ID", name: "", quote: "", role: "", avatar: "" }],
    contact: { address: "", phone: "", email: "", instagram: "", facebook: "", heading: "Contact Us", description: "", whatsapp: "" },
    seo: { title: "", description: "" },
    header: { links: [{ id: "nav-about", label: "About", url: "#about" }], ctaLabel: "", ctaUrl: "" },
    sectionMeta: { servicesHeading: "Our Services", servicesDescription: "", testimonialsHeading: "What Our Clients Say" },
    footer: { text: "" }
  },
  live: null                         // when published, a separate content snapshot
}
```

This combines base fields and optional Phase 3 extensions. `createDefaultContent()` creates complete base content. `normalizeContent()` supplies optional header/sectionMeta/contact/footer/theme defaults in editor memory without mutating or automatically rewriting saved records. Optional service images and testimonial roles/avatars are preserved. The template has compatible legacy fallbacks. Nested edits must preserve unrelated fields.

### Service exports

All async functions return Promises. `getSite()` returns null for missing sites; mutations requiring a slug throw `NOT_FOUND`.

| Function                               | Inputs and behavior                                                                                                            |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `listSites()`                          | Cloned record array; UI sorting is separate.                                                                                   |
| `getSite(slug)`                        | Cloned record or null.                                                                                                         |
| `isSlugAvailable(slug, excludeSiteId)` | Boolean; false for invalid, reserved or unavailable slugs.                                                                     |
| `createSite(payload)`                  | `name`, `businessName`, `slug`, optional `industry`/`templateId`; returns new Draft.                                           |
| `updateSiteSettings(slug, payload)`    | Merges existing details with `name`, `businessName`, `industry`, `slug`, `seoTitle`, `seoDescription`; returns updated record. |
| `duplicateSite(slug)`                  | Independent unpublished copy of editable draft.                                                                                |
| `deleteSite(slug)`                     | Removes matching record, returns `{ id, slug }`.                                                                               |
| `saveDraft(slug, content)`             | Validates shape/content, clones into draft, updates timestamp, preserves live/published; returns record.                       |
| `publishSite(slug)`                    | Clones persisted draft into live, sets published true, updates timestamp; returns record.                                      |
| `exportSavedSites()`                   | Raw JSON string, including malformed data for backup; `"[]"` if absent.                                                        |
| `createLocalId()`                      | Synchronous UUID when supported, otherwise timestamp/random fallback.                                                          |
| `createDefaultContent(businessName)`   | Synchronous base content object for creation/template preview.                                                                 |
| `SiteServiceError`                     | Error class with `code`, `message`, optional field errors.                                                                     |

Controlled codes include CLIENT_ONLY, STORAGE_UNAVAILABLE, STORAGE_READ, STORAGE_WRITE, SERIALIZATION, CORRUPT_STORAGE, VALIDATION and NOT_FOUND.

### Validation and helper exports

`site-validation.js` exports `TEMPLATE_ID`, `industries`, `slugify`, `slugError`, `validateDetails`, `sortSites`, `defaultNavigation`, `normalizeContent`, `validLink`, `safeLink`, `validateContent`.

- Slugs: 3-60 chars; lowercase letters/numbers and single separating hyphens. No leading/trailing hyphen, duplicate slug or reserved word. Settings uniqueness excludes the current stable site ID.
- Required display/business names: trimmed, maximum 120 chars. Industries: Dental, Clinic, Agency, Restaurant, Real Estate, Other.
- SEO title: max 160; description: max 500. Length guidance is not a score or ranking guarantee.
- Colors: six-digit hex. Fonts: system/sans/serif.
- Services and testimonials: max 30 each. Header links: max 8. Items have stable unique IDs; required repeatable text cannot be empty.
- Links permit supported HTTP(S), mailto, tel, local paths and section anchors. Images permit HTTP(S), local paths and limited JPEG/PNG/WebP data URLs. Unsafe schemes, persistent blob URLs, SVG data URLs and control-character inputs are rejected.
- Whole serialized draft: max 1,400,000 characters. Individual image data URL: max 360,000 characters. The full collection can still hit browser quota, especially with draft/live copies and duplicates.

## 6. Current Phase 3 implementation

### Workspace and section editors

`DashboardFrame` omits `AdminShell` for `/dashboard/sites/[slug]` only; other dashboard routes retain it. `BuilderWorkspace` is fixed to the viewport. Toolbar stays visible while sidebar/iframe scroll independently. Below Tailwind `lg`, Edit content / Live preview tabs hide panels without unmounting the iframe. Sidebar collapse and switching sections retain working edits.

Stable section IDs are `header`, `hero`, `about`, `services`, `testimonials`, `contact`, `footer`, `theme`, `seo`.

| Section      | Implemented editing                                                                                                        |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| Header       | Business name/logo, repeatable navigation label/URL, CTA label/link, restore defaults.                                     |
| Hero         | Eyebrow, heading, description, button text/link, image.                                                                    |
| About        | Heading, description, image.                                                                                               |
| Services     | Heading/description and repeatable title/description/image; add/remove with undo.                                          |
| Testimonials | Heading and repeatable name/role/quote/avatar; add/remove with undo.                                                       |
| Contact      | Heading/description, address, contact/root phone/email, WhatsApp, Instagram, Facebook.                                     |
| Footer       | Text with shared business-name/year fallback. No independent arbitrary footer navigation.                                  |
| Theme        | Identity/logo, primary/secondary/background colors, system/Arial/Georgia fonts, undoable reset.                            |
| SEO          | Draft title/description, length guidance and illustrative search result; server-rendered per-site SEO remains Coming Soon. |

Overall layout order is fixed. No section add/remove/reorder or drag-and-drop. Repeatable list items are content, not arbitrary page blocks.

### Editor state and navigation

`useWebsiteEditor(slug)` calls `getSite()` after hydration. It manages loading/error/site state, normalized working draft, saved baseline, section/device, validation/status, busy lock and pending image reads.

`editor-state.js` uses immutable JSON-safe deep updates and blocks prototype-related path keys. LOAD/CHANGE/UNDO/REDO/SAVED/DISCARD actions retain up to 20 past changes and group typing in the same field within 800 ms. Successful save updates the baseline; undo can still restore earlier local content, but persisting it requires explicit save.

- Dirty state compares working draft with saved baseline; no autosave or keystroke persistence.
- Discard restores latest successful draft save, not live published content.
- Keyed components reset state when changing slug.
- Builder Back/Website settings exits warn about unsaved work. `beforeunload` warns for dirty work/pending media on reload/close where supported.
- Browser history and all possible Next client navigations are not universally intercepted.
- Pending media disables saving/conflicting form actions; busy locks guard repeated saves/publishes.

### Isolated live preview

One `WebsiteTemplate.jsx` serves public rendering, wizard illustration and iframe preview. Do not create an unrelated second renderer.

`PreviewCanvas` embeds same-origin `/builder-preview/[slug]?session=...`. Actual iframe viewport widths: Desktop 1440px, Tablet 768px, Mobile 390px. ResizeObserver measures available canvas space; visual scaling fits the iframe while preserving actual media-query width. Merely constraining a div does not provide this behavior.

Unsaved content is transferred with postMessage, not temporary localStorage:

```js
{
  channel: "website-builder-preview",
  version: 1,
  type: "READY" | "SYNC" | "SELECT",
  slug,
  session,
  // SYNC also carries content and section; SELECT carries section.
}
```

Both ends validate exact origin, source window, channel/version, slug and nonempty per-workspace session. Child sends READY until synchronized. Parent resends after preview reloads. SYNC updates do not reload on each keystroke. Connection failure has a retry state.

Template data attributes provide editor-only section highlighting. Preview clicks send SELECT; navigation links are suppressed in the canvas. Theme/SEO are settings with no rendered scroll target.

A prior bug used `scrollIntoView()`, which could scroll iframe ancestors and move the outer page. Child now calculates section position and calls its own `window.scrollTo()`, while the builder stays fixed. Preserve this isolation.

Protocol checks are not tenant authorization. There is no auth system yet.

### Draft, preview and publish behavior

1. Working edits live in React memory and immediately update the canvas.
2. Save Draft validates and awaits `saveDraft(slug, draft)`. Saved baseline updates only after success. Published content is unchanged.
3. Saved preview opens `/site/[slug]?preview=1` in a new tab, explicitly showing saved draft content only.
4. Publish asks for confirmation, validates/saves the working draft, then awaits `publishSite(slug)` so the public snapshot matches the save.
5. Saving failure retains working edits. Publish failure after a successful save leaves that saved draft intact and the older live snapshot unchanged.
6. Normal `/site/[slug]` only renders live when published; new Draft sites do not expose their draft through the public URL.

`publishSite()` itself clones the stored draft. The builder supplies full validation through its preceding save; preserve that order or strengthen service validation with tests if adding other publishing callers.

### Frontend media

`media-service.js` exports `MAX_IMAGE_BYTES` (256 \* 1024), `validateImageFile(file)` and async `readLocalImage(file)`. File selection checks nonzero size, JPEG/PNG/WebP MIME, matching file signatures and actual browser image decoding. FileReader creates a data URL.

`ImagePicker` supports select/replace/remove, selected image preview, remote/public path input, reading/error states and async cancellation guards. Images persist inside site JSON only when saved. No persistent blob URLs, IndexedDB, cloud uploads or separate asset records exist. Existing remote/public images remain supported. Inline images need no separate orphan cleanup. Recovery-download blob URLs are temporary/revoked and are not image persistence.

## 7. Important implementation and design decisions

- Preserve JavaScript/JSX, routes, examples, working features and service interfaces. Do not reinitialize the project or migrate to TypeScript.
- Light SaaS palette: navy `#06325E`, blue `#0987F5`, soft background `#F5FAFF`. Seed websites retain their individual themes.
- All custom stylesheet selectors/@apply component classes were converted to Tailwind utilities in JSX. `globals.css` contains only `@import "tailwindcss";`.
- Do not reintroduce old `admin-primary`, `admin-secondary`, `admin-icon` or builder CSS classes; components now use utilities directly.
- Root Tailwind arbitrary variants implement global field focus and thin scrollbars. Admin/builder wrappers retain keyboard focus for buttons/links.
- Explicit user preference: no blue focus outline on ANY input, textarea or select, including both search bars, wizard, settings and builder. Fields use a subtle background highlight. Builder fields also have no border. Editor section highlighting and button/link focus are separate behaviors.
- Admin navbar uses `sticky top-0 z-20`; desktop sidebar/mobile overlays remain above it.
- Runtime inline styles remain for user-selected website colors/fonts and calculated iframe dimensions/scale. Static layout styles use Tailwind. Do not interpolate arbitrary runtime class names that Tailwind cannot discover at build time.
- Browser APIs execute in client effects/user callbacks. Preserve Suspense around pathname/search-parameter consumers as required by the installed Next configuration.
- Plain JSON cloning avoids reliance on structuredClone on insecure LAN origins; local UUID generation also has a fallback.
- User-selected remote/data images use native `<img>` with documented lint exceptions. A fixed remote-host allowlist would break arbitrary user images.
- Do not imply real auth, traffic, notifications, domains, uploads or deployment in mock UI.
- There is no automatic migration to new content keys. Opening legacy records adds optional defaults in memory; save persists the edited draft without rewriting live content.

## 8. Verification, remaining features and pending issues

### Verification already performed

The latest implementation verification before this documentation-only task reported:

| Check                             | Recorded result                                                                                                                              |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run build`                   | Passed; existing routes and builder-preview compiled.                                                                                        |
| `npm run lint -- src tests`       | Passed.                                                                                                                                      |
| `npm run test:sites`              | Node reported 16 passing tests, no failures.                                                                                                 |
| `npm run test:builder`            | 7 passing tests, no failures.                                                                                                                |
| Generated Tailwind CSS inspection | Confirmed mobile breakpoint isolation, section highlight, color picker/focus, canvas, scrollbar and sticky utilities.                        |
| Earlier production HTTP checks    | Dashboard, websites, new website, settings, editor, public site and iframe preview returned HTTP 200; iframe HTML included noindex metadata. |

These are recorded results, not claims that commands were rerun to author this document. Compilation/HTTP responses do not establish hydration, visual layout or complete browser behavior.

Service tests cover import without secure-context structuredClone, client-only guards, seed-once behavior, creation/defaults, slug validation/uniqueness, settings/slug/draft SEO preservation, duplication independence, draft/live separation, serialized creation collisions, deletion/empty collections, legacy data preservation, corruption recovery, failed writes, deterministic sort and ID fallback.

Builder tests cover normalization independence, immutable/grouped/bounded history and saved/discard baselines, incorrect message source/origin/slug/session/version/type, content validation, image file validation/signatures, extended content/data URL persistence/site isolation, and shared template rendering/editor-only markers. These are not E2E browser tests. The shared-renderer test uses installed Next SWC internals; recheck the harness during Next upgrades.

### Pending browser validation

Browser interaction/visual checks were unavailable because the local browser tool was missing `scripts/browser-service.mjs`. This is a tool installation problem, not evidence of an application error. Use a real browser before declaring all Phase 3 acceptance criteria passed.

Recheck the previously reported UI issues against the code fixes: switching sections must scroll only inside the iframe, all fields must lack blue outlines, navbar must remain sticky, and mobile tabs/device previews must work after Tailwind conversion. Console/hydration cleanliness has not been browser-verified.

### Not implemented or intentionally limited

- Accounts, authentication, real tenant isolation, roles/permissions.
- Backend/API, database/ORM, server persistence, actual deployment, custom domains and old-slug redirects.
- Additional templates/template switching, Templates management, Media Library and workspace Settings.
- Working notifications/profile actions.
- Server-rendered per-site SEO metadata, customer sitemap/robots generation, SEO analytics and real traffic metrics.
- Cloud/IndexedDB media, global assets, resizing/compression/cropping.
- Arbitrary layout section order, free-form drag-and-drop and rich-text editing.
- Autosave, persisted unsaved working state, cross-tab synchronization/conflict handling.
- Unpublish control, publish history and rollback workflow.
- General backup import/repair UI; corruption backup and retry exist, repair is manual.
- Dedicated unpublished-site public message: current unpublished normal route uses generic unavailable/not-found UI.
- Browser E2E coverage and measured typing performance with large image/history payloads.

This list is future work/limitations, not automatic authorization to implement it. No Phase 4 definition is present.

## 9. Exact next development steps

### Verify existing work first

1. Read this document, `AGENTS.md`, source/configuration and relevant bundled Next guides. Inspect `git status`; preserve existing/uncommitted work.
2. Install dependencies only if needed, then run:

   ```sh
   npm run lint -- src tests
   npm run test:sites
   npm run test:builder
   npm run build
   npm run dev -- --port 3001
   ```

3. Test on the same origin as the user's saved data. Use a separate profile for corruption/quota experiments. Never clear the user's storage just to make checks pass.
4. Complete the browser checklist below and record actual results/confirmed issues. Fix reproducible issues within the requested scope, with Tailwind utilities and centralized persistence.
5. Run checks appropriate to code changes and update this document's verification/status evidence.
6. Obtain concrete Phase 4 requirements before moving on. Do not choose a backend, add auth or drag-and-drop merely because it appears under future work.

### Manual browser checklist

- Dashboard/list: real counts/recent order, both searches, filters, sort, grid/list, sticky navbar, empty states and desktop/mobile navigation.
- Creation: Sunrise Clinic -> auto slug `sunrise-clinic`, Draft, complete default template, editor navigation and refresh persistence. Reject duplicate/reserved/invalid slugs.
- Settings: save/reload display/business names, industry and SEO; change slug and verify updated links/content, same ID/live snapshot, expected old-URL unavailability.
- Duplication/deletion: duplicate ABC Dental into independent Draft; edit/publish without changing original/XYZ Clinic. Cancel and confirm deletion; remove only chosen record and refresh dashboard counts on revisit.
- Builder: edit Hero/color, switch sections/back, add service/remove testimonial, undo/redo/discard. Canvas updates without save; selected section scrolls only inside iframe and toolbar stays visible.
- Devices: inspect iframe `window.innerWidth` as 1440/768/390 and confirm real responsive layout changes, not just visual scaling.
- Images: select/replace/remove valid small JPEG/PNG/WebP, save/reload; reject invalid types/sizes/spoofed files. Pending reads and storage failures must not silently lose working changes.
- Save/publish: saved preview shows persisted draft while live canvas can show unsaved edits. Draft save leaves normal public snapshot unchanged; Publish updates it. New Draft normal URL must not show draft content.
- Navigation: Cancel/Discard exit dialogs, explicit discard, supported refresh/close warnings, Escape and keyboard access.
- Mobile/focus: at about 390px browser width, check Edit/Preview tabs, collapse, toolbar wrapping, modal fit and scrolling. Focus every field type across admin/wizard/settings/builder: no blue field outline. Check console for runtime/hydration errors.

### Backend integration later, only if requested

Keep `site-service.js` as the replaceable Promise-based boundary and preserve draft/live semantics and caller contracts. Agree on tenant identity/access rules, content schema, media storage, error mapping, slug uniqueness scope and concurrency before adding HTTP calls. Published server rendering/SEO needs server-readable data; current localStorage cannot be called from server rendering. Design explicit preservation/import of existing browser records rather than silently replacing them. These are proposed next integration decisions, not implemented endpoints.

## 10. Continuing in a new ChatGPT Temporary Chat

Temporary Chat has no prior conversation history. This file supplies context; it is not a memory feature.

1. Open the same coding workspace and ask the new chat to read `PROJECT_CONTEXT.md` and `AGENTS.md` before editing.
2. If it has no filesystem access, paste/upload this document plus the current project source or relevant files. This document cannot itself grant repository or browser-data access.
3. State the exact next task and any observed bug, route, origin, reproduction steps and useful screenshots/console output.
4. Require source inspection, comparison with this snapshot, a concise plan and preservation of working features/data. Do not start unrelated phases.
5. Specify which browser origin holds your real mock data. LocalStorage is not committed or transferred by this document; avoid unnecessarily sharing private saved records.

Suggested starting message:

```text
Read PROJECT_CONTEXT.md and AGENTS.md before changing anything.
This is the existing dynamic-website-builder Next.js 16 JavaScript/JSX project.
Phases 1 and 2 exist. Phase 3 is already implemented and needs the verification described in the handover, not a replacement editor.
Use Tailwind utilities, preserve all routes and the async site-service contract, and keep draft/live separate.
Do not add direct localStorage access in components, TypeScript, backend/auth/database or a large UI framework unless I request it.
Keep the admin navbar sticky, builder scrolling isolated, and all form fields free of blue focus outlines.
Inspect current files/uncommitted changes and provide a concise plan for:
[INSERT THE SPECIFIC NEXT TASK HERE]
Do not automatically start Phase 4. After authorized code changes, run appropriate tests/lint/build and report actual results and verification limits.
```

Start source reading with `src/lib/site-service.js`, `site-validation.js`, `mock-sites.js`, `src/components/WebsiteTemplate.jsx`, `src/hooks/useWebsiteEditor.js`, `src/components/builder/BuilderWorkspace.jsx`, `PreviewCanvas.jsx`, `PreviewDocument.jsx`, and `src/components/admin/WebsitesView.jsx`.

This handover request only creates/populates `PROJECT_CONTEXT.md`. It does not authorize application code changes or implementation of pending features.
