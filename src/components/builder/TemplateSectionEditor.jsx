"use client";
import { ArrowUp, ArrowDown, Trash2, Plus } from "lucide-react";
import { EditorField } from "./fields/EditorField";
import ImagePicker from "./fields/ImagePicker";
import { createLocalId } from "../../lib/site-service";
export default function TemplateSectionEditor({ editor, index }) {
  const section = editor.draft.sections[index];
  const path = `sections.${index}`;
  const field = (key, label, options = {}) => (
    <EditorField
      key={key}
      label={label}
      value={section[key] || ""}
      onChange={(value) => editor.change(`${path}.${key}`, value)}
      error={editor.validation[`${path}.${key}`]}
      {...options}
    />
  );
  const image = (key, label) => (
    <ImagePicker
      key={key}
      label={label}
      value={section[key]}
      onChange={(value) => editor.change(`${path}.${key}`, value, null)}
      beginMedia={editor.beginMedia}
      error={editor.validation[`${path}.${key}`]}
    />
  );
  function move(delta) {
    const sections = [...editor.draft.sections];
    [sections[index], sections[index + delta]] = [
      sections[index + delta],
      sections[index],
    ];
    editor.change("sections", sections, null);
  }
  const collection = ["FEATURES", "TESTIMONIALS", "FAQ", "GALLERY"].includes(
    section.type,
  );
  return (
    <div className="space-y-5">
      <label className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-xs font-semibold">
        <span>Show this section</span>
        <input
          type="checkbox"
          checked={section.enabled}
          onChange={(event) =>
            editor.change(`${path}.enabled`, event.target.checked, null)
          }
          className="size-4 accent-slate-700"
        />
      </label>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={index === 0}
          onClick={() => move(-1)}
          className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-slate-200 p-2 text-xs disabled:opacity-40"
        >
          <ArrowUp size={14} />
          Move up
        </button>
        <button
          type="button"
          disabled={index === editor.draft.sections.length - 1}
          onClick={() => move(1)}
          className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-slate-200 p-2 text-xs disabled:opacity-40"
        >
          <ArrowDown size={14} />
          Move down
        </button>
      </div>
      {field("eyebrow", "Eyebrow", { maxLength: 200 })}
      {field("heading", "Heading", { maxLength: 300 })}
      {field("description", "Description", {
        multiline: true,
        maxLength: 5000,
      })}
      {["HERO", "IMAGE", "IMAGE_TEXT", "VIDEO"].includes(section.type) &&
        image(
          "image",
          section.type === "VIDEO" ? "Video poster" : "Section image",
        )}
      {["HERO", "TEXT", "IMAGE_TEXT", "CTA", "BANNER"].includes(
        section.type,
      ) && (
        <>
          {field("buttonText", "Button label", { maxLength: 120 })}
          {field("buttonUrl", "Button link", {
            hint: "Use a website URL, #contact, tel: or mailto: link.",
          })}
        </>
      )}
      {section.type === "VIDEO" &&
        field("url", "Video URL", {
          hint: "Use a direct hosted video file (for example .mp4). YouTube page URLs are not video files.",
        })}
      {section.type === "CONTACT" && (
        <>
          {field("address", "Address", { multiline: true, maxLength: 2000 })}
          {field("phone", "Phone", { type: "tel", maxLength: 100 })}
          {field("email", "Email", { type: "email" })}
        </>
      )}
      {collection && (
        <div className="space-y-4">
          {section.items.map((item, itemIndex) => {
            const itemPath = `${path}.items.${itemIndex}`;
            return (
              <fieldset
                key={item.id}
                className="space-y-4 rounded-xl border border-slate-200 p-3"
              >
                <legend className="px-1 text-xs font-semibold">
                  Item {itemIndex + 1}
                </legend>
                <EditorField
                  label={
                    section.type === "FAQ"
                      ? "Question"
                      : section.type === "TESTIMONIALS"
                        ? "Customer name"
                        : "Title / caption"
                  }
                  value={item.title}
                  maxLength={200}
                  onChange={(value) =>
                    editor.change(`${itemPath}.title`, value)
                  }
                  error={editor.validation[`${itemPath}.title`]}
                />
                {section.type !== "GALLERY" && (
                  <EditorField
                    label={
                      section.type === "FAQ"
                        ? "Answer"
                        : section.type === "TESTIMONIALS"
                          ? "Review"
                          : "Description"
                    }
                    value={item.description}
                    multiline
                    maxLength={3000}
                    onChange={(value) =>
                      editor.change(`${itemPath}.description`, value)
                    }
                    error={editor.validation[`${itemPath}.description`]}
                  />
                )}
                {section.type !== "FAQ" && (
                  <ImagePicker
                    label={
                      section.type === "TESTIMONIALS"
                        ? "Customer photo"
                        : "Image"
                    }
                    value={item.image}
                    onChange={(value) =>
                      editor.change(`${itemPath}.image`, value, null)
                    }
                    beginMedia={editor.beginMedia}
                    error={editor.validation[`${itemPath}.image`]}
                  />
                )}
                <button
                  type="button"
                  onClick={() =>
                    editor.change(
                      `${path}.items`,
                      section.items.filter((_, i) => i !== itemIndex),
                      null,
                    )
                  }
                  className="inline-flex items-center gap-2 text-xs font-semibold text-red-600"
                >
                  <Trash2 size={13} />
                  Remove item (can undo)
                </button>
              </fieldset>
            );
          })}
          <button
            type="button"
            disabled={section.items.length >= 30}
            onClick={() =>
              editor.change(
                `${path}.items`,
                [
                  ...section.items,
                  {
                    id: createLocalId(),
                    title:
                      section.type === "FAQ"
                        ? "New question"
                        : section.type === "TESTIMONIALS"
                          ? "Customer name"
                          : "New item",
                    description: "",
                    image: "",
                  },
                ],
                null,
              )
            }
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 p-3 text-xs font-semibold"
          >
            <Plus size={14} />
            Add item
          </button>
        </div>
      )}
      <button
        type="button"
        onClick={() => {
          editor.change(
            "sections",
            editor.draft.sections.filter((_, i) => i !== index),
            null,
          );
          editor.setSection("header");
        }}
        className="inline-flex items-center gap-2 rounded-lg border border-red-100 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
      >
        <Trash2 size={14} />
        Remove section (can undo)
      </button>
    </div>
  );
}
