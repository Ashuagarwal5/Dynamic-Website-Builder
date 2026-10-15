"use client";
import { ChevronLeft, ChevronRight, Layers } from "lucide-react";
import { getBuilderSections } from "../../lib/builder-sections";
import SectionManager from "./SectionManager";
import SectionEditor from "./SectionEditor";
export default function BuilderSidebar({ editor, collapsed, onCollapse }) {
  const sections = getBuilderSections(editor.draft);
  const selected =
    sections.find((section) => section.id === editor.section) || sections[0];
  return (
    <aside
      className={`flex min-h-0 w-full shrink-0 flex-col border-r border-slate-200 bg-white max-lg:group-data-[tab=preview]/builder:hidden ${collapsed ? "lg:w-[76px]" : "lg:w-[360px]"}`}
      aria-label="Website content editor"
    >
      <div className="flex items-center justify-between border-b border-slate-200 p-4">
        <h2 className="flex items-center gap-2 text-sm font-bold">
          <Layers size={17} />
          {!collapsed && "Website structure"}
        </h2>
        <button
          type="button"
          disabled={editor.mediaPending > 0}
          onClick={onCollapse}
          className="flex size-9 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-50"
          aria-label={
            collapsed ? "Expand content panel" : "Collapse content panel"
          }
        >
          {collapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
        </button>
      </div>
      {!collapsed && (
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <nav
            aria-label="Website sections"
            className="grid grid-cols-2 gap-1 border-b border-slate-100 p-3"
          >
            {sections.map((section, index) => (
              <button
                type="button"
                key={section.id}
                disabled={editor.mediaPending > 0}
                onClick={() => editor.setSection(section.id)}
                aria-pressed={editor.section === section.id}
                className={`flex items-start gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-semibold ${editor.section === section.id ? "bg-blue-50 text-blue-700" : "text-slate-500 hover:bg-slate-50"}`}
              >
                <span className="text-[10px] opacity-60">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {section.label}
              </button>
            ))}
          </nav>
          {Array.isArray(editor.draft.sections) && (
            <SectionManager editor={editor} />
          )}
          <section className="p-5">
            <h2 className="text-lg font-bold">{selected.label}</h2>
            <p className="mb-6 mt-1 text-xs leading-5 text-slate-500">
              {selected.description}
            </p>
            <fieldset disabled={editor.busy || editor.mediaPending > 0}>
              <legend className="sr-only">{selected.label} fields</legend>
              <SectionEditor editor={editor} />
            </fieldset>
          </section>
        </div>
      )}
    </aside>
  );
}
