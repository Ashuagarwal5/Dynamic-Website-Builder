export const TEMPLATE_ID = "business-v1";
export const industries = [
  "Dental",
  "Clinic",
  "Agency",
  "Restaurant",
  "Real Estate",
  "Other",
];
const reserved = new Set([
  "admin",
  "api",
  "app",
  "dashboard",
  "site",
  "sites",
  "websites",
  "new",
  "settings",
  "templates",
  "media",
  "login",
  "logout",
  "signup",
  "register",
  "public",
  "assets",
  "_next",
  "favicon",
  "robots",
  "sitemap",
  "www",
]);
export function slugify(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
}
export function slugError(value) {
  if (typeof value !== "string" || value.length < 3 || value.length > 60)
    return "Use a slug between 3 and 60 characters.";
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value))
    return "Use lowercase letters, numbers and single hyphens between words.";
  if (reserved.has(value)) return "This slug is reserved. Choose another.";
  return "";
}
export function validateDetails(payload, sites = [], excludeSiteId) {
  const errors = {};
  for (const [key, label] of [
    ["name", "Website display name"],
    ["businessName", "Business name"],
  ]) {
    if (typeof payload[key] !== "string" || !payload[key].trim())
      errors[key] = `${label} is required.`;
    else if (payload[key].trim().length > 120)
      errors[key] = `${label} must be 120 characters or fewer.`;
  }
  const problem = slugError(payload.slug);
  if (problem) errors.slug = problem;
  else if (
    sites.some(
      (site) => site.slug === payload.slug && site.id !== excludeSiteId,
    )
  )
    errors.slug = "This slug is already used by another website.";
  if (payload.industry && !industries.includes(payload.industry))
    errors.industry = "Choose a listed industry.";
  if (
    payload.seoTitle !== undefined &&
    (typeof payload.seoTitle !== "string" || payload.seoTitle.length > 160)
  )
    errors.seoTitle = "Use 160 characters or fewer.";
  if (
    payload.seoDescription !== undefined &&
    (typeof payload.seoDescription !== "string" ||
      payload.seoDescription.length > 500)
  )
    errors.seoDescription = "Use 500 characters or fewer.";
  return errors;
}
export function sortSites(sites, order = "recent") {
  const stamp = (site) => Date.parse(site.updatedAt || site.createdAt) || 0;
  return [...sites].sort((a, b) => {
    const delta =
      order === "alphabetical"
        ? a.name.localeCompare(b.name)
        : order === "oldest"
          ? stamp(a) - stamp(b)
          : stamp(b) - stamp(a);
    return delta || a.name.localeCompare(b.name) || a.id.localeCompare(b.id);
  });
}
