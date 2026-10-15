# Phase 3: visual website builder

## Implemented routes and behavior

- `/dashboard/sites/[slug]`: dedicated builder workspace without the admin sidebar.
- `/builder-preview/[slug]?session=...`: non-indexable, same-origin document for the live canvas. Direct visits do not load stored site content.
- Existing dashboard, website list, creation, settings and `/site/[slug]` routes remain available.

The builder has nine stable sections: Header & Navigation, Hero, About, Services, Testimonials, Contact, Footer, Theme & Branding and SEO. Services, testimonials and navigation links have stable item IDs and editable lists. Removing an item can be undone. The overall website section order remains fixed.

## State and preview architecture

`useWebsiteEditor` loads a site through `getSite` after hydration. It keeps the saved baseline and current working draft separate, along with selected section, device mode, validation and operation status. Immutable deep updates preserve unrelated content. Undo/redo retains up to 20 changes and groups continuous typing in the same field. Switching sections does not discard changes. Discard restores the latest successful save.

The iframe renders the same `WebsiteTemplate` used by the public route. Desktop, tablet and mobile set its actual CSS viewport width to 1440, 768 and 390 pixels. Visual scaling fits the canvas without changing that viewport width; scrolling happens inside the frame. This makes Tailwind media queries respond to the selected device rather than the outer browser width.

The version 1 `website-builder-preview` protocol uses READY, SYNC and SELECT messages. Both ends check the exact origin, sender window, channel, protocol version, site slug and per-workspace session. Only the parent builder supplies unsaved content. No working preview data is written to storage. Draft changes synchronize through messages without reloading the document. The parent handles preview reloads and has a connection retry state. Section outlines and click-to-select behavior are editor-only; links are disabled inside the canvas.

The toolbar's Saved preview opens `/site/[slug]?preview=1` and explicitly shows only the saved draft. The live canvas includes unsaved changes.

## Service and schema preservation

The existing record contract remains:

```js
{
  id, name, slug, industry, templateId, published, createdAt, updatedAt,
  draft: content,
  live: contentOrNull
}
```

Existing content fields remain intact: `businessName`, `logo`, root `phone`/`email`, `theme`, `hero`, `about`, `services`, `testimonials`, `contact` and `seo`.

Optional extensions are normalized in editor memory: `header.links` and CTA fields, `sectionMeta`, service images, testimonial roles/avatars, contact heading/description/WhatsApp, `footer.text`, theme background and font. Existing saved records are not rewritten just by opening the builder. Old content still renders through template fallbacks. The original Arial typography is preserved by the default font option. There is no storage migration or new collection key.

Save Draft validates content and calls `saveDraft(slug, content)`, preserving `live`. Publish first saves the working draft, then calls `publishSite(slug)` to copy the saved draft into this site's local published snapshot. The hook updates its saved baseline only after a confirmed write. Storage errors retain working edits for retry. Publishing failures after a successful draft save leave that saved draft intact. Other sites are unaffected.

All collection storage remains inside `site-service.js`, under the existing `dynamic-builder-sites-v1` key. The existing seed-once, corrupt-data recovery, serialized mutation and quota-error handling remain in place. Browser-only APIs are called after hydration or from user actions.

## Image handling

Local JPEG, PNG and WebP files are limited to 256 KB each. Selection checks MIME type, size, file signatures and browser image decoding. Reusable fields support preview, replacement, removal and existing remote/public paths. Data URLs persist inside the draft only when saved. They remain in this browser; there is no server upload. The content validator also limits each encoded image and the overall draft size. Collection quota failures are reported without overwriting the saved record. Pending reads disable save and conflicting form actions. Images need no separate orphan cleanup because they are stored inline with their owning content.

## Files added

- `src/app/builder-preview/[slug]/page.jsx`: isolated preview route and robots metadata.
- `src/components/admin/DashboardFrame.jsx`: chooses the dedicated builder or regular admin frame.
- `src/hooks/useWebsiteEditor.js`: loading, working draft, validation, history and persistence.
- `src/lib/builder-sections.js`: sections, devices and message protocol checks.
- `src/lib/editor-state.js`: immutable updates and history reducer.
- `src/lib/media-service.js`: frontend image validation and reading.
- `src/components/builder/BuilderWorkspace.jsx`: editor composition, mobile tabs and exit confirmations.
- `src/components/builder/BuilderToolbar.jsx`: status, devices, save, publish and navigation.
- `src/components/builder/BuilderSidebar.jsx`: section navigation and collapsible editing panel.
- `src/components/builder/SectionEditor.jsx`: controlled section forms and repeatable items.
- `src/components/builder/ViewportSwitcher.jsx`: accessible device controls.
- `src/components/builder/PreviewCanvas.jsx`: isolated iframe sizing and parent synchronization.
- `src/components/builder/PreviewDocument.jsx`: child synchronization and shared template rendering.
- `src/components/builder/BuilderDialog.jsx`: native confirmation dialog with keyboard cancellation.
- `src/components/builder/fields/EditorField.jsx`: reusable text/textarea and color fields.
- `src/components/builder/fields/ImagePicker.jsx`: image selection and previews.
- `tests/builder.test.mjs`: normalization, history, protocol, validation, media, persistence and shared-renderer checks.
- `docs/phase-3-builder.md`: this implementation and testing guide.

