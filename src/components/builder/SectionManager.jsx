"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import Dropdown from "../ui/Dropdown";
import {
  createTemplateSection,
  templateSections,
} from "../../lib/site-validation";
import { createLocalId } from "../../lib/site-service";
export default function SectionManager({ editor }) {
  const [type, setType] = useState("TEXT");
  const disabled =
    editor.busy ||
    editor.mediaPending > 0 ||
    editor.draft.sections.length >= 30;
  return (
    <div className="space-y-3 border-b border-slate-100 p-4">
      <p className="text-xs font-semibold text-slate-500">Add a section</p>
      <Dropdown
        aria-label="Section type"
        value={type}
        onChange={setType}
        disabled={disabled}
        className="w-full"
        options={templateSections.map((section) => ({
          value: section.type,
          label: section.label,
        }))}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          const section = createTemplateSection(
            type,
            `section-${createLocalId()}`,
          );
          editor.change("sections", [...editor.draft.sections, section], null);
          editor.setSection(section.id);
        }}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold hover:bg-slate-50 disabled:opacity-50"
      >
        <Plus size={14} aria-hidden="true" />
        Add section
      </button>
    </div>
  );
}
