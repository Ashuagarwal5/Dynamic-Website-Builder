# Phase 2: Website management

Implemented in JavaScript/JSX without backend routes, authentication, database changes or new runtime dependencies. The Phase 1 light theme, admin shell, editor tabs, existing sample records and public WebsiteTemplate are preserved.

## Routes and actions

| Route | Behavior |
| --- | --- |
| `/dashboard` | Collection-derived counts, three recent websites, create and management actions |
| `/dashboard/websites` | Search by display/business name or slug; status filter; recent/oldest/alphabetical sort; grid/list views; thumbnails with fallback; edit/view/settings/duplicate/delete |
| `/dashboard/websites/new` | Three steps: business details, actual Business Template preview, review/create; cancel/back; validation; double-submit protection |
| `/dashboard/websites/[slug]/settings` | Display/business names, industry, slug and draft SEO; saved confirmation; deletion |
| `/dashboard/sites/[slug]` | Existing content editor; settings link; save, save-before-preview, publish; controlled load errors |
| `/site/[slug]` | Existing published snapshot; `?preview=1` shows saved draft; unavailable/error states |

Creation and duplication navigate to the editor. Draft card views include `?preview=1`. Slug changes navigate to the settings page for the new slug. There are no automatic redirects from old URLs. Deleting from settings returns to the list. Deletion from a collection refreshes the records and counts.

## Service contract and content

All persistent storage access is in `src/lib/site-service.js`. Async operations: `listSites`, `getSite`, `createSite`, `updateSiteSettings`, `duplicateSite`, `deleteSite`, `isSlugAvailable`, `saveDraft`, `publishSite`, `exportSavedSites`. Helpers `createLocalId` and `createDefaultContent` do not access storage.

The complete collection remains a JSON array under the existing versioned key `dynamic-builder-sites-v1`:

```js
{
  id: "stable local ID",
  name: "Workspace display name",
  slug: "sunrise-clinic",
  industry: "Clinic", // optional; empty string when unspecified
  templateId: "business-v1",
  published: false,
  createdAt: "ISO date string", // optional for legacy records
  updatedAt: "ISO date string", // optional for legacy records
  draft: {
    businessName: "Sunrise Clinic",
    logo: "", phone: "", email: "",
    theme: { primary: "#0987F5", secondary: "#06325E" },
    hero: { eyebrow: "...", heading: "...", description: "...", buttonText: "Get in touch", buttonUrl: "#contact", image: "" },
    about: { heading: "...", description: "...", image: "" },
    services: [{ id: "service-1", title: "Our services", description: "..." }],
    testimonials: [], // entries: { id, name, quote }
    contact: { address: "", phone: "", email: "", instagram: "", facebook: "" },
    seo: { title: "Sunrise Clinic", description: "" }
  },
  live: null // independent content snapshot after publishing
}
```

`draft` and `live` remain the existing equivalents of draftContent and publishedContent. There are no duplicate alias fields. Saving a draft does not change the website display name or the published snapshot. Settings updates change business name and SEO only in `draft`; publish explicitly clones draft into live. Duplication copies draft content, gives fresh ID/slug/timestamps, and starts unpublished with no live snapshot or copied publication/deployment metadata. Collection mutations are serialized within the tab, and all reads/results clone nested data.

Slugs must have 3-60 characters, lowercase ASCII letters/numbers and single separating hyphens. Shared validation enforces reserved words, uniqueness, required names and field lengths. Creation generates a slug from the display name until manual slug editing. Service validation runs again against current persisted records before committing.

## Existing storage preservation

- Keep the original key and array format; no destructive migration or reset is performed.
- Seed ABC Dental and XYZ Clinic only when the key is absent. An existing `[]` stays empty after refresh.
- Existing IDs, content, draft/live separation and published states are preserved. Optional industry/template metadata has in-memory defaults; old timestamps are shown as Not recorded rather than fabricated.
- Do not rewrite a collection during normal reads. The next successful mutation persists optional metadata alongside the existing data.
- Malformed JSON, invalid content shapes or duplicate identifiers/slugs produce controlled SiteServiceError messages. The original saved string remains untouched; writes are blocked until it is repaired.
- The error UI offers retry and an exact saved-data download for corruption. Repair requires developer intervention in the browser's saved collection; there is no automatic reset or import UI.
- Storage access/write failures show actionable messages without pretending changes were saved. Browser APIs are never called during server rendering.
- All new mutation timestamps are ISO strings. Sorting is deterministic; missing legacy timestamps use an epoch fallback (last in newest order, first in oldest order).

## Validation performed