## Files modified

- `src/app/dashboard/layout.jsx`: builder/admin frame integration.
- `src/app/dashboard/sites/[slug]/page.jsx`: mounts the new workspace.
- `src/components/WebsiteTemplate.jsx`: compatible optional fields and editor-only selection markers.
- `src/lib/site-validation.js`: normalization, safe links and content validation.
- `src/lib/site-service.js`: validates content at the save boundary.
- `src/app/globals.css`: Tailwind import only. Layout, canvas, controls, focus states, scrollbars and responsive behavior use Tailwind utilities directly in JSX.
- `package.json`: adds `test:builder`; no new runtime dependencies.

## Verification performed

- `npm run test:sites`: 16 passing tests.
- `npm run test:builder`: 7 passing tests.
- `npm run lint -- src tests`: passed.
- `npm run build`: passed.
- Production HTTP checks: dashboard, websites, new website, settings, builder, public site and builder preview all returned 200. Preview HTML includes noindex metadata.

Automated browser interaction and visual testing could not run because the installed browser tool's runtime file is missing. HTTP checks do not prove hydration, iframe layout or interactive behavior; perform the following checks in a real browser.

## Manual test steps

1. Open `/dashboard`, then My Websites. Confirm ABC Dental and XYZ Clinic and their existing statuses. Test creation, settings, duplicate and delete to confirm Phase 2 still works.
2. Open ABC Dental's editor. Confirm the dedicated toolbar, section panel and full website canvas load. Change Hero heading, switch to About and back, and confirm the heading persists and updates immediately in the canvas.
3. Change primary color, add a service and remove a testimonial. Confirm each preview update. Undo/redo the changes. Check header links, contact details, footer text and SEO length guidance.
4. Select Desktop, Tablet and Mobile. In browser devtools, verify the iframe's `window.innerWidth` is 1440, 768 and 390 respectively. Confirm template grids/navigation change at their real breakpoints. Scroll inside the frame and click sections to select their forms.
5. Choose a small valid JPEG/PNG/WebP. Confirm preview, replace and remove. Try an SVG, an oversized file and an incorrectly renamed file; verify useful errors. Save a valid image, reload and confirm it remains.
6. Save Draft, then reload the editor. Confirm changes remain. Open Saved preview and confirm the saved draft. Compare normal `/site/abc-dental` before publishing; its published content should be unchanged.
7. Publish and confirm the local-publish dialog. Reload normal `/site/abc-dental`; verify the latest content appears. Confirm XYZ Clinic is unchanged. A newly created Draft website must remain unpublished at its normal public URL until published.
8. Make an edit and use Back or Website settings. Cancel the warning and confirm edits remain; discard and leave to confirm navigation. Test Discard changes separately and test browser reload/close warnings where supported. Browser history navigation is not universally intercepted.
9. At approximately 390px browser width, test Edit content/Live preview tabs, sidebar collapse/expand, all toolbar actions, scroll behavior and the native dialogs. Tab through controls and verify labels, visible focus and Escape-to-cancel behavior. Check the console for hydration or runtime errors.
10. If desired, test storage failures with an isolated browser profile. Confirm the existing recovery flow preserves corrupt saved data for export and quota errors leave the working draft available for retry.

## Intentionally deferred

No drag-and-drop, arbitrary section ordering, additional templates, backend/API, authentication, cloud uploads, real deployment, custom domains or global media library were added. Public server-generated SEO metadata remains Coming Soon; the builder edits and locally persists the canonical SEO fields and shows an illustrative search-result preview. No Phase 4 work was started.

## Tailwind styling conversion

All custom CSS selectors and @apply component classes were replaced with Tailwind utilities in the root layout, admin components, website management forms and builder components. The sticky navbar, outline-free fields, thin scrollbars and mobile Edit/Preview behavior are preserved. Runtime styles remain for user-selected template colors/fonts and calculated iframe dimensions. Build, lint and all 23 regression tests pass; generated CSS was checked for responsive tab breakpoints and preview selectors. Browser visual verification remains unavailable because the browser tool runtime is missing.
