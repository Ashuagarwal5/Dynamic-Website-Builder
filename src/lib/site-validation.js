export const TEMPLATE_ID = "business-v1";
export const templateSections = [
  {
    type: "HERO",
    label: "Hero",
    description: "Headline, image and primary action",
  },
  { type: "TEXT", label: "Text", description: "Headings and paragraphs" },
  {
    type: "IMAGE",
    label: "Image",
    description: "A full-width image with a caption",
  },
  {
    type: "IMAGE_TEXT",
    label: "Image & Text",
    description: "Introduce your business or tell your story",
  },
  {
    type: "BANNER",
    label: "Banner",
    description: "An announcement or promotion",
  },
  {
    type: "FEATURES",
    label: "Features",
    description: "Services, benefits or reasons to choose you",
  },
  {
    type: "TESTIMONIALS",
    label: "Testimonials",
    description: "Real customer stories",
  },
  { type: "FAQ", label: "FAQ", description: "Answers to common questions" },
  {
    type: "GALLERY",
    label: "Gallery",
    description: "Photos of your work and business",
  },
  {
    type: "VIDEO",
    label: "Video",
    description: "A hosted video with playback controls",
  },
  {
    type: "CTA",
    label: "Call to action",
    description: "Invite visitors to take the next step",
  },
  {
    type: "CONTACT",
    label: "Contact",
    description: "Address, phone and email",
  },
];
export function createTemplateSection(type, id) {
  const meta = templateSections.find((section) => section.type === type);
  if (!meta) throw new Error("Choose a supported section type.");
  const section = {
    id,
    type,
    enabled: true,
    heading: meta.label,
    description: "",
    eyebrow: "",
    image: "",
    buttonText: "",
    buttonUrl: "",
    items: [],
    address: "",
    phone: "",
    email: "",
    url: "",
  };
  if (["HERO", "CTA", "BANNER"].includes(type))
    Object.assign(section, {
      buttonText: "Get in touch",
      buttonUrl: "#contact",
    });
  if (type === "FEATURES")
    section.items = [
      {
        id: `${id}-1`,
        title: "Personal attention",
        description: "A thoughtful approach built around your needs.",
        image: "",
      },
      {
        id: `${id}-2`,
        title: "Expert support",
        description: "Practical guidance from a team that cares.",
        image: "",
      },
      {
        id: `${id}-3`,
        title: "Simple experience",
        description: "Clear communication from the first conversation.",
        image: "",
      },
    ];
  if (type === "FAQ")
    section.items = [
      {
        id: `${id}-1`,
        title: "How do I get started?",
        description:
          "Contact our team to discuss what you need and we will help you with the next step.",
        image: "",
      },
      {
        id: `${id}-2`,
        title: "Can I speak with someone first?",
        description: "Yes. Get in touch using the contact details below.",
        image: "",
      },
    ];
  if (type === "GALLERY")
    section.items = [1, 2, 3].map((number) => ({
      id: `${id}-${number}`,
      title: `Photo ${number}`,
      description: "",
      image: "",
    }));
  return section;
}
export function createBusinessSections(businessName) {
  return [
    {
      ...createTemplateSection("HERO", "home"),
      eyebrow: "WELCOME TO YOUR NEXT CHAPTER",
      heading: `Good things start with ${businessName}.`,
      description:
        "Thoughtful service. A team that listens. Discover a better experience built around you.",
    },
    {
      ...createTemplateSection("IMAGE_TEXT", "about"),
      eyebrow: "OUR STORY",
      heading: "People first. Always.",
      description: `At ${businessName}, we believe great service starts with understanding you. Share your story, your values, and the people behind your business here.`,
    },
    {
      ...createTemplateSection("FEATURES", "services"),
      eyebrow: "WHAT WE OFFER",
      heading: "Built around your needs",
      description:
        "Discover how we can help. Customize these cards with your services and benefits.",
    },
    {
      ...createTemplateSection("TESTIMONIALS", "testimonials"),
      heading: "Stories from our customers",
      description:
        "Add real customer reviews in the editor. This section appears when you add a testimonial.",
    },
    {
      ...createTemplateSection("FAQ", "faq"),
      eyebrow: "GOOD TO KNOW",
      heading: "A few questions, answered.",
    },
    {
      ...createTemplateSection("GALLERY", "gallery"),
      heading: "A closer look",
      description: "Add photos of your space, your team, or your work.",
    },
    {
      ...createTemplateSection("CTA", "get-started"),
      eyebrow: "LET'S TALK",
      heading: "Ready to take the next step?",
      description:
        "Tell us what you have in mind. We would love to hear from you.",
    },
    {
      ...createTemplateSection("CONTACT", "contact"),
      eyebrow: "SAY HELLO",
      heading: "Let's connect.",
      description: "Have a question? Reach out using the details below.",
    },
  ];
}
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