- `npm run test:sites`: 15 passing Node service checks, including first seed, Sunrise Clinic creation, slug errors/collisions, rename preservation, duplication independence, publishing, serialized mutations, deleting all records, legacy records, corrupt storage, blocked/full storage and ID fallback.
- `npm run build`: passing; all six requested application routes are included.
- `npm run lint -- src tests`: zero errors; three existing image warnings in WebsiteTemplate remain.
- Production HTTP smoke checks cover the overview, list, wizard, settings, editor, both public modes, unknown-route 404 and a mobile user-agent request.
- Browser interaction and visual checks could not run because the installed browser runtime referenced a missing browser-service module. HTTP checks do not verify hydration, layout or interactive controls. Complete the manual steps below in an actual browser.

## Manual acceptance checklist

Use a separate browser profile or back up saved data before destructive testing. Run `npm run dev`, then:

1. Open `/dashboard`. Confirm the existing ABC Dental and XYZ Clinic examples render and their counts match the collection.
2. Create Sunrise Clinic: enter business/display names, choose Clinic, check automatic `sunrise-clinic`, proceed to the actual Business Template preview, go Back and confirm entries persist, then create once.
3. Confirm the editor opens, the card shows Draft, the draft preview renders Sunrise Clinic/default sections, and reload preserves the record.
4. Save settings with distinct display and business names and draft SEO; reload. Search by both names. Verify a published website's public content remains unchanged until Publish.
5. Rename the slug to `sunrise-health`; confirm new settings/editor/view links work, old lookup shows unavailable, and all content and publication state remain intact.
6. Try a duplicate slug, uppercase, spaces, underscores, repeated/leading/trailing hyphens, reserved words, and length limits. Submission must be blocked with inline messages. Manually editing the slug must stop auto-generation.
7. Duplicate ABC Dental twice. Verify unique slugs, fresh IDs, Draft state, copied editable content and no live snapshot. Edit/publish a copy; ABC Dental must remain unchanged.
8. Test search, all status filters, all sorts, grid/list switch, empty search results, thumbnail fallback and real Edit/View/Settings navigation.
9. Delete a disposable website: check its name in the dialog; Cancel and Escape must retain it. Confirm deletion removes only that record. Delete from settings and confirm return to My Websites. Check dashboard counts after create/delete/publish.
10. In a disposable profile, delete all records and reload. Confirm samples do not reappear and the empty state provides Create Website.
11. Save a draft and immediately use Save & preview; it must show the newly saved content. Publish and verify the local public snapshot updates.
12. At desktop width check the persistent sidebar; at 375px width check the drawer, breadcrumb wrapping, wizard/form/card layout, filter wrapping, and delete dialog. Use keyboard Tab/Shift+Tab, Enter and Escape; dialog focus must remain inside and return to its trigger on closing.
13. To inspect recovery in a disposable profile, back up the storage value, replace it with invalid JSON, reload, confirm the error/backup/retry flow and that no sample overwrite occurs, then restore the original value and Retry. Blocking browser storage must show an error rather than success.

## Remaining placeholders

Templates library, Media Library, workspace Settings, notifications, profile/authentication, SEO metadata rendering, hosting, custom domains and redirects remain unavailable/Coming Soon. Business Template is the only usable template. No template switching, backend API, cross-tab synchronization or Phase 3 builder redesign was added.

## Added files

- `src/lib/site-validation.js`
- `src/components/websites/CreateWebsiteWizard.jsx`
- `src/components/websites/WebsiteSettingsForm.jsx`
- `src/components/websites/WebsiteDetailsFields.jsx`
- `src/components/websites/WebsiteFilters.jsx`
- `src/components/websites/DeleteWebsiteDialog.jsx`
- `src/components/websites/StatusBadge.jsx`
- `src/components/websites/ServiceError.jsx`
- `src/app/dashboard/websites/new/page.jsx`
- `src/app/dashboard/websites/[slug]/settings/page.jsx`
- `tests/site-service.test.mjs`
- `docs/phase-2-website-management.md`

## Modified files

- `src/lib/site-service.js`
- `src/components/admin/WebsiteCard.jsx`
- `src/components/admin/WebsitesView.jsx`
- `src/components/admin/AdminShell.jsx`
- `src/components/admin/navigation.js`
- `src/components/admin/States.jsx`
- `src/app/dashboard/sites/[slug]/page.jsx`
- `src/app/site/[slug]/page.jsx`
- `src/app/globals.css`
- `package.json` (service test script only)

`src/lib/mock-sites.js`, WebsiteTemplate and the Phase 1 layout/page wrappers remain intact. Other pre-existing working-tree changes were preserved.
