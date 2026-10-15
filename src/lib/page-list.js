export function parsePageList(data, siteId) {
  if (!Array.isArray(data)) throw new Error("Invalid page list response.");
  const ids = new Set();
  return data.map((page) => {
    if (!page || typeof page.id !== "string" || !page.id || ids.has(page.id)
      || page.siteId !== siteId || typeof page.name !== "string" || !page.name.trim()
      || typeof page.slug !== "string" || !page.slug || typeof page.status !== "string" || !page.status
      || !["createdAt", "updatedAt"].every((key) => typeof page[key] === "string" && Number.isFinite(Date.parse(page[key])))) throw new Error("Invalid page list response.");
    ids.add(page.id);
    const { id, name, slug, status, createdAt, updatedAt } = page;
    return { id, siteId, name, slug, status, createdAt, updatedAt };
  });
}

export function parsePageDetails(data, siteId, pageId) {
  const page = parsePageList([data], siteId)[0];
  if (page.id !== pageId) throw new Error("Invalid page details response.");
  return page;
}
