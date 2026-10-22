"use client";
import { useEffect, useState } from "react";
import { parseSectionList } from "../../lib/section-list";
import CreateSectionForm from "./CreateSectionForm";
import DeleteSectionDialog from "./DeleteSectionDialog";

function text(value) { return typeof value === "string" ? value : ""; }
export default function PageSections({ tenantId, siteId, pageId, pageName, onClose }) {
  const [result, setResult] = useState(null);
  const [revision, setRevision] = useState(0);
  const [created, setCreated] = useState(false);
  const [editing, setEditing] = useState(null);
  const [updated, setUpdated] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [deleted, setDeleted] = useState(false);
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await fetch(`/api/tenants/${encodeURIComponent(tenantId)}/sites/${encodeURIComponent(siteId)}/pages/${encodeURIComponent(pageId)}/sections`, { headers: { Accept: "application/json" }, cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load sections.");
        const sections = parseSectionList(data, pageId);
        if (active) setResult({ tenantId, siteId, pageId, revision, sections });
      } catch (error) {
        if (active) setResult({ tenantId, siteId, pageId, revision, error: error.message });
      }
    }
    load();
    // Ignore late reads without aborting fetch during navigation cleanup.
    return () => { active = false; };
  }, [tenantId, siteId, pageId, revision]);
  const current = result?.tenantId === tenantId && result?.siteId === siteId && result?.pageId === pageId && result?.revision === revision ? result : null;
  return <section id="page-sections" aria-labelledby="page-sections-title" className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
    <div className="flex items-start justify-between gap-4"><div><h2 id="page-sections-title" className="text-xl font-semibold">Sections for {pageName}</h2><p className="mt-2 text-sm text-slate-500">Content is listed in its saved display order.</p></div><button type="button" onClick={onClose} className="shrink-0 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold">Close sections</button></div>
    {deleted && <p role="status" className="text-sm text-emerald-700">Section deleted successfully.</p>}
    {updated && <p role="status" className="text-sm text-emerald-700">Section updated successfully.</p>}
    {current?.sections && editing && <CreateSectionForm key={`edit:${editing.id}`} tenantId={tenantId} siteId={siteId} pageId={pageId} section={editing} onCancel={() => setEditing(null)} onCreated={() => { setEditing(null); setCreated(false); setUpdated(true); setRevision((value) => value + 1); }} />}
    {created && <p role="status" className="text-sm text-emerald-700">Section created successfully.</p>}
    {current?.sections && <CreateSectionForm tenantId={tenantId} siteId={siteId} pageId={pageId} nextOrder={current.sections.reduce((max, section) => Math.max(max, section.sortOrder), -1) + 1} onCreated={() => { setUpdated(false); setCreated(true); setRevision((value) => value + 1); }} />}
    {!current ? <p role="status" className="text-sm text-slate-500">Loading sections...</p> : current.error ? <div role="alert" className="text-sm text-red-700"><p>{current.error}</p><button type="button" onClick={() => setRevision((value) => value + 1)} className="mt-3 rounded-lg border px-3 py-2 font-semibold">Retry</button></div> : !current.sections.length ? <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center"><h3 className="font-semibold">No sections yet</h3><p className="mt-2 text-sm text-slate-500">This page has no saved sections.</p></div> : <>
      <p aria-live="polite" className="text-sm text-slate-500">{current.sections.length} {current.sections.length === 1 ? "section" : "sections"}</p>
      <div role="region" aria-label={`Sections for ${pageName}`} tabIndex={0} className="overflow-x-auto rounded-xl border border-slate-200"><table className="w-full min-w-[600px] text-left text-sm"><caption className="sr-only">Saved sections, order, content, visibility, and last update</caption><thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr>{["Order", "Type", "Content", "Visibility", "Updated", "Actions"].map((label) => <th key={label} scope="col" className="px-4 py-3">{label}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{current.sections.map((section) => {
        const heading = text(section.config.heading) || text(section.config.title);
        const description = text(section.config.subtitle) || text(section.config.description);
        const items = Array.isArray(section.config.testimonials) ? section.config.testimonials : Array.isArray(section.config.items) ? section.config.items : null;
        return <tr key={section.id} className="hover:bg-slate-50"><td className="px-4 py-4 text-slate-500">{section.sortOrder}</td><th scope="row" className="px-4 py-4 font-semibold">{section.type.replaceAll("_", " ")}</th><td className="max-w-sm px-4 py-4"><p className="break-words font-medium">{heading || "Untitled section"}</p>{description && <p className="mt-1 line-clamp-3 break-words text-xs text-slate-500">{description}</p>}{items && <p className="mt-2 text-xs text-slate-500">{items.length} {items.length === 1 ? "item" : "items"}</p>}</td><td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${section.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{section.isActive ? "Shown" : "Hidden"}</span></td><td className="px-4 py-4 text-slate-500"><time dateTime={section.updatedAt}>{new Date(section.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" })}</time></td><td className="px-4 py-4"><button type="button" disabled={section.type !== "HERO"} onClick={() => { setUpdated(false); setEditing(section); }} aria-label={`Edit ${heading || section.type} section`} title={section.type === "HERO" ? "Edit section" : "Editing this section type is not available yet"} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-blue-600 disabled:cursor-not-allowed disabled:opacity-40">Edit</button><button type="button" onClick={() => { setDeleted(false); setDeleting(section); }} aria-label={`Delete ${heading || section.type} section`} className="ml-2 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50">Delete</button></td></tr>;
      })}</tbody></table></div>
    </>}
    {deleting && <DeleteSectionDialog key={`delete:${deleting.id}`} tenantId={tenantId} siteId={siteId} pageId={pageId} section={deleting} onClose={() => setDeleting(null)} onDeleted={() => { if (editing?.id === deleting.id) setEditing(null); setDeleting(null); setCreated(false); setUpdated(false); setDeleted(true); setRevision((value) => value + 1); }} />}
  </section>;
}