// Optional fields extend the Phase 1 schema; normalization never mutates records.
export const defaultNavigation = [
  { id: "nav-about", label: "About", url: "#about" },
  { id: "nav-services", label: "Services", url: "#services" },
  { id: "nav-reviews", label: "Reviews", url: "#testimonials" },
  { id: "nav-contact", label: "Contact", url: "#contact" },
];
export function normalizeContent(content) {
  const copy = JSON.parse(JSON.stringify(content));
  return {
    ...copy,
    header: {
      links: defaultNavigation.map((link) => ({ ...link })),
      ctaLabel: "",
      ctaUrl: "",
      ...copy.header,
    },
    sectionMeta: {
      servicesHeading: "Our Services",
      servicesDescription: "",
      testimonialsHeading: "What Our Clients Say",
      ...copy.sectionMeta,
    },
    contact: {
      heading: "Contact Us",
      description: "",
      whatsapp: "",
      ...copy.contact,
    },
    footer: { text: "", ...copy.footer },
    theme: { background: "#ffffff", font: "sans", ...copy.theme },
  };
}
export function validLink(value, image = false) {
  if (!value) return true;
  if (typeof value !== "string") return false;
  if (
    image &&
    /^data:image\/(png|jpeg|webp);base64,[a-z0-9+/]+=*$/i.test(value)
  )
    return value.length <= 360000;
  if (/^[\u0000-\u0020]|[\u0000-\u001f]/.test(value)) return false;
  if (value.startsWith("#")) return !image && /^#[a-zA-Z][\w-]*$/.test(value);
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  try {
    const url = new URL(value);
    return image
      ? ["http:", "https:"].includes(url.protocol)
      : ["http:", "https:", "mailto:", "tel:"].includes(url.protocol);
  } catch {
    return false;
  }
}
export function safeLink(value, fallback = "#contact", image = false) {
  return validLink(value, image) ? value || fallback : fallback;
}
export function validateContent(content) {
  const errors = {};
  if (!content || typeof content !== "object")
    return { content: "Website content is required." };
  const text = (path, value, max, required = false) => {
    if (
      typeof value !== "string" ||
      (required && !value.trim()) ||
      value.length > max
    )
      errors[path] =
        `${required ? "Enter text" : "Use text"} up to ${max} characters.`;
  };
  const link = (path, value, image = false) => {
    if (!validLink(value, image))
      errors[path] = image
        ? "Use a JPEG, PNG or WebP image (up to 256 KB), HTTP(S) URL or local path."
        : "Use an HTTP(S) URL, local path, section anchor, mailto: or tel: link.";
  };
  text("businessName", content.businessName, 120, true);
  for (const section of ["hero", "about", "contact", "seo", "theme"])
    if (!content[section] || typeof content[section] !== "object")
      errors[section] = "This content section is missing.";
  if (
    Object.keys(errors).some((key) =>
      ["hero", "about", "contact", "seo", "theme"].includes(key),
    )
  )
    return errors;
  text("hero.heading", content.hero.heading, 300, true);
  text("about.heading", content.about.heading, 300, true);
  for (const section of ["hero", "about"]) {
    text(`${section}.description`, content[section].description || "", 5000);
    link(`${section}.image`, content[section].image, true);
  }
  for (const [path, value, max] of [
    ["hero.eyebrow", content.hero.eyebrow, 200],
    ["hero.buttonText", content.hero.buttonText, 120],
    ["contact.heading", content.contact.heading, 300],
    ["contact.description", content.contact.description, 3000],
    ["contact.address", content.contact.address, 2000],
    ["contact.phone", content.contact.phone, 100],
    ["phone", content.phone, 100],
    ["footer.text", content.footer?.text, 1000],
    ["header.ctaLabel", content.header?.ctaLabel, 120],
    ["sectionMeta.servicesHeading", content.sectionMeta?.servicesHeading, 300],
    [
      "sectionMeta.servicesDescription",
      content.sectionMeta?.servicesDescription,
      3000,
    ],
    [
      "sectionMeta.testimonialsHeading",
      content.sectionMeta?.testimonialsHeading,
      300,
    ],
  ])
    if (value !== undefined) text(path, value, max);
  link("logo", content.logo, true);
  link("hero.buttonUrl", content.hero.buttonUrl);
  for (const key of ["primary", "secondary", "background"])
    if (
      content.theme[key] !== undefined &&
      !/^#[0-9a-f]{6}$/i.test(content.theme[key])
    )
      errors[`theme.${key}`] = "Use a six-digit hex color such as #06325E.";
  if (
    content.theme.font &&
    !["system", "serif", "sans"].includes(content.theme.font)
  )
    errors["theme.font"] = "Choose a supported font.";
  text("seo.title", content.seo.title || "", 160);
  text("seo.description", content.seo.description || "", 500);
  for (const path of ["email", "contact.email"]) {
    const value = path === "email" ? content.email : content.contact.email;
    if (
      value &&
      (typeof value !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
    )
      errors[path] = "Enter a valid email address.";
  }
  for (const key of ["instagram", "facebook", "whatsapp"])
    link(`contact.${key}`, content.contact[key]);
  for (const collection of ["services", "testimonials"]) {
    if (!Array.isArray(content[collection])) {
      errors[collection] = "Use a list of items.";
      continue;
    }
    if (content[collection].length > 30)
      errors[collection] = "Use at most 30 items.";
    const ids = new Set();
    content[collection].forEach((item, index) => {
      const prefix = `${collection}.${index}`;
      if (!item || typeof item.id !== "string" || ids.has(item.id)) {
        errors[prefix] = "Items need unique IDs.";
        return;
      }
      ids.add(item.id);
      for (const key of collection === "services"
        ? ["title", "description"]
        : ["name", "quote"])
        text(
          `${prefix}.${key}`,
          item[key],
          key === "title" || key === "name" ? 200 : 3000,
          true,
        );
      if (item.role !== undefined) text(`${prefix}.role`, item.role, 200);
      link(`${prefix}.image`, item.image, true);
      link(`${prefix}.avatar`, item.avatar, true);
    });
  }
  if (content.header) {
    link("header.ctaUrl", content.header.ctaUrl);
    if (!Array.isArray(content.header.links) || content.header.links.length > 8)
      errors["header.links"] = "Use at most 8 navigation links.";
    else {
      const ids = new Set();
      content.header.links.forEach((item, index) => {
        if (!item || typeof item.id !== "string" || ids.has(item.id)) {
          errors[`header.links.${index}`] = "Links need unique IDs.";
          return;
        }
        ids.add(item.id);
        text(`header.links.${index}.label`, item.label, 60, true);
        link(`header.links.${index}.url`, item.url);
      });
    }
  }
  if (content.sections !== undefined) {
    if (!Array.isArray(content.sections) || content.sections.length > 30)
      errors.sections = "Use at most 30 sections.";
    else {
      const ids = new Set(["header", "footer", "theme", "seo"]);
      content.sections.forEach((section, index) => {
        const path = `sections.${index}`;
        if (
          !section ||
          typeof section.id !== "string" ||
          !/^[a-zA-Z][\w-]*$/.test(section.id) ||
          ids.has(section.id)
        ) {
          errors[path] = "Sections need unique valid IDs.";
          return;
        }
        ids.add(section.id);
        if (!templateSections.some((item) => item.type === section.type))
          errors[`${path}.type`] = "Choose a supported section type.";
        if (typeof section.enabled !== "boolean")
          errors[`${path}.enabled`] = "Choose whether to show the section.";
        for (const [key, limit] of [
          ["heading", 300],
          ["description", 5000],
          ["eyebrow", 200],
          ["buttonText", 120],
          ["address", 2000],
          ["phone", 100],
        ])
          text(`${path}.${key}`, section[key] ?? "", limit, key === "heading");
        link(`${path}.image`, section.image, true);
        link(`${path}.buttonUrl`, section.buttonUrl);
        if (
          section.url &&
          (typeof section.url !== "string" ||
            !validLink(section.url, true) ||
            section.url.startsWith("data:"))
        )
          errors[`${path}.url`] = "Use an HTTP(S) video URL or local path.";
        if (
          section.email &&
          (typeof section.email !== "string" ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(section.email))
        )
          errors[`${path}.email`] = "Enter a valid email address.";
        if (!Array.isArray(section.items) || section.items.length > 30)
          errors[`${path}.items`] = "Use at most 30 items.";
        else {
          const itemIds = new Set();
          section.items.forEach((item, itemIndex) => {
            const prefix = `${path}.items.${itemIndex}`;
            if (!item || typeof item.id !== "string" || itemIds.has(item.id)) {
              errors[prefix] = "Items need unique IDs.";
              return;
            }
            itemIds.add(item.id);
            text(`${prefix}.title`, item.title, 200, true);
            text(`${prefix}.description`, item.description || "", 3000);
            link(`${prefix}.image`, item.image, true);
          });
        }
      });
    }
  }
  if (JSON.stringify(content).length > 1400000)
    errors.content =
      "This draft is too large for mock storage. Remove or replace some local images.";
  return errors;
}
