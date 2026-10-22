# API requests for the backend team

Context: users sign in, pick a template, edit the site (content, theme, sections, order, show/hide, add sections), save, then publish or unpublish. They can also edit, duplicate and delete a site. All endpoints below use the Bearer token, must verify that the user belongs to `{tenantId}`, and should return standard errors: 400, 401, 403, 404, 409 (duplicate slug/subdomain), 422. Please also document **response schemas** in Swagger; none are documented today.

Base: `/tenants/{tenantId}` (written as `{t}`), site `{s}`, page `{p}`.

## Must have

### Templates
1. `GET /templates` returns `[{ id, name, slug, description, previewImageUrl, category }]`.
2. `GET /templates/{templateId}` returns the above plus `theme` and `pages: [{ name, slug, sections: [{ type, sortOrder, isActive, config }] }]`.
3. Change `POST /tenants/{t}/sites`: body `{ name, slug, templateId? }`. With `templateId`, create the pages, sections and theme from the template. Return the new site.

### Website management
4. `GET /sites/{s}` returns one site (same fields as the list).
5. `PATCH /sites/{s}` body `{ name?, slug?, subdomain? }`; returns the updated site; 409 if taken.
6. `DELETE /sites/{s}` returns 204; also removes its pages, sections and theme and unpublishes it.
7. `POST /sites/{s}/duplicate` body `{ name, slug }`; copies theme, pages and sections as a draft; returns the new site.

### Sections
8. `PUT /sites/{s}/pages/{p}/sections/reorder` body `{ "order": ["sectionId", ...] }`. Sets sortOrder 0..n in one atomic step; returns the sections. (Replaces one PATCH per section, which can leave a half-saved order.)
9. `GET /section-types` returns `[{ type, label, defaultConfig, configSchema }]` for all 16 types.
   - `defaultConfig`: starting content when a user adds the section.
   - `configSchema`: the fields of `config` and their kind (text, link, image, list).
   - A written document with the same information is fine instead of an endpoint.

### Pages
10. `PATCH /sites/{s}/pages/{p}` body `{ name?, slug?, seoTitle?, seoDescription?, isHome? }`.
11. `DELETE /sites/{s}/pages/{p}` returns 204.

### Draft and publish model
- Edits to sections, pages, theme and settings change the **draft** only.
- `POST .../publish` copies the draft to a **published snapshot**, which `GET /public/sites/{subdomain}` serves.
- Site responses include `hasUnpublishedChanges` and `publishedAt`. The same applies to page publish.

## Should have

12. `GET` and `PATCH /sites/{s}/settings`: `{ businessName, logoUrl, faviconUrl, navLinks: [{ label, url }], footer: { text, links[], social[] }, contact: { email, phone, address }, seo: { title, description, ogImage } }`.
13. `POST /tenants/{t}/media` multipart `file`; returns `{ id, url, fileName, mimeType, size, createdAt }`. Please state allowed types and the size limit (for example png, jpg, webp, svg up to 5 MB).
14. `GET /tenants/{t}/media?page=&limit=` paginated list.
15. `DELETE /tenants/{t}/media/{mediaId}` returns 204.
16. `POST /sites/{s}/discard-changes` reverts the draft to the published snapshot.

## Nice to have
- `POST .../sections/{id}/duplicate`.
- `PUT .../pages/reorder` body `{ order: [pageIds] }` for navigation order.
- Custom domain fields on the site (`customDomain`, verification status).

## Documentation requested
- Response schemas for every endpoint.
- `GET /public/sites/{subdomain}`: one fixed shape, `{ site, settings, theme, pages: [{ slug, name, seo, sections[] }] }`, optionally filtered with `?page=slug`.
- The `POST /auth/register` response.
- Investigate why `GET /tenants/{t}/sites/{s}/theme` returns 502 for the "Jaipur Pharma Healthcare Website" site (id `f51160d2-e716-4386-9313-28e70dea8eab`).
