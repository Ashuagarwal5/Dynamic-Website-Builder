import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const moduleUrl = (source) =>
  `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
const validationUrl = moduleUrl(
  fs.readFileSync(
    new URL("../src/lib/site-validation.js", import.meta.url),
    "utf8",
  ),
);
const mockUrl = moduleUrl(
  fs.readFileSync(new URL("../src/lib/mock-sites.js", import.meta.url), "utf8"),
);
const source = fs
  .readFileSync(new URL("../src/lib/site-service.js", import.meta.url), "utf8")
  .replace('"./site-validation"', JSON.stringify(validationUrl))
  .replace('"./mock-sites"', JSON.stringify(mockUrl));
const service = await import(moduleUrl(source));
const validation = await import(validationUrl);
const { initialSites } = await import(mockUrl);
const key = "dynamic-builder-sites-v1";
let raw = null,
  writes = 0,
  failWrite = false;
function browser() {
  globalThis.window = {
    localStorage: {
      getItem: (name) => {
        assert.equal(name, key);
        return raw;
      },
      setItem: (name, value) => {
        assert.equal(name, key);
        if (failWrite) throw new Error("quota");
        raw = value;
        writes++;
      },
    },
  };
}
const details = {
  name: "Sunrise Clinic",
  businessName: "Sunrise Clinic",
  industry: "Clinic",
  slug: "sunrise-clinic",
  templateId: "business-v1",
};
const rejectsCode = (promise, code) =>
  assert.rejects(
    promise,
    (error) => error instanceof service.SiteServiceError && error.code === code,
  );

test("website service preserves content and manages the complete browser collection", async (t) => {
  await t.test("sample data and service import without secure-context structuredClone", async () => {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, "structuredClone");
    Object.defineProperty(globalThis, "structuredClone", { configurable: true, value: undefined });
    try {
      const isolatedMockUrl = mockUrl + "#non-secure-origin";
      const { initialSites: seeded, mockSites: examples } = await import(isolatedMockUrl);
      await import(moduleUrl(source.replace(JSON.stringify(mockUrl), JSON.stringify(isolatedMockUrl))));
      assert.equal(seeded.length, 2);
      assert.equal(seeded[0].name, "ABC Dental");
      assert.equal(seeded[1].name, "XYZ Clinic");
      assert.deepEqual(seeded[0].live, seeded[0].draft);
      assert.notEqual(seeded[0].live, seeded[0].draft);
      assert.notEqual(seeded[0].live.hero, seeded[0].draft.hero);
      seeded[0].live.hero.heading = "Independent published snapshot";
      assert.equal(examples[0].draft.hero.heading, "Healthy Smiles Start Here");
    } finally {
      if (descriptor) Object.defineProperty(globalThis, "structuredClone", descriptor);
      else delete globalThis.structuredClone;
    }
  });
  await t.test("browser APIs never run on the server", async () => {
    delete globalThis.window;
    await rejectsCode(service.listSites(), "CLIENT_ONLY");
    browser();
  });
  await t.test(
    "samples seed once and preserve existing published snapshots",
    async () => {
      const seeded = await service.listSites();
      assert.equal(writes, 1);
      assert.equal(seeded.length, 2);
      assert.deepEqual(seeded[0].draft, initialSites[0].draft);
      assert.deepEqual(seeded[0].live, initialSites[0].live);
      const stored = raw;
      await service.listSites();
      assert.equal(raw, stored);
      assert.equal(writes, 1);
    },
  );
  await t.test(
    "creates complete unpublished content with generated slug and ISO timestamps",
    async () => {
      assert.equal(validation.slugify("Sunrise Clinic"), "sunrise-clinic");
      const site = await service.createSite(details);
      assert.equal(site.published, false);
      assert.equal(site.live, null);
      assert.equal(site.draft.businessName, details.businessName);
      for (const field of [
        "logo",
        "phone",
        "email",
        "theme",
        "hero",
        "about",
        "services",
        "testimonials",
        "contact",
        "seo",
      ])
        assert.ok(Object.hasOwn(site.draft, field));
      assert.ok(!Number.isNaN(Date.parse(site.createdAt)));
      assert.ok(!Number.isNaN(Date.parse(site.updatedAt)));
      assert.notEqual(site.id, "site_1");
      assert.equal((await service.getSite(site.slug)).id, site.id);
    },
  );
  await t.test(
    "form and service reject duplicate, malformed, reserved and oversized slugs",
    async () => {
      assert.equal(await service.isSlugAvailable(details.slug), false);
      const site = await service.getSite(details.slug);
      assert.equal(await service.isSlugAvailable(details.slug, site.id), true);
      for (const slug of [
        details.slug,
        "UPPER",
        "bad_slug",
        "two--hyphens",
        "-start",
        "end-",
        "ab",
        "a".repeat(61),
        "dashboard",
        "new",
      ])
        await rejectsCode(
          service.createSite({ ...details, slug }),
          "VALIDATION",
        );
      await rejectsCode(
        service.createSite({
          ...details,
          slug: "valid-slug",
          businessName: " ",
        }),
        "VALIDATION",
      );
      await rejectsCode(
        service.createSite({
          ...details,
          slug: "valid-slug",
          templateId: "unsupported",
        }),
        "VALIDATION",
      );
    },
  );
  await t.test(
    "settings rename slug and draft SEO without publishing or losing content",
    async () => {
      const original = await service.getSite("abc-dental");
      const edited = await service.updateSiteSettings(original.slug, {
        name: "Dental workspace",
        businessName: "Dental Draft",
        slug: "dental-new",
        industry: "Dental",
        seoTitle: "Draft title",
        seoDescription: "Draft description",
      });
      assert.equal(await service.getSite("abc-dental"), null);
      assert.equal(edited.id, original.id);
      assert.equal(edited.published, true);
      assert.deepEqual(edited.live, original.live);
      assert.deepEqual(edited.draft.services, original.draft.services);
      assert.equal(edited.draft.seo.title, "Draft title");
      assert.equal(edited.name, "Dental workspace");
      const before = raw;
      await rejectsCode(
        service.updateSiteSettings("dental-new", { slug: "xyz-clinic" }),
        "VALIDATION",
      );
      assert.equal(raw, before);
      await rejectsCode(
        service.updateSiteSettings("dental-new", {
          seoDescription: "a".repeat(501),
        }),
        "VALIDATION",
      );
      await service.updateSiteSettings("dental-new", {
        name: original.name,
        businessName: original.draft.businessName,
        slug: original.slug,
        seoTitle: original.draft.seo.title,
        seoDescription: original.draft.seo.description,
      });
    },
  );
  await t.test(
    "copies editable content into independent drafts with unique IDs and slugs",
    async () => {
      const original = await service.getSite("abc-dental");
      const copy = await service.duplicateSite(original.slug),
        second = await service.duplicateSite(original.slug);
      assert.equal(copy.name, "Copy of ABC Dental");
      assert.equal(copy.slug, "abc-dental-copy");
      assert.equal(second.slug, "abc-dental-copy-2");
      assert.notEqual(copy.id, original.id);
      assert.notEqual(copy.id, second.id);
      assert.equal(copy.published, false);
      assert.equal(copy.live, null);
      assert.deepEqual(copy.draft, original.draft);
      copy.draft.businessName = "Independent business";
      copy.draft.services[0].title = "Independent service";
      await service.saveDraft(copy.slug, copy.draft);
      const saved = await service.getSite(copy.slug);
      assert.equal(saved.name, "Copy of ABC Dental");
      await service.publishSite(copy.slug);
      assert.equal(
        (await service.getSite(copy.slug)).live.businessName,
        "Independent business",
      );
      assert.deepEqual(await service.getSite(original.slug), original);
    },
  );
  await t.test(
    "saving a published site preserves its live snapshot until publish",
    async () => {
      const site = await service.getSite("xyz-clinic"),
        draft = structuredClone(site.draft);
      draft.businessName = "New clinic name";
      await service.saveDraft(site.slug, draft);
      assert.deepEqual((await service.getSite(site.slug)).live, site.live);
      await service.publishSite(site.slug);
      assert.equal(
        (await service.getSite(site.slug)).live.businessName,
        draft.businessName,
      );
      const fromRead = await service.getSite(site.slug);
      fromRead.draft.businessName = "Only in memory";
      assert.equal(
        (await service.getSite(site.slug)).draft.businessName,
        draft.businessName,
      );
    },
  );
  await t.test(
    "serialized concurrent creations reject collisions without losing records",
    async () => {
      const results = await Promise.allSettled([
        service.createSite({ ...details, slug: "concurrent-site" }),
        service.createSite({ ...details, slug: "concurrent-site" }),
      ]);
      assert.equal(
        results.filter((result) => result.status === "fulfilled").length,
        1,
      );
      assert.equal(
        results.find((result) => result.status === "rejected").reason.code,
        "VALIDATION",
      );
      assert.equal(
        (await service.listSites()).filter(
          (site) => site.slug === "concurrent-site",
        ).length,
        1,
      );
    },
  );
  await t.test(
    "delete removes only the specified site and empty collections stay empty",
    async () => {
      const before = await service.listSites();
      await service.deleteSite(details.slug);
      assert.equal(await service.getSite(details.slug), null);
      assert.equal((await service.listSites()).length, before.length - 1);
      for (const site of await service.listSites())
        await service.deleteSite(site.slug);
      assert.deepEqual(await service.listSites(), []);
      assert.equal(raw, "[]");
      await rejectsCode(service.deleteSite("missing"), "NOT_FOUND");
    },
  );
  await t.test(
    "legacy metadata stays optional and loading never rewrites user content",
    async () => {
      raw = JSON.stringify(initialSites);
      const before = raw;
      const old = await service.listSites();
      assert.equal(old[0].updatedAt, undefined);
      assert.equal(old[0].templateId, "business-v1");
      assert.equal(raw, before);
      assert.deepEqual(old[0].draft, initialSites[0].draft);
      assert.deepEqual(old[0].live, initialSites[0].live);
      await service.saveDraft(old[0].slug, old[0].draft);
      assert.ok((await service.getSite(old[0].slug)).updatedAt);
    },
  );
  await t.test(
    "corrupt data is recoverable and never overwritten by reads or mutations",
    async () => {
      for (const bad of [
        "invalid",
        "",
        "null",
        "{}",
        '[{"slug":"partial"}]',
        JSON.stringify([initialSites[0], initialSites[0]]),
      ]) {
        raw = bad;
        await rejectsCode(service.listSites(), "CORRUPT_STORAGE");
        await rejectsCode(service.createSite(details), "CORRUPT_STORAGE");
        assert.equal(raw, bad);
        assert.equal(await service.exportSavedSites(), bad);
      }
      raw = JSON.stringify(initialSites);
      assert.equal((await service.listSites()).length, 2);
    },
  );
  await t.test(
    "failed writes keep saved content and allow a later retry",
    async () => {
      const before = raw;
      failWrite = true;
      await rejectsCode(service.createSite(details), "STORAGE_WRITE");
      assert.equal(raw, before);
      failWrite = false;
      assert.equal((await service.createSite(details)).slug, details.slug);
      Object.defineProperty(window, "localStorage", {
        configurable: true,
        get() {
          throw new Error("blocked");
        },
      });
      await rejectsCode(service.listSites(), "STORAGE_UNAVAILABLE");
      browser();
    },
  );
  await t.test(
    "sorting is deterministic and does not mutate the input collection",
    () => {
      const input = [
        { id: "1", name: "Zulu" },
        { id: "2", name: "Bravo", updatedAt: "2026-10-08T10:00:00.000Z" },
        { id: "3", name: "Alpha", updatedAt: "2026-10-07T10:00:00.000Z" },
      ];
      assert.deepEqual(
        validation.sortSites(input).map((site) => site.id),
        ["2", "3", "1"],
      );
      assert.deepEqual(
        validation.sortSites(input, "oldest").map((site) => site.id),
        ["1", "3", "2"],
      );
      assert.deepEqual(
        validation.sortSites(input, "alphabetical").map((site) => site.id),
        ["3", "2", "1"],
      );
      assert.deepEqual(
        input.map((site) => site.id),
        ["1", "2", "3"],
      );
    },
  );
  await t.test(
    "local ID fallback is available when randomUUID is unsupported",
    () => {
      const descriptor = Object.getOwnPropertyDescriptor(globalThis, "crypto");
      Object.defineProperty(globalThis, "crypto", {
        configurable: true,
        value: {},
      });
      assert.notEqual(service.createLocalId(), service.createLocalId());
      if (descriptor) Object.defineProperty(globalThis, "crypto", descriptor);
      else delete globalThis.crypto;
    },
  );
  delete globalThis.window;
});
