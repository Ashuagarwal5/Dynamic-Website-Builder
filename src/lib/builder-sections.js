export const builderSections = [
  {
    id: "header",
    label: "Header & Navigation",
    description: "Your logo, business name and navigation",
  },
  {
    id: "hero",
    label: "Hero",
    description: "Make a memorable first impression",
  },
  { id: "about", label: "About Us", description: "Introduce your business" },
  { id: "services", label: "Services", description: "Show what you offer" },
  {
    id: "testimonials",
    label: "Testimonials",
    description: "Share your customer stories",
  },
  {
    id: "contact",
    label: "Contact",
    description: "Help visitors get in touch",
  },
  { id: "footer", label: "Footer", description: "The finishing details" },
  {
    id: "theme",
    label: "Theme & Branding",
    description: "Colors and typography",
  },
  {
    id: "seo",
    label: "SEO Settings",
    description: "Search appearance guidance",
  },
];
export const viewports = [
  { id: "desktop", label: "Desktop", width: 1440 },
  { id: "tablet", label: "Tablet", width: 768 },
  { id: "mobile", label: "Mobile", width: 390 },
];
export function getBuilderSections(content) {
  if (!Array.isArray(content?.sections)) return builderSections;
  return [
    builderSections[0],
    ...content.sections.map((section) => ({
      id: section.id,
      label: section.heading || section.type.replaceAll("_", " "),
      description: `${section.type.replaceAll("_", " ")} section${section.enabled ? "" : " (hidden)"}`,
    })),
    ...builderSections.filter((section) =>
      ["footer", "theme", "seo"].includes(section.id),
    ),
  ];
}
export const PREVIEW_CHANNEL = "website-builder-preview";
export const PREVIEW_VERSION = 1;
export function validPreviewMessage(event, source, origin, slug, session) {
  const data = event.data;
  return (
    Boolean(source) &&
    typeof session === "string" &&
    session.length > 0 &&
    event.source === source &&
    event.origin === origin &&
    data?.channel === PREVIEW_CHANNEL &&
    data.version === PREVIEW_VERSION &&
    data.slug === slug &&
    data.session === session &&
    ["READY", "SYNC", "SELECT"].includes(data.type)
  );
}
