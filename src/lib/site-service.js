import {
  TEMPLATE_ID,
  slugError,
  slugify,
  validateDetails,
} from "./site-validation";
import { initialSites } from "./mock-sites";

// Keep the Phase 1 key and array format so existing browser edits remain intact.
const STORAGE_KEY = "dynamic-builder-sites-v1";
const clone = (value) => {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    throw new SiteServiceError(
      "SERIALIZATION",
      "Website content could not be serialized. Check the content and retry.",
    );
  }
};
export class SiteServiceError extends Error {
  constructor(code, message, fields = {}) {
    super(message);
    this.name = "SiteServiceError";
    this.code = code;
    this.fields = fields;
  }
}
function storage() {
  if (typeof window === "undefined")
    throw new SiteServiceError(
      "CLIENT_ONLY",
      "Website storage is available after this page loads in your browser.",
    );
  try {
    return window.localStorage;
  } catch {
    throw new SiteServiceError(
      "STORAGE_UNAVAILABLE",
      "Browser storage is unavailable. Allow storage for this site and retry.",
    );
  }
}
function write(sites) {
  try {
    storage().setItem(STORAGE_KEY, JSON.stringify(sites));
  } catch (error) {
    if (error instanceof SiteServiceError) throw error;
    throw new SiteServiceError(
      "STORAGE_WRITE",
      "Changes could not be saved. Browser storage may be full or blocked. Free space or allow storage, then retry.",
    );
  }
}
function contentValid(content) {
  return (
    content &&
    typeof content.businessName === "string" &&
    ["logo", "phone", "email"].every(
      (key) => content[key] === undefined || typeof content[key] === "string",
    ) &&
    ["theme", "hero", "about", "contact", "seo"].every(
      (key) =>
        content[key] &&
        typeof content[key] === "object" &&
        !Array.isArray(content[key]),
    ) &&
    Object.entries({
      theme: ["primary", "secondary"],
      hero: [
        "eyebrow",
        "heading",
        "description",
        "buttonText",
        "buttonUrl",
        "image",
      ],
      about: ["heading", "description", "image"],
      contact: ["address", "phone", "email", "instagram", "facebook"],
      seo: ["title", "description"],
    }).every(([section, keys]) =>
      keys.every(
        (key) =>
          content[section][key] === undefined ||
          typeof content[section][key] === "string",
      ),
    ) &&
    Array.isArray(content.services) &&
    content.services.every(
      (item) =>
        item &&
        typeof item.id === "string" &&
        typeof item.title === "string" &&
        typeof item.description === "string",
    ) &&
    Array.isArray(content.testimonials) &&
    content.testimonials.every(
      (item) =>
        item &&
        typeof item.id === "string" &&
        typeof item.name === "string" &&
        typeof item.quote === "string",
    )
  );
}
function read() {
  let raw;
  try {
    raw = storage().getItem(STORAGE_KEY);
  } catch (error) {
    if (error instanceof SiteServiceError) throw error;
    throw new SiteServiceError(
      "STORAGE_READ",
      "Saved websites could not be read. Allow browser storage and retry.",
    );
  }
  if (raw === null) {
    const seeded = clone(initialSites).map((site) => ({
      templateId: TEMPLATE_ID,
      industry: "",
      ...site,
    }));
    write(seeded);
    return seeded;
  }
  let sites;
  try {
    sites = JSON.parse(raw);
  } catch {
    /* Report without overwriting the original string. */
  }
  const ids = new Set(),
    slugs = new Set();
  const valid =
    Array.isArray(sites) &&
    sites.every((site) => {
      if (
        !site ||
        typeof site.id !== "string" ||
        !site.id ||
        typeof site.name !== "string" ||
        typeof site.slug !== "string" ||
        !site.slug ||
        typeof site.published !== "boolean" ||
        !contentValid(site.draft) ||
        (site.published && !contentValid(site.live)) ||
        ids.has(site.id) ||
        slugs.has(site.slug)
      )
        return false;
      ids.add(site.id);
      slugs.add(site.slug);
      return true;
    });
  if (!valid)
    throw new SiteServiceError(
      "CORRUPT_STORAGE",
      "Saved website data is invalid. It has been left untouched. Download a backup, repair the saved collection, then retry.",
    );
  // Optional metadata is added in memory; old timestamps are never invented.
  return sites.map((site) => ({
    templateId: TEMPLATE_ID,
    industry: "",
    ...site,
  }));
}
let pendingMutation = Promise.resolve();
function mutate(change) {
  const result = pendingMutation.then(() => {
    const sites = read();
    const value = change(sites);
    write(sites);
    return clone(value);
  });
  pendingMutation = result.catch(() => {});
  return result;
}
function requireSite(sites, slug) {
  const site = sites.find((item) => item.slug === slug);
  if (!site)
    throw new SiteServiceError(
      "NOT_FOUND",
      "Website not found. It may have been deleted or its slug changed.",
    );
  return site;
}
function validated(payload, sites, excludeId) {
  const fields = validateDetails(payload, sites, excludeId);
  if (Object.keys(fields).length)
    throw new SiteServiceError(
      "VALIDATION",
      "Please correct the highlighted website details.",
      fields,
    );
  return {
    ...payload,
    name: payload.name.trim(),
    businessName: payload.businessName.trim(),
    industry: payload.industry || "",
  };
}
export function createLocalId() {
  return (
    globalThis.crypto?.randomUUID?.() ||
    `site_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}_${Math.random().toString(36).slice(2)}`
  );
}
export function createDefaultContent(businessName) {
  return {
    businessName,
    logo: "",
    phone: "",
    email: "",
    theme: { primary: "#0987F5", secondary: "#06325E" },
    hero: {
      eyebrow: "Welcome to our business",
      heading: `Welcome to ${businessName}`,
      description:
        "Personal service, thoughtful solutions. Tell visitors what makes your business special.",
      buttonText: "Get in touch",
      buttonUrl: "#contact",
      image: "",
    },
    about: {
      heading: `About ${businessName}`,
      description:
        "Share your story, your team and what matters most to your business.",
      image: "",
    },
    services: [
      {
        id: "service-1",
        title: "Our services",
        description:
          "Describe the services you offer and how you help your customers.",
      },
    ],
    testimonials: [],
    contact: { address: "", phone: "", email: "", instagram: "", facebook: "" },
    seo: { title: businessName, description: "" },
  };
}
export async function listSites() {
  await pendingMutation;
  return clone(read());
}
export async function getSite(slug) {
  return (await listSites()).find((site) => site.slug === slug) || null;
}
export async function isSlugAvailable(slug, excludeSiteId) {
  if (slugError(slug)) return false;
  return !(await listSites()).some(
    (site) => site.slug === slug && site.id !== excludeSiteId,
  );
}
export async function createSite(payload) {
  return mutate((sites) => {
    const data = validated(payload, sites);
    if (data.templateId && data.templateId !== TEMPLATE_ID)
      throw new SiteServiceError("VALIDATION", "Choose Business Template.");
    const now = new Date().toISOString();
    const site = {
      id: createLocalId(),
      name: data.name,
      slug: data.slug,
      industry: data.industry,
      templateId: TEMPLATE_ID,
      published: false,
      createdAt: now,
      updatedAt: now,
      draft: createDefaultContent(data.businessName),
      live: null,
    };
    sites.push(site);
    return site;
  });
}
export async function updateSiteSettings(slug, payload) {
  return mutate((sites) => {
    const site = requireSite(sites, slug);
    const data = validated(
      {
        name: site.name,
        businessName: site.draft.businessName,
        slug: site.slug,
        industry: site.industry,
        seoTitle: site.draft.seo.title,
        seoDescription: site.draft.seo.description,
        ...payload,
      },
      sites,
      site.id,
    );
    Object.assign(site, {
      name: data.name,
      slug: data.slug,
      industry: data.industry,
      updatedAt: new Date().toISOString(),
      draft: {
        ...site.draft,
        businessName: data.businessName,
        seo: {
          ...site.draft.seo,
          title: data.seoTitle,
          description: data.seoDescription,
        },
      },
    });
    return site;
  });
}
export async function duplicateSite(slug) {
  return mutate((sites) => {
    const original = requireSite(sites, slug);
    const base = `${(slugify(original.slug) || "website").slice(0, 45).replace(/-+$/, "")}-copy`;
    let next = base,
      suffix = 2;
    while (sites.some((site) => site.slug === next) || slugError(next))
      next = `${base}-${suffix++}`;
    const now = new Date().toISOString();
    const copy = {
      id: createLocalId(),
      industry: original.industry || "",
      templateId: original.templateId || TEMPLATE_ID,
      name: `Copy of ${original.name}`.slice(0, 120),
      slug: next,
      published: false,
      createdAt: now,
      updatedAt: now,
      draft: clone(original.draft),
      live: null,
    };
    sites.push(copy);
    return copy;
  });
}
export async function deleteSite(slug) {
  return mutate((sites) => {
    const site = requireSite(sites, slug);
    sites.splice(sites.indexOf(site), 1);
    return { id: site.id, slug: site.slug };
  });
}
export async function saveDraft(slug, draft) {
  return mutate((sites) => {
    const site = requireSite(sites, slug);
    if (
      !contentValid(draft) ||
      !draft.businessName.trim() ||
      draft.businessName.trim().length > 120
    )
      throw new SiteServiceError(
        "VALIDATION",
        "Draft needs a business name (up to 120 characters) and complete website content.",
      );
    Object.assign(site, {
      draft: clone(draft),
      updatedAt: new Date().toISOString(),
    });
    return site;
  });
}
export async function publishSite(slug) {
  return mutate((sites) => {
    const site = requireSite(sites, slug);
    Object.assign(site, {
      published: true,
      live: clone(site.draft),
      updatedAt: new Date().toISOString(),
    });
    return site;
  });
}
export async function exportSavedSites() {
  try {
    return storage().getItem(STORAGE_KEY) ?? "[]";
  } catch (error) {
    if (error instanceof SiteServiceError) throw error;
    throw new SiteServiceError(
      "STORAGE_READ",
      "Could not read saved data for backup.",
    );
  }
}
