# Website templates

Business Essentials is available at `/dashboard/templates` and in step two of website creation. The existing `business-v1` template ID is preserved. New sites use typed `draft.sections`; older sites without this collection continue using the original renderer and editor fields without migration.

## Starter structure

Header/navigation and footer surround eight starter sections:

| Section | Enum type | Purpose |
| --- | --- | --- |
| Hero | HERO | Headline, introduction, primary button and image |
| About | IMAGE_TEXT | Business story with a supporting image |
| Services/benefits | FEATURES | Editable cards |
| Customer stories | TESTIMONIALS | Real reviews; hidden publicly until reviews are added |
| Questions | FAQ | Native expandable questions and answers |
| Photos | GALLERY | Uploaded photos and captions; empty photos are omitted publicly |
| Get started | CTA | A prominent action and destination link |
| Contact | CONTACT | Address, phone and email links |

Users can also add TEXT, IMAGE, BANNER and VIDEO sections. These twelve types use the names in the supplied section enum. CATEGORIES, PRODUCTS, FEATURED_PRODUCTS and NEWSLETTER are deferred until catalog and subscriber APIs are defined. There are no fake checkout or subscription submissions.

## Editing and publishing

Each block has a stable ID, type, visibility flag, text, optional media/actions, and an item collection when applicable. The editor supports adding, moving, hiding and removing sections; adding/removing list items; uploading images; and undo/redo. Section IDs connect preview clicks to the corresponding editor panel, and survive reordering. New IDs cannot collide with header, footer, theme or SEO panels.

Save and publish validate supported types, unique IDs, collection sizes, text limits, links, image URLs/data, contact email and video URLs. Draft changes do not modify the live snapshot until publishing. Content and images remain in the branch's existing local storage scope while APIs are deferred.

The reusable renderer is shared by library preview, creation preview, live editor canvas, saved previews and published views. `/template-preview` displays only generic template sample content in an iframe; its actual viewport changes for mobile previews. VIDEO expects a direct hosted video file, rather than a YouTube page URL. Contact actions use telephone and email links.

Tests in `tests/builder.test.mjs` verify independent defaults, typed section validation, persistence, snapshots, order/visibility, rendering and undo/redo, alongside legacy compatibility tests.
