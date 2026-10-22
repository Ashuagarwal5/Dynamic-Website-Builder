import { createBusinessSections, templateSections, validLink } from "./site-validation";

// The backend stores a free-form `config` per section. Editor sections use
// description/buttonUrl; the backend example uses subtitle/buttonLink, so the
// mapping below is the single place that translates between the two.
const text = (value) => (typeof value === "string" ? value : "");
const types = new Set(templateSections.map((section) => section.type));
export const collectionTypes = ["FEATURES", "TESTIMONIALS", "FAQ", "GALLERY"];

export const defaultTheme = {
  primaryColor: "#0987F5",
  secondaryColor: "#06325E",
  accentColor: "#F59E0B",
  fontFamily: "Arial",
  borderRadius: "12px",
};

export const fontOptions = ["Arial", "Georgia", "system-ui", "Verdana", "Trebuchet MS"];

export function toBackendConfig(section) {
  const config = {
    eyebrow: text(section.eyebrow),
    heading: text(section.heading),
    subtitle: text(section.description),
    image: text(section.image),
    buttonText: text(section.buttonText),
    buttonLink: text(section.buttonUrl),
    url: text(section.url),
    address: text(section.address),
    phone: text(section.phone),
    email: text(section.email),
  };
  if (collectionTypes.includes(section.type))
    config.items = (section.items || []).map((item) => ({ title: text(item.title), description: text(item.description), image: text(item.image) }));
  return config;
}

// Convert one backend section to the editor/renderer shape. `id` is prefixed
// so it stays a valid in-page anchor even when the backend ID starts with a digit.
export function fromBackendSection(section) {
  const config = section.config && typeof section.config === "object" ? section.config : {};
  const id = `section-${section.id}`;
  return {
    id,
    backendId: section.id,
    type: section.type,
    enabled: section.isActive !== false,
    eyebrow: text(config.eyebrow),
    heading: text(config.heading) || text(config.title),
    description: text(config.subtitle) || text(config.description) || text(config.text),
    image: text(config.image) || text(config.imageUrl),
    buttonText: text(config.buttonText),
    buttonUrl: text(config.buttonLink) || text(config.buttonUrl),
    url: text(config.url) || text(config.videoUrl),
    address: text(config.address),
    phone: text(config.phone),
    email: text(config.email),
    items: (Array.isArray(config.items) ? config.items : []).filter((item) => item && typeof item === "object").map((item, index) => ({
      id: `${id}-${index + 1}`,
      title: text(item.title) || text(item.name) || text(item.question),
      description: text(item.description) || text(item.text) || text(item.answer),
      image: text(item.image),
    })),
  };
}

export function validateSectionContent(section) {
  const errors = {};
  if (!types.has(section?.type)) return { type: "Choose a supported section type." };
  const field = (key, limit) => {
    if (typeof section[key] !== "string" || section[key].length > limit) errors[key] = `Use text up to ${limit} characters.`;
  };
  [["eyebrow", 200], ["heading", 300], ["description", 5000], ["buttonText", 120], ["address", 2000], ["phone", 100], ["email", 254]].forEach(([key, limit]) => field(key, limit));
  if (!validLink(section.buttonUrl)) errors.buttonUrl = "Use an HTTP(S) URL, local path, section anchor, mailto: or tel: link.";
  if (!validLink(section.url)) errors.url = "Use an HTTP(S) URL or local path.";
  if (!validLink(section.image, true)) errors.image = "Use a JPEG, PNG or WebP image (up to 256 KB), HTTP(S) URL or local path.";
  const items = section.items || [];
  if (!Array.isArray(items) || items.length > 30) errors.items = "Use up to 30 items.";
  else items.forEach((item, index) => {
    if (typeof item?.title !== "string" || item.title.length > 200) errors[`items.${index}.title`] = "Use text up to 200 characters.";
    if (typeof item?.description !== "string" || item.description.length > 3000) errors[`items.${index}.description`] = "Use text up to 3000 characters.";
    if (!validLink(item?.image, true)) errors[`items.${index}.image`] = "Use a JPEG, PNG or WebP image (up to 256 KB), HTTP(S) URL or local path.";
  });
  return errors;
}

// Server-side check of a backend-shaped section from the save request.
export function validateBackendSection(input) {
  if (!input || typeof input !== "object" || !types.has(input.type) || typeof input.isActive !== "boolean" || !input.config || typeof input.config !== "object" || Array.isArray(input.config)) return false;
  if (isSettingsConfig(input.config)) return input.type === "TEXT" && Object.keys(validateSettingsConfig(input.config)).length === 0;
  const local = fromBackendSection({ id: "check", type: input.type, isActive: input.isActive, config: input.config });
  return Object.keys(validateSectionContent(local)).length === 0;
}

// ---- Site settings (header, footer, SEO) ----
// The backend has no settings API, so they are stored in one extra TEXT section
// marked with config.role. It is never rendered as a normal section.
export const SETTINGS_ROLE = "SITE_SETTINGS";
export const isSettingsConfig = (config) => Boolean(config && typeof config === "object" && config.role === SETTINGS_ROLE);
export const isSettingsSection = (section) => section?.type === "TEXT" && isSettingsConfig(section.config);

export function settingsToConfig(content) {
  return {
    role: SETTINGS_ROLE,
    businessName: text(content.businessName),
    logo: text(content.logo),
    header: {
      links: (content.header?.links || []).map((link) => ({ label: text(link.label), url: text(link.url) })),
      ctaLabel: text(content.header?.ctaLabel),
      ctaUrl: text(content.header?.ctaUrl),
    },
    footer: { text: text(content.footer?.text) },
    seo: { title: text(content.seo?.title), description: text(content.seo?.description) },
  };
}

