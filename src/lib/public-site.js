// The public endpoint documents no response schema ("website, theme, pages and
// sections"), so parsing is tolerant and normalizes to one shape.
const isObject = (value) => value && typeof value === "object" && !Array.isArray(value);
const text = (value) => (typeof value === "string" ? value : "");
const color = (value, fallback) => (/^#[0-9a-f]{3,8}$/i.test(text(value)) ? value : fallback);

export function parsePublicSite(data) {
  if (!isObject(data)) throw new Error("Invalid public site response.");
  const site = isObject(data.site) ? data.site : data;
  const theme = isObject(data.theme) ? data.theme : isObject(site.theme) ? site.theme : {};
  const rawPages = Array.isArray(data.pages) ? data.pages : Array.isArray(site.pages) ? site.pages : [];
  const pages = rawPages.filter(isObject).map((page) => ({
    id: text(page.id) || text(page.slug),
    name: text(page.name) || text(page.slug) || "Page",
    slug: text(page.slug),
    sections: (Array.isArray(page.sections) ? page.sections : [])
      .filter((section) => isObject(section) && text(section.type) && section.isActive !== false)
      .map((section, index) => ({
        id: text(section.id) || `${page.slug}-${index}`,
        type: section.type,
        sortOrder: Number.isFinite(section.sortOrder) ? section.sortOrder : index,
        config: isObject(section.config) ? section.config : {},
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder),
  }));
  return {
    name: text(site.name) || "Website",
    theme: {
      primaryColor: color(theme.primaryColor, "#0987F5"),
      secondaryColor: color(theme.secondaryColor, "#06325E"),
      accentColor: color(theme.accentColor, "#F59E0B"),
      // Only allow a plain font-family name; it is injected into a style value.
      fontFamily: /^[\w\s-]{1,60}$/.test(text(theme.fontFamily)) ? theme.fontFamily : "system-ui",
      borderRadius: /^\d{1,3}(px|rem)$/.test(text(theme.borderRadius)) ? theme.borderRadius : "12px",
    },
    pages,
  };
}

export function safeHref(value) {
  const href = text(value).trim();
  return /^(https?:\/\/|\/(?!\/)|#|mailto:|tel:)/i.test(href) ? href : "";
}

export function safeImage(value) {
  const src = text(value).trim();
  return /^(https?:\/\/|\/(?!\/))/i.test(src) ? src : "";
}
