export function validateHeroSection(input) {
  const errors = {};
  if (input?.type !== "HERO") errors.type = "Choose the supported Hero section type.";
  if (!Number.isInteger(input?.sortOrder) || input.sortOrder < 0 || input.sortOrder > 2147483647) errors.sortOrder = "Enter a non-negative whole-number position.";
  if (typeof input?.isActive !== "boolean") errors.isActive = "Choose whether to show the section.";
  const source = input?.config;
  const config = {};
  for (const [field, limit] of [["heading", 300], ["subtitle", 5000], ["buttonText", 120], ["buttonLink", 2000]]) {
    const value = source?.[field] ?? "";
    if (typeof value !== "string" || value.length > limit || (field === "heading" && !value.trim())) errors[field] = `Use ${field === "heading" ? "non-empty " : ""}text up to ${limit} characters.`;
    else config[field] = value.trim();
  }
  const link = config.buttonLink;
  if (link) {
    let valid = /^#[a-zA-Z][\w-]*$/.test(link) || (link.startsWith("/") && !link.startsWith("//"));
    try { valid ||= ["http:", "https:", "mailto:", "tel:"].includes(new URL(link).protocol); } catch { /* Relative paths are handled above. */ }
    if (!valid || /[\\\u0000-\u0020]/.test(link)) errors.buttonLink = "Use an HTTP(S) URL, local path, section anchor, mailto: or tel: link.";
  }
  return { errors, payload: { type: "HERO", sortOrder: input?.sortOrder, isActive: input?.isActive, config } };
}
