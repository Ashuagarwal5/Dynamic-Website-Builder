// Validate the documented list contract without manufacturing editor content.
export function parseSiteList(data, tenantId) {
  const ids = new Set();
  if (!Array.isArray(data)) throw new Error("Invalid website list response.");
  return data.map((site) => {
    if (!site || typeof site.id !== "string" || !site.id || ids.has(site.id)
      || site.tenantId !== tenantId || typeof site.name !== "string" || !site.name.trim()
      || typeof site.slug !== "string" || !site.slug || typeof site.status !== "string" || !site.status
      || !["createdAt", "updatedAt"].every((key) => typeof site[key] === "string" && Number.isFinite(Date.parse(site[key])))
      || !["domain", "subdomain"].every((key) => site[key] == null || typeof site[key] === "string")) {
      throw new Error("Invalid website list response.");
    }
    ids.add(site.id);
    const { id, name, slug, status, createdAt, updatedAt } = site;
    return { id, tenantId, name, slug, status, domain: site.domain ?? null, subdomain: site.subdomain ?? null, createdAt, updatedAt };
  });
}