export function validateSettingsConfig(config) {
  const errors = {};
  const limit = (path, value, max, required = false) => {
    if (typeof value !== "string" || value.length > max || (required && !value.trim())) errors[path] = `${required ? "Enter text" : "Use text"} up to ${max} characters.`;
  };
  const link = (path, value, image = false) => {
    if (!validLink(value, image)) errors[path] = image ? "Use a JPEG, PNG or WebP image (up to 256 KB), HTTP(S) URL or local path." : "Use an HTTP(S) URL, local path, section anchor, mailto: or tel: link.";
  };
  limit("businessName", config.businessName ?? "", 120);
  link("logo", config.logo ?? "", true);
  const links = config.header?.links ?? [];
  if (!Array.isArray(links) || links.length > 20) errors["header.links"] = "Use up to 20 navigation links.";
  else links.forEach((item, index) => {
    limit(`header.links.${index}.label`, item?.label ?? "", 60, true);
    link(`header.links.${index}.url`, item?.url ?? "");
  });
  limit("header.ctaLabel", config.header?.ctaLabel ?? "", 60);
  link("header.ctaUrl", config.header?.ctaUrl ?? "");
  limit("footer.text", config.footer?.text ?? "", 1000);
  limit("seo.title", config.seo?.title ?? "", 160);
  limit("seo.description", config.seo?.description ?? "", 500);
  return errors;
}

export function sectionHasChanged(a, b) {
  return JSON.stringify(a) !== JSON.stringify(b);
}

// Template starting content as backend payloads. The Home page uses these in order.
export function buildTemplateSections(businessName) {
  return createBusinessSections(businessName).map((section, index) => ({
    type: section.type,
    sortOrder: index,
    isActive: true,
    config: toBackendConfig(section),
  }));
}

export const TEMPLATE_ID = "business-essentials";

// Rendering helpers: turn backend data into the content object WebsiteTemplate expects.
// `settings` is the stored header/footer/SEO config, or null to derive defaults.
export function toTemplateContent({ name, theme, sections, settings = null }) {
  const t = { ...defaultTheme, ...(theme || {}) };
  const stored = isSettingsConfig(settings) ? settings : null;
  // One short menu link per section kind, in page order, instead of long headings.
  const navLabels = { IMAGE_TEXT: "About", FEATURES: "Services", FAQ: "FAQ", CONTACT: "Contact" };
  const seen = new Set();
  const anchors = sections
    .filter((section) => {
      if (!section.enabled || !navLabels[section.type] || seen.has(section.type)) return false;
      seen.add(section.type);
      return true;
    })
    .map((section) => ({ ...section, heading: navLabels[section.type] }));
  const storedLinks = Array.isArray(stored?.header?.links) ? stored.header.links.filter((link) => link && typeof link === "object") : null;
  return {
    businessName: text(stored?.businessName) || name,
    logo: text(stored?.logo),
    theme: { primary: t.primaryColor, secondary: t.secondaryColor, accent: t.accentColor, fontFamily: t.fontFamily, radius: t.borderRadius },
    header: {
      links: storedLinks
        ? storedLinks.map((link, index) => ({ id: `nav-${index + 1}`, label: text(link.label), url: text(link.url) }))
        : anchors.slice(0, 5).map((section) => ({ id: `nav-${section.id}`, label: section.heading.slice(0, 24), url: `#${section.id}` })),
      ctaLabel: text(stored?.header?.ctaLabel),
      ctaUrl: text(stored?.header?.ctaUrl),
    },
    footer: { text: text(stored?.footer?.text) },
    seo: { title: text(stored?.seo?.title) || name, description: text(stored?.seo?.description) },
    sections,
  };
}

// ---- Backend-managed editor content (used by the full-screen builder) ----
const themeKeys = { primary: "primaryColor", secondary: "secondaryColor", accent: "accentColor", fontFamily: "fontFamily", borderRadius: "borderRadius" };
export const radiusOptions = ["0px", "4px", "8px", "12px", "16px", "24px"];

// Editor content in the shape the builder components expect. Header, footer, SEO
// and logo come from the stored settings section, or are derived when absent.
export function toEditorContent({ name, theme, sections, settings = null }) {
  const content = toTemplateContent({ name, theme, sections, settings });
  const t = { ...defaultTheme, ...(theme || {}) };
  return {
    ...content,
    backendManaged: true,
    theme: { ...content.theme, borderRadius: t.borderRadius },
    hero: {},
    about: {},
    contact: {},
    services: [],
    testimonials: [],
  };
}

export function themeFromContent(theme) {
  const payload = {};
  for (const [local, backend] of Object.entries(themeKeys)) payload[backend] = typeof theme?.[local] === "string" ? theme[local] : "";
  return payload;
}

export function validateEditorContent(content, validateTheme) {
  const errors = {};
  (content.sections || []).forEach((section, index) => {
    for (const [key, value] of Object.entries(validateSectionContent(section))) errors[`sections.${index}.${key}`] = value;
  });
  Object.assign(errors, validateSettingsConfig(settingsToConfig(content)));
  for (const [key, value] of Object.entries(validateTheme(themeFromContent(content.theme)).errors)) {
    const local = Object.keys(themeKeys).find((name) => themeKeys[name] === key);
    errors[`theme.${local}`] = value;
  }
  return errors;
}
