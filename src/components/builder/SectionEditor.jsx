"use client";
import { Plus, Trash2 } from "lucide-react";
import { createLocalId } from "../../lib/site-service";
import { defaultNavigation } from "../../lib/site-validation";
import { EditorField, ColorField } from "./fields/EditorField";
import ImagePicker from "./fields/ImagePicker";
import Dropdown from "../ui/Dropdown";
import TemplateSectionEditor from "./TemplateSectionEditor";
import { fontOptions, radiusOptions } from "../../lib/section-config";
export default function SectionEditor({ editor }) {
  const { draft, section, change, validation, site } = editor;
  const get = (path) =>
    path.split(".").reduce((value, key) => value?.[key], draft);
  const field = (path, label, options = {}) => (
    <EditorField
      key={path}
      label={label}
      value={get(path)}
      inputMode={
        /url|instagram|facebook|whatsapp/i.test(path) ? "url" : undefined
      }
      onChange={(value) => change(path, value)}
      error={validation[path]}
      {...options}
    />
  );
  const image = (path, label) => (
    <ImagePicker
      key={path}
      label={label}
      beginMedia={editor.beginMedia}
      value={get(path)}
      onChange={(value) => change(path, value, null)}
      error={validation[path]}
    />
  );
  const remove = (path, index) =>
    change(
      path,
      get(path).filter((_, i) => i !== index),
      null,
    );
  const itemFields = (collection, keys) => (
    <div className="space-y-4">
      {get(collection).map((item, index) => (
        <fieldset
          key={item.id}
          className="space-y-4 rounded-xl border border-slate-200 p-3"
        >
          <legend className="px-1 text-xs font-semibold">
            {collection === "services"
              ? "Service"
              : collection === "testimonials"
                ? "Testimonial"
                : "Navigation link"}{" "}
            {index + 1}
          </legend>
          {keys.map(([key, label, options]) =>
            field(`${collection}.${index}.${key}`, label, options),
          )}
          {collection === "services" &&
            image(`${collection}.${index}.image`, "Service image")}
          {collection === "testimonials" &&
            image(`${collection}.${index}.avatar`, "Customer avatar")}
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 hover:bg-slate-50"
            onClick={() => remove(collection, index)}
            aria-label={`Remove ${collection === "header.links" ? "navigation link" : collection.slice(0, -1)} ${index + 1}`}
          >
            <Trash2 size={14} />
            Remove (can undo)
          </button>
        </fieldset>
      ))}
    </div>
  );
  const add = (collection, value) => (
    <button
      type="button"
      disabled={
        get(collection).length >= (collection === "header.links" ? 8 : 30)
      }
      className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-[#06325E] hover:bg-slate-50 w-full"
      onClick={() =>
        change(
          collection,
          [...get(collection), { id: createLocalId(), ...value }],
          null,
        )
      }
    >
      <Plus size={15} />
      Add{" "}
      {collection === "header.links"
        ? "navigation link"
        : collection === "services"
          ? "service"
          : "testimonial"}
    </button>
  );
  const blockIndex =
    draft.sections?.findIndex((block) => block.id === section) ?? -1;
  if (blockIndex >= 0)
    return <TemplateSectionEditor editor={editor} index={blockIndex} />;
  return (
    <div className="space-y-5">
      {section === "header" && (
        <>
          {field("businessName", "Business name", { maxLength: 120 })}
          {image("logo", "Logo")}
          <h3 className="text-sm font-semibold">Navigation links</h3>
          {itemFields("header.links", [
            ["label", "Label", { maxLength: 60 }],
            [
              "url",
              "Link",
              {
                hint: "Use #about, #services, #testimonials or #contact for page sections.",
              },
            ],
          ])}
          {add("header.links", { label: "New link", url: "#contact" })}
          {field("header.ctaLabel", "Header CTA label")}
          {field("header.ctaUrl", "Header CTA link", {
            hint: "The CTA is shown when both label and link are set.",
          })}
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-[#06325E] hover:bg-slate-50"
            onClick={() =>
              change(
                "header.links",
                defaultNavigation.map((link) => ({ ...link })),
                null,
              )
            }
          >
            Restore default navigation
          </button>
        </>
      )}
      {section === "hero" && (
        <>
          {field("hero.eyebrow", "Eyebrow")}
          {field("hero.heading", "Heading", { maxLength: 300 })}
          {field("hero.description", "Description", {
            multiline: true,
            maxLength: 5000,
          })}
          {field("hero.buttonText", "Button text")}
          {field("hero.buttonUrl", "Button link")}
          {image("hero.image", "Hero image")}
        </>
      )}
      {section === "about" && (
        <>
          {field("about.heading", "Heading", { maxLength: 300 })}
          {field("about.description", "Description", {
            multiline: true,
            maxLength: 5000,
          })}
          {image("about.image", "About image")}
        </>
      )}
      {section === "services" && (
        <>
          {field("sectionMeta.servicesHeading", "Section heading")}
          {field("sectionMeta.servicesDescription", "Section description", {
            multiline: true,
          })}
          {itemFields("services", [
            ["title", "Service title", { maxLength: 200 }],
            [
              "description",
              "Description",
              { multiline: true, maxLength: 3000 },
            ],
          ])}
          {add("services", {
            title: "New service",
            description: "Describe this service.",
            image: "",
          })}
          {!draft.services.length && (
            <p className="text-xs text-slate-500">
              No services yet. Add a service to get started.
            </p>
          )}
        </>
      )}
      {section === "testimonials" && (
        <>
          {field("sectionMeta.testimonialsHeading", "Section heading")}
          {itemFields("testimonials", [
            ["name", "Customer name", { maxLength: 200 }],
            ["role", "Role or business"],
            ["quote", "Quote", { multiline: true, maxLength: 3000 }],
          ])}
          {add("testimonials", {
            name: "Customer",
            role: "",
            quote: "Add a real customer testimonial.",
            avatar: "",
          })}
          {!draft.testimonials.length && (
            <p className="text-xs text-slate-500">
              No testimonials yet. Only add reviews you have permission to
              publish.
            </p>
          )}
        </>
      )}
      {section === "contact" && (
        <>
          {field("contact.heading", "Section heading")}
          {field("contact.description", "Description", { multiline: true })}
          {field("contact.address", "Address", { multiline: true })}
          {field("contact.phone", "Contact phone", { type: "tel" })}
          {field("contact.email", "Contact email", { type: "email" })}
          {field("phone", "Header / fallback phone", { type: "tel" })}
          {field("email", "Business email", { type: "email" })}
          {field("contact.whatsapp", "WhatsApp link", {
            hint: "For example https://wa.me/919876543210",
          })}
          {field("contact.instagram", "Instagram link")}
          {field("contact.facebook", "Facebook link")}
        </>
      )}
      {section === "footer" && (
        <>
          {field("footer.text", "Footer text", {
            multiline: true,
            hint: "Leave empty to use the business name and default copyright notice.",
          })}
          <p className="text-xs leading-5 text-slate-500">
            The footer shares your business name from Header &amp; Navigation.
            The year is added automatically.
          </p>
        </>
      )}
      {section === "theme" && draft.backendManaged && (
        <>
          {["primary", "secondary", "accent"].map((key) => (
            <ColorField
              key={key}
              label={`${key[0].toUpperCase()}${key.slice(1)} color`}
              value={draft.theme[key]}
              error={validation[`theme.${key}`]}
              onChange={(value) => change(`theme.${key}`, value)}
            />
          ))}
          <label className="block space-y-2">
            <span className="text-xs font-semibold">Typography</span>
            <Dropdown
              aria-label="Typography"
              value={draft.theme.fontFamily}
              onChange={(value) => change("theme.fontFamily", value)}
              className="w-full"
              options={[...new Set([draft.theme.fontFamily, ...fontOptions])].map((font) => ({ value: font, label: font }))}
            />
          </label>
          <label className="block space-y-2">
            <span className="text-xs font-semibold">Corner radius</span>
            <Dropdown
              aria-label="Corner radius"
              value={draft.theme.borderRadius}
              onChange={(value) => change("theme.borderRadius", value)}
              className="w-full"
              options={[...new Set([draft.theme.borderRadius, ...radiusOptions])].map((radius) => ({ value: radius, label: radius }))}
            />
          </label>
          <p className="text-xs leading-5 text-slate-500">
            Colors, font and corner radius are saved to your website theme.
          </p>
        </>
      )}
      {section === "theme" && !draft.backendManaged && (
        <>
          {field("businessName", "Business name", { maxLength: 120 })}
          {image("logo", "Logo")}
          {["primary", "secondary", "background"].map((key) => (
            <ColorField
              key={key}
              label={`${key[0].toUpperCase()}${key.slice(1)} color`}
              value={draft.theme[key]}
              error={validation[`theme.${key}`]}
              onChange={(value) => change(`theme.${key}`, value)}
            />
          ))}
          <label className="block space-y-2">
            <span className="text-xs font-semibold">Typography</span>
            <Dropdown
              aria-label="Typography"
              value={draft.theme.font}
              onChange={(value) => change("theme.font", value)}
              className="w-full"
              options={[
                { value: "system", label: "System sans serif" },
                { value: "sans", label: "Arial / Helvetica" },
                { value: "serif", label: "Georgia / serif" },
              ]}
            />
          </label>
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-[#06325E] hover:bg-slate-50 w-full"
            onClick={() =>
              change(
                "theme",
                {
                  ...draft.theme,
                  primary: "#0987F5",
                  secondary: "#06325E",
                  background: "#ffffff",
                  font: "sans",
                },
                null,
              )
            }
          >
            Reset to default theme (can undo)
          </button>
        </>
      )}
      {section === "seo" && (
        <>
          {field("seo.title", "Meta title", {
            maxLength: 160,
            hint: `${(draft.seo.title || "").length} characters. Around 50-60 is often easier to read in search results.`,
          })}
          {field("seo.description", "Meta description", {
            multiline: true,
            maxLength: 500,
            hint: `${(draft.seo.description || "").length} characters. Aim for a clear summary; search results may truncate it.`,
          })}
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-[11px] text-slate-500">
              Illustrative search result
            </p>
            <p className="mt-2 break-all text-xs text-slate-500">
              /site/{site.slug}
            </p>
            <p className="mt-1 break-words text-lg text-blue-700">
              {draft.seo.title || draft.businessName}
            </p>
            <p className="mt-2 break-words text-xs leading-5 text-slate-600">
              {draft.seo.description ||
                "Add a helpful description of your business."}
            </p>
          </div>
          <p className="text-xs leading-5 text-slate-500">
            SEO values are saved with your draft. Server-rendered SEO metadata
            is Coming Soon. This illustration does not predict search
            performance.
          </p>
        </>
      )}
    </div>
  );
}
