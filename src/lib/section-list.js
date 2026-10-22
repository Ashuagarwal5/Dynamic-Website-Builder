export function parseSectionList(data, pageId) {
  if (!Array.isArray(data)) throw new Error("Invalid section list response.");
  const ids = new Set();
  return data.map((section) => {
    if (!section || typeof section.id !== "string" || !section.id || ids.has(section.id)
      || section.pageId !== pageId || typeof section.type !== "string" || !section.type
      || !Number.isInteger(section.sortOrder) || section.sortOrder < 0 || typeof section.isActive !== "boolean"
      || !section.config || typeof section.config !== "object" || Array.isArray(section.config)
      || !["createdAt", "updatedAt"].every((key) => typeof section[key] === "string" && Number.isFinite(Date.parse(section[key])))) throw new Error("Invalid section list response.");
    ids.add(section.id);
    const { id, type, sortOrder, isActive, config, createdAt, updatedAt } = section;
    return { id, pageId, type, sortOrder, isActive, config, createdAt, updatedAt };
  }).sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id));
}
