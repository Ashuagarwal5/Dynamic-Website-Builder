import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import "./helpers/server-only.mjs";

const url = (path) => new URL(path, import.meta.url).href;
const fromRoute = url("../src/app/api/tenants/[tenantId]/sites/from-template/route.js");
const saveRoute = url("../src/app/api/tenants/[tenantId]/sites/[siteId]/pages/[pageId]/content/route.js");
const mocks = {
  "/lib/auth": "export async function getSession() { return globalThis.flowSession; }",
  "/services/tenant.service": "export async function getActiveTenants() { return globalThis.flowTenants; }",
  "/services/website.service": "export const createTenantSite = (...a) => globalThis.flow.createSite(...a); export const listTenantSites = (...a) => globalThis.flow.listSites(...a);",
  "/services/page.service": "export const createSitePage = (...a) => globalThis.flow.createPage(...a); export const listSitePages = (...a) => globalThis.flow.listPages(...a);",
  "/services/section.service": "export const createPageSection = (...a) => globalThis.flow.createSection(...a); export const updatePageSection = (...a) => globalThis.flow.updateSection(...a); export const deletePageSection = (...a) => globalThis.flow.deleteSection(...a);",
  "/services/theme.service": "export const updateSiteTheme = (...a) => globalThis.flow.updateTheme(...a);",
};
registerHooks({
  resolve(specifier, context, nextResolve) {
    const parent = decodeURI(context.parentURL || "");
    if ([fromRoute, saveRoute].some((route) => parent === decodeURI(route))) {
      const key = Object.keys(mocks).find((suffix) => specifier.endsWith(suffix));
      if (key) return { url: `data:text/javascript,${encodeURIComponent(mocks[key])}`, shortCircuit: true };
    }
    // Source files import siblings without extensions; Next resolves them, Node does not.
    if (specifier.startsWith(".") && !/\.[a-z]+$/.test(specifier) && parent.includes("/src/")) {
      const resolved = new URL(`${specifier}.js`, context.parentURL);
      if (existsSync(fileURLToPath(resolved))) return { url: resolved.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});
const { POST: createFromTemplate } = await import(fromRoute);
const { POST: save } = await import(saveRoute);
const config = await import("../src/lib/section-config.js");

afterEach(() => { for (const key of ["flow", "flowSession", "flowTenants"]) delete globalThis[key]; });
const ok = (body = null, status = 201) => new Response(body ? JSON.stringify(body) : null, { status });

test("section config maps editor fields to backend config and back", () => {
  const section = { id: "x", type: "HERO", enabled: true, eyebrow: "E", heading: "H", description: "D", image: "", buttonText: "Go", buttonUrl: "#contact", url: "", address: "", phone: "", email: "", items: [] };
  const backend = config.toBackendConfig(section);
  assert.equal(backend.subtitle, "D");
  assert.equal(backend.buttonLink, "#contact");
  assert.equal(backend.items, undefined);
  const restored = config.fromBackendSection({ id: "1abc", type: "HERO", isActive: false, config: backend });
  assert.equal(restored.id, "section-1abc");
  assert.equal(restored.backendId, "1abc");
  assert.equal(restored.enabled, false);
  assert.equal(restored.description, "D");
  const withItems = config.fromBackendSection({ id: "2", type: "FAQ", isActive: true, config: { items: [{ question: "Q", answer: "A" }, null] } });
  assert.deepEqual(withItems.items.map(({ title, description }) => [title, description]), [["Q", "A"]]);
});

test("section validation rejects unsafe links and oversize items", () => {
  const base = { type: "FEATURES", heading: "H", description: "", eyebrow: "", buttonText: "", buttonUrl: "", url: "", image: "", address: "", phone: "", email: "", items: [] };
  assert.deepEqual(config.validateSectionContent(base), {});
  assert.ok(config.validateSectionContent({ ...base, buttonUrl: "javascript:alert(1)" }).buttonUrl);
  assert.ok(config.validateSectionContent({ ...base, type: "NOPE" }).type);
  assert.ok(config.validateSectionContent({ ...base, items: [{ title: "x".repeat(201), description: "", image: "" }] })["items.0.title"]);
  assert.equal(config.validateBackendSection({ type: "HERO", isActive: true, config: { heading: "Hi" } }), true);
  assert.equal(config.validateBackendSection({ type: "HERO", isActive: "yes", config: {} }), false);
  assert.equal(config.validateBackendSection({ type: "HERO", isActive: true, config: { buttonLink: "javascript:x" } }), false);
});

test("template content has ordered business sections for the backend", () => {
  const sections = config.buildTemplateSections("Acme");
  assert.ok(sections.length >= 6);
  assert.deepEqual(sections.map((section) => section.sortOrder), sections.map((_, index) => index));
  assert.equal(sections[0].type, "HERO");
  assert.ok(sections[0].config.heading.includes("Acme"));
  const content = config.toTemplateContent({ name: "Acme", theme: { primaryColor: "#111111" }, sections: sections.map((s, i) => config.fromBackendSection({ id: `s${i}`, ...s })) });
  assert.equal(content.theme.primary, "#111111");
  assert.ok(content.header.links.every((link) => /^#section-/.test(link.url)));
});

function flowMocks(overrides = {}) {
  const calls = { sections: [], theme: [], page: 0 };
  globalThis.flow = {
    createSite: async () => ok({ id: "site-1" }),
    listSites: async () => ok([]),
    createPage: async () => { calls.page++; return ok({ id: "page-1" }); },
    listPages: async () => ok([]),
    createSection: async (t, s, p, payload) => { calls.sections.push([t, s, p, payload]); return ok(); },
    updateSection: async () => ok(null, 200),
    deleteSection: async () => ok(null, 200),
    updateTheme: async (t, s, payload) => { calls.theme.push(payload); return ok(null, 200); },
    ...overrides,
  };
  globalThis.flowSession = {};
  globalThis.flowTenants = [{ id: "t" }];
  return calls;
}
const create = (body, origin = "http://localhost") => createFromTemplate(new Request("http://localhost/x", { method: "POST", headers: { "Content-Type": "application/json", Origin: origin }, body: JSON.stringify(body) }), { params: Promise.resolve({ tenantId: "t" }) });

test("create from template builds site, Home page, sections and theme", async () => {
  const calls = flowMocks();
  const response = await create({ name: "Acme", slug: "acme", templateId: "business-essentials" });
  assert.equal(response.status, 201);
  const data = await response.json();
  assert.deepEqual([data.siteId, data.pageId, data.warnings], ["site-1", "page-1", []]);
  assert.ok(calls.sections.length >= 6);
  assert.ok(calls.sections.every(([t, s, p]) => t === "t" && s === "site-1" && p === "page-1"));
  assert.equal(calls.theme.length, 1);
});

test("create from template validates input, access and reports partial setup", async () => {
  flowMocks({ createSite: () => assert.fail("Must not create") });
  assert.equal((await create({ name: "A", slug: "a", templateId: "business-essentials" })).status, 400);
  assert.equal((await create({ name: "Acme", slug: "acme", templateId: "other" })).status, 400);
  assert.equal((await create({ name: "Acme", slug: "acme", templateId: "business-essentials" }, "http://other")).status, 403);
  globalThis.flowTenants = [];
  assert.equal((await create({ name: "Acme", slug: "acme", templateId: "business-essentials" })).status, 403);
  flowMocks({ createPage: async () => ok(null, 500), listPages: async () => ok([]) });
  const partial = await (await create({ name: "Acme", slug: "acme", templateId: "business-essentials" })).json();
  assert.equal(partial.siteId, "site-1");
  assert.equal(partial.pageId, null);
  assert.ok(partial.warnings.length);
  flowMocks({ createSite: async () => ok(null, 409) });
  assert.equal((await create({ name: "Acme", slug: "acme", templateId: "business-essentials" })).status, 409);
});

const sectionBody = (extra = {}) => ({ type: "HERO", isActive: true, config: { heading: "Hi" }, ...extra });
const doSave = (body, origin = "http://localhost") => save(new Request("http://localhost/x", { method: "POST", headers: { "Content-Type": "application/json", Origin: origin }, body: JSON.stringify(body) }), { params: Promise.resolve({ tenantId: "t", siteId: "s", pageId: "p" }) });

test("save deletes, orders updates, skips unchanged sections and saves the theme", async () => {
  const order = [];
  flowMocks({
    deleteSection: async (t, s, p, id) => { order.push(`delete:${id}`); return ok(null, 200); },
    updateSection: async (t, s, p, id, payload) => { order.push(`update:${id}:${payload.sortOrder}`); return ok(null, 200); },
    createSection: async (t, s, p, payload) => { order.push(`create:${payload.sortOrder}`); return ok(); },
    updateTheme: async () => { order.push("theme"); return ok(null, 200); },
  });
  const theme = { primaryColor: "#111111", secondaryColor: "#222222", accentColor: "#333333", fontFamily: "Arial", borderRadius: "12px" };
  const response = await doSave({ deleted: ["gone"], sections: [sectionBody({ backendId: "a", dirty: false }), sectionBody({ backendId: "b" }), sectionBody()], theme });
  assert.equal(response.status, 200);
  assert.deepEqual(order, ["delete:gone", "update:b:1", "create:2", "theme"]);
  assert.deepEqual((await response.json()).saved, { deleted: 1, sections: 2, theme: true });
});

test("save validates input and access, and stops at the first failure", async () => {
  flowMocks({ updateSection: () => assert.fail("Must not save invalid content") });
  assert.equal((await doSave({ sections: [sectionBody({ config: { buttonLink: "javascript:x" } })] })).status, 400);
  assert.equal((await doSave({ sections: "x" })).status, 400);
  assert.equal((await doSave({ sections: [], theme: { primaryColor: "red" } })).status, 400);
  assert.equal((await doSave({ sections: [] }, "http://other")).status, 403);
  globalThis.flowTenants = [];
  assert.equal((await doSave({ sections: [] })).status, 403);
  let calls = 0;
  flowMocks({ updateSection: async () => { calls++; return ok("private", 500); } });
  const failed = await doSave({ sections: [sectionBody({ backendId: "a" }), sectionBody({ backendId: "b" })] });
  assert.equal(failed.status, 502);
  assert.equal(calls, 1);
  const body = await failed.json();
  assert.ok(!JSON.stringify(body).includes("private"));
  assert.deepEqual(body.saved, { deleted: 0, sections: 0, theme: false });
});

test("editor content keeps the builder contract and maps the theme both ways", async () => {
  const { validateThemeInput } = await import("../src/lib/site-theme.js");
  const { getBuilderSections } = await import("../src/lib/builder-sections.js");
  const sections = config.buildTemplateSections("Acme").map((s, i) => config.fromBackendSection({ id: `s${i}`, ...s }));
  const content = config.toEditorContent({ name: "Acme", theme: { primaryColor: "#123456" }, sections });
  assert.equal(content.backendManaged, true);
  assert.ok(content.hero && content.about && content.contact && Array.isArray(content.services) && Array.isArray(content.testimonials));
  assert.equal(content.theme.primary, "#123456");
  assert.equal(config.themeFromContent(content.theme).primaryColor, "#123456");
  assert.equal(config.themeFromContent(content.theme).borderRadius, "12px");
  assert.deepEqual(config.validateEditorContent(content, validateThemeInput), {});
  const bad = { ...content, theme: { ...content.theme, primary: "red" }, sections: [{ ...sections[0], buttonUrl: "javascript:x" }] };
  const errors = config.validateEditorContent(bad, validateThemeInput);
  assert.ok(errors["theme.primary"] && errors["sections.0.buttonUrl"]);
  const ids = getBuilderSections(content).map((item) => item.id);
  assert.ok(ids.includes("theme"));
  assert.ok(ids.includes("header") && ids.includes("footer") && ids.includes("seo"));
});

test("header, footer and SEO round-trip through the hidden settings section", () => {
  const sections = config.buildTemplateSections("Acme").map((s, i) => config.fromBackendSection({ id: `s${i}`, ...s }));
  const content = config.toEditorContent({ name: "Acme", theme: {}, sections });
  assert.ok(content.header.links.length > 0);
  const edited = { ...content, businessName: "Acme Co", logo: "https://example.com/l.png", header: { links: [{ id: "x", label: "Home", url: "/" }], ctaLabel: "Call", ctaUrl: "tel:123" }, footer: { text: "All yours" }, seo: { title: "T", description: "D" } };
  const stored = config.settingsToConfig(edited);
  assert.equal(stored.role, config.SETTINGS_ROLE);
  assert.ok(config.isSettingsSection({ type: "TEXT", config: stored }));
  assert.ok(!config.isSettingsSection({ type: "HERO", config: stored }));
  assert.equal(config.validateBackendSection({ type: "TEXT", isActive: true, config: stored }), true);
  assert.equal(config.validateBackendSection({ type: "HERO", isActive: true, config: stored }), false);
  assert.equal(config.validateBackendSection({ type: "TEXT", isActive: true, config: { ...stored, header: { links: [{ label: "x", url: "javascript:x" }] } } }), false);
  const back = config.toEditorContent({ name: "Acme", theme: {}, sections, settings: stored });
  assert.equal(back.businessName, "Acme Co");
  assert.equal(back.logo, "https://example.com/l.png");
  assert.deepEqual(back.header.links.map(({ label, url }) => [label, url]), [["Home", "/"]]);
  assert.equal(back.header.ctaLabel, "Call");
  assert.equal(back.footer.text, "All yours");
  assert.deepEqual(back.seo, { title: "T", description: "D" });
  assert.deepEqual(config.settingsToConfig(back), stored);
});
