import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const read = (path) =>
  fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const moduleUrl = (source) =>
  `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
const validationUrl = moduleUrl(read("src/lib/site-validation.js"));
const validation = await import(validationUrl);
const mockUrl = moduleUrl(read("src/lib/mock-sites.js"));
const { initialSites } = await import(mockUrl);
const state = await import(
  moduleUrl(
    read("src/lib/editor-state.js").replace(
      '"./site-validation"',
      JSON.stringify(validationUrl),
    ),
  )
);
const protocol = await import(moduleUrl(read("src/lib/builder-sections.js")));
const media = await import(moduleUrl(read("src/lib/media-service.js")));
const service = await import(
  moduleUrl(
    read("src/lib/site-service.js")
      .replace('"./site-validation"', JSON.stringify(validationUrl))
      .replace('"./mock-sites"', JSON.stringify(mockUrl)),
  )
);
const image =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6z3cAAAAASUVORK5CYII=";

test("normalization preserves legacy content and provides independent optional defaults", () => {
  const before = JSON.stringify(initialSites[0]);
  const draft = validation.normalizeContent(initialSites[0].draft);
  assert.equal(draft.hero.heading, initialSites[0].draft.hero.heading);
  assert.equal(draft.theme.primary, initialSites[0].draft.theme.primary);
  assert.equal(draft.theme.font, "sans");
  assert.equal(draft.header.links[0].id, "nav-about");
  draft.header.links[0].label = "Changed";
  assert.equal(validation.defaultNavigation[0].label, "About");
  assert.equal(JSON.stringify(initialSites[0]), before);
  assert.deepEqual(validation.validateContent(initialSites[0].draft), {});
});

test("Business Essentials sections are independent, typed, and validated", () => {
  const first = service.createDefaultContent("Clinic");
  const second = service.createDefaultContent("Agency");
  assert.deepEqual(validation.validateContent(first), {});
  assert.equal(first.sections.length, 8);
  assert.equal(first.sections[0].type, "HERO");
  first.sections[0].heading = "Changed";
  assert.ok(second.sections[0].heading.includes("Agency"));
  for (const type of validation.templateSections) {
    const draft = service.createDefaultContent("Business");
    draft.sections.push(
      validation.createTemplateSection(type.type, `extra-${type.type}`),
    );
    assert.deepEqual(validation.validateContent(draft), {}, type.type);
  }
  assert.throws(
    () => validation.createTemplateSection("INVALID", "bad"),
    /supported/,
  );
  const invalid = service.createDefaultContent("Business");
  invalid.sections[0].buttonUrl = "javascript:alert(1)";
  invalid.sections[1].image = "data:image/svg+xml;base64,AAAA";
  invalid.sections[2].id = invalid.sections[0].id;
  invalid.sections[3].type = "INVALID";
  invalid.sections[4].items[0].title = " ";
  const errors = validation.validateContent(invalid);
  for (const key of [
    "sections.0.buttonUrl",
    "sections.1.image",
    "sections.2",
    "sections.3.type",
    "sections.4.items.0.title",
  ])
    assert.ok(errors[key], key);
});

test("structured sections retain editing, undo, visibility, order and published snapshots", async () => {
  const data = new Map();
  globalThis.window = {
    localStorage: {
      getItem: (key) => data.get(key) ?? null,
      setItem: (key, value) => data.set(key, value),
    },
  };
  try {
    const site = await service.createSite(
      { name: "Clinic", businessName: "Clinic", slug: "template-clinic" },
      "template-scope",
    );
    let history = state.editorHistory(
      {},
      { type: "LOAD", content: site.draft },
    );
    const original = history.draft.sections[0].heading;
    history = state.editorHistory(history, {
      type: "CHANGE",
      path: "sections.0.heading",
      value: "New heading",
      group: null,
      at: 1,
    });
    history = state.editorHistory(history, { type: "UNDO" });
    assert.equal(history.draft.sections[0].heading, original);
    history = state.editorHistory(history, { type: "REDO" });
    history.draft.sections[1].enabled = false;
    history.draft.sections.push(
      validation.createTemplateSection("TEXT", "more-details"),
    );
    history.draft.sections.reverse();
    await service.saveDraft(site.slug, history.draft, "template-scope");
    const published = await service.publishSite(site.slug, "template-scope");
    assert.deepEqual(published.live.sections, history.draft.sections);
    history.draft.sections[0].heading = "Unpublished change";
    await service.saveDraft(site.slug, history.draft, "template-scope");
    assert.deepEqual(
      (await service.getSite(site.slug, "template-scope")).live,
      published.live,
    );
    assert.ok(
      protocol
        .getBuilderSections(history.draft)
        .some((section) => section.id === "more-details"),
    );
  } finally {
    delete globalThis.window;
  }
});

test("immutable editor history groups typing, restores removed items and retains the saved baseline", () => {
  let history = state.editorHistory(
    {},
    { type: "LOAD", content: initialSites[0].draft },
  );
  const initial = JSON.stringify(history.draft);
  history = state.editorHistory(history, {
    type: "CHANGE",
    path: "hero.heading",
    value: "First",
    group: "hero.heading",
    at: 100,
  });
  history = state.editorHistory(history, {
    type: "CHANGE",
    path: "hero.heading",
    value: "Second",
    group: "hero.heading",
    at: 200,
  });
  assert.equal(history.past.length, 1);
  history = state.editorHistory(history, { type: "UNDO" });
  assert.equal(JSON.stringify(history.draft), initial);
  history = state.editorHistory(history, { type: "REDO" });
  assert.equal(history.draft.hero.heading, "Second");
  const items = history.draft.testimonials;
  history = state.editorHistory(history, {
    type: "CHANGE",
    path: "testimonials",
    value: [],
    group: null,
    at: 300,
  });
  assert.equal(history.draft.testimonials.length, 0);
  history = state.editorHistory(history, { type: "UNDO" });
  assert.deepEqual(history.draft.testimonials, items);
  history = state.editorHistory(history, {
    type: "SAVED",
    content: history.draft,
  });
  const baseline = history.saved;
  history = state.editorHistory(history, {
    type: "CHANGE",
    path: "about.description",
    value: "Unsaved",
    at: 400,
  });
  assert.equal(history.draft.hero.heading, "Second");
  history = state.editorHistory(history, { type: "DISCARD" });
  assert.deepEqual(history.draft, baseline);
  assert.equal(history.past.length, 0);
  for (let i = 0; i < 40; i++)
    history = state.editorHistory(history, {
      type: "CHANGE",
      path: "hero.heading",
      value: String(i),
      at: 1000 + i * 1000,
    });
  assert.equal(history.past.length, 20);
  assert.throws(() =>
    state.setContentValue(history.draft, "__proto__.polluted", "bad"),
  );
  assert.equal({}.polluted, undefined);
});

test("preview handshake rejects wrong source, origin, slug, session, version and message type", () => {
  const source = {},
    origin = "http://192.168.1.39:3001";
  const data = {
    channel: protocol.PREVIEW_CHANNEL,
    version: protocol.PREVIEW_VERSION,
    type: "SYNC",
    slug: "abc-dental",
    session: "editor-123",
  };
  const event = { source, origin, data };
  const valid = (sample) =>
    protocol.validPreviewMessage(
      sample,
      source,
      origin,
      "abc-dental",
      "editor-123",
    );
  assert.equal(valid(event), true);
  assert.equal(valid({ ...event, source: {} }), false);
  assert.equal(valid({ ...event, origin: "https://other.example" }), false);
  for (const [key, value] of [
    ["slug", "xyz-clinic"],
    ["session", "other-session"],
    ["version", 2],
    ["channel", "unrelated"],
    ["type", "DELETE"],
  ])
    assert.equal(valid({ ...event, data: { ...data, [key]: value } }), false);
  assert.deepEqual(
    protocol.viewports.map((viewport) => viewport.width),
    [1440, 768, 390],
  );
});

test("content validation covers unsafe links, invalid colors/email, incomplete lists and image budgets", () => {
  const draft = validation.normalizeContent(initialSites[0].draft);
  assert.deepEqual(validation.validateContent(draft), {});
  draft.hero.buttonUrl = "javascript:alert(1)";
  draft.theme.primary = "#12";
  draft.contact.email = "invalid";
  draft.services[0].title = "";
  draft.logo = "blob:temporary";
  const errors = validation.validateContent(draft);
  for (const path of [
    "hero.buttonUrl",
    "theme.primary",
    "contact.email",
    "services.0.title",
    "logo",
  ])
    assert.ok(errors[path]);
  assert.equal(validation.safeLink("javascript:alert(1)"), "#contact");
  for (const url of [
    "#about",
    "/site/example",
    "https://example.com",
    "tel:+919876543210",
    "mailto:hello@example.com",
  ])
    assert.equal(validation.validLink(url), true);
  assert.equal(validation.validLink(image, true), true);
  assert.equal(
    validation.validLink("data:image/svg+xml;base64,PHN2Zz4=", true),
    false,
  );
  assert.equal(
    validation.validLink("data:image/png;base64," + "A".repeat(360001), true),
    false,
  );
});

test("image selection rejects invalid file types, size limits and spoofed signatures", async () => {
  assert.equal(media.validateImageFile({ type: "image/png", size: 100 }), "");
  assert.ok(media.validateImageFile({ type: "image/svg+xml", size: 100 }));
  assert.ok(media.validateImageFile({ type: "image/jpeg", size: 0 }));
  assert.ok(
    media.validateImageFile({ type: "image/webp", size: 256 * 1024 + 1 }),
  );
  const fake = new Blob(["not an image"], { type: "image/png" });
  await assert.rejects(media.readLocalImage(fake), /do not match/);
});

test("extended content and local image data persist without publishing or changing another website", async () => {
  let raw = null;
  globalThis.window = {
    localStorage: {
      getItem: () => raw,
      setItem: (_, value) => {
        raw = value;
      },
    },
  };
  try {
    const original = await service.getSite("abc-dental"),
      other = await service.getSite("xyz-clinic");
    const draft = validation.normalizeContent(original.draft);
    draft.hero.heading = "Unsaved heading";
    draft.hero.image = image;
    draft.header.ctaLabel = "Call us";
    draft.header.ctaUrl = "tel:+919876543210";
    draft.footer.text = "Care from our team";
    draft.contact.whatsapp = "https://wa.me/919876543210";
    draft.services.push({
      id: "new-stable-service",
      title: "New service",
      description: "A new service",
      image,
    });
    assert.deepEqual(
      (await service.getSite(original.slug)).draft,
      original.draft,
    );
    await service.saveDraft(original.slug, draft);
    let reread = await service.getSite(original.slug);
    assert.equal(reread.draft.hero.image, image);
    assert.equal(reread.draft.hero.heading, "Unsaved heading");
    assert.deepEqual(reread.live, original.live);
    await service.publishSite(original.slug);
    reread = await service.getSite(original.slug);
    assert.deepEqual(reread.live, draft);
    assert.deepEqual(await service.getSite(other.slug), other);
    const invalid = state.cloneContent(draft);
    invalid.contact.facebook = "javascript:bad";
    await assert.rejects(
      service.saveDraft(original.slug, invalid),
      (error) => error.code === "VALIDATION",
    );
    assert.deepEqual((await service.getSite(original.slug)).draft, draft);
  } finally {
    delete globalThis.window;
  }
});

async function compileTemplate() {
  const swc = require("next/dist/build/swc");
  await swc.loadBindings();
  async function compile(path, dependencies) {
    const transformed = await swc.transform(read(path), {
      filename: path,
      jsc: {
        parser: { syntax: "ecmascript", jsx: true },
        transform: { react: { runtime: "automatic" } },
      },
      module: { type: "commonjs" },
    });
    const compiled = { exports: {} };
    new Function("require", "module", "exports", transformed.code)(
      (name) => dependencies[name] || require(name),
      compiled,
      compiled.exports,
    );
    return compiled.exports;
  }
  const blocks = await compile("src/components/templates/SectionBlocks.jsx", {
    "../../lib/site-validation": validation,
  });
  return (
    await compile("src/components/WebsiteTemplate.jsx", {
      "../lib/site-validation": validation,
      "./templates/SectionBlocks": blocks,
    })
  ).default;
}

test("the shared template renders extended draft fields and editor-only highlighting", async () => {
  const Template = await compileTemplate(),
    React = require("react"),
    { renderToStaticMarkup } = require("react-dom/server");
  const draft = validation.normalizeContent(initialSites[0].draft);
  draft.hero.heading = "Current unsaved hero";
  draft.sectionMeta.servicesHeading = "Specialist services";
  draft.footer.text = "Custom footer";
  draft.services[0].image = image;
  draft.testimonials[0].role = "Clinic patient";
  draft.testimonials[0].avatar = image;
  draft.contact.whatsapp = "https://wa.me/919876543210";
  draft.header.ctaLabel = "Book now";
  draft.header.ctaUrl = "#contact";
  const html = renderToStaticMarkup(
    React.createElement(Template, { content: draft, editorSection: "hero" }),
  );
  for (const text of [
    "Current unsaved hero",
    "Specialist services",
    "Custom footer",
    "Clinic patient",
    "WhatsApp",
    image,
    "Book now",
    'data-builder-active="true"',
    "md:grid-cols-2",
  ])
    assert.ok(html.includes(text), text);
  assert.equal((html.match(/data-builder-section="footer"/g) || []).length, 1);
  const publicHtml = renderToStaticMarkup(
    React.createElement(Template, { content: draft }),
  );
  assert.equal(publicHtml.includes('data-builder-active="true"'), false);
});

test("template rendering respects section ordering and visibility and renders FAQ, contact and gallery", async () => {
  const Template = await compileTemplate();
  const React = require("react");
  const { renderToStaticMarkup } = require("react-dom/server");
  const draft = service.createDefaultContent("Example Business");
  draft.sections.find((section) => section.type === "CONTACT").email =
    "hello@example.com";
  draft.sections.find((section) => section.type === "GALLERY").items[0].image =
    image;
  draft.sections.find((section) => section.type === "IMAGE_TEXT").enabled =
    false;
  draft.sections.reverse();
  const html = renderToStaticMarkup(
    React.createElement(Template, { content: draft }),
  );
  assert.ok(html.includes("hello@example.com"));
  assert.ok(html.includes("How do I get started?"));
  assert.ok(html.includes(image));
  assert.ok(html.indexOf('id="contact"') < html.indexOf('id="home"'));
  assert.equal(html.includes('data-builder-section="about"'), false);
  assert.equal(html.includes('data-builder-section="testimonials"'), false);
  const preview = renderToStaticMarkup(
    React.createElement(Template, { content: draft, editorSection: "home" }),
  );
  assert.ok(preview.includes('data-builder-active="true"'));
});

test("template library renders all section options and handles omitted props", async () => {
  const swc = require("next/dist/build/swc");
  await swc.loadBindings();
  const result = await swc.transform(
    read("src/components/templates/TemplateLibrary.jsx"),
    {
      filename: "TemplateLibrary.jsx",
      jsc: {
        parser: { syntax: "ecmascript", jsx: true },
        transform: { react: { runtime: "automatic" } },
      },
      module: { type: "commonjs" },
    },
  );
  const compiled = { exports: {} };
  new Function("require", "module", "exports", result.code)(
    require,
    compiled,
    compiled.exports,
  );
  const React = require("react");
  const { renderToStaticMarkup } = require("react-dom/server");
  const markup = renderToStaticMarkup(
    React.createElement(compiled.exports.default, {
      templateSections: validation.templateSections,
    }),
  );
  for (const section of validation.templateSections)
    assert.ok(markup.includes(section.description));
  assert.doesNotThrow(() =>
    renderToStaticMarkup(React.createElement(compiled.exports.default)),
  );
});
