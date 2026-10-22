"use client";
import { useRef, useState } from "react";
import { validateHeroSection } from "../../lib/section-create";

export default function CreateSectionForm({ tenantId, siteId, pageId, nextOrder, onCreated, section = null, onCancel }) {
  const [open, setOpen] = useState(Boolean(section));
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const lock = useRef(false);
  const prefix = section ? `edit-section-${section.id}` : "section";
  const formId = section ? `edit-section-form-${section.id}` : "create-section-form";
  async function submit(event) {
    event.preventDefault();
    if (lock.current) return;
    const form = new FormData(event.currentTarget);
    const input = { type: "HERO", sortOrder: form.get("sortOrder") === "" ? null : Number(form.get("sortOrder")), isActive: form.get("isActive") === "on", config: Object.fromEntries(["heading", "subtitle", "buttonText", "buttonLink"].map((key) => [key, form.get(key)])) };
    const checked = validateHeroSection(input);
    setErrors(checked.errors); setError("");
    if (Object.keys(checked.errors).length) return;
    lock.current = true; setPending(true);
    try {
      const response = await fetch(`/api/tenants/${encodeURIComponent(tenantId)}/sites/${encodeURIComponent(siteId)}/pages/${encodeURIComponent(pageId)}/sections${section ? `/${encodeURIComponent(section.id)}` : ""}`, { method: section ? "PATCH" : "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(checked.payload) });
      const data = await response.json();
      if (!response.ok) { setError(data.error || "Unable to save the section."); setErrors(data.errors || {}); }
      else { setOpen(false); onCreated(); return; }
    } catch { setError(section ? "Unable to confirm the update. Refresh sections before retrying." : "Unable to confirm creation. Refresh sections before retrying to avoid a duplicate."); }
    finally { lock.current = false; setPending(false); }
  }
  return <div className="space-y-4">
    <button type="button" aria-expanded={open} aria-controls={formId} disabled={pending} onClick={() => { if (section) onCancel?.(); else setOpen((value) => !value); }} className="rounded-lg bg-[#0987F5] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{section ? "Close editor" : open ? "Close form" : "Create section"}</button>
    {open && <form id={formId} onSubmit={submit} className="space-y-5 rounded-xl border border-slate-200 bg-slate-50 p-5">
      <h3 className="font-semibold">{section ? "Edit Hero section" : "New Hero section"}</h3>
      <fieldset disabled={pending} className="grid gap-4 sm:grid-cols-2"><legend className="sr-only">Hero content and visibility</legend>
        {[["heading", "Heading", 300], ["subtitle", "Description", 5000], ["buttonText", "Button text", 120], ["buttonLink", "Button link", 2000]].map(([key, label, limit]) => <div key={key} className={key === "subtitle" ? "sm:col-span-2" : ""}><label htmlFor={`${prefix}-${key}`} className="mb-2 block text-sm font-semibold">{label}{key === "heading" ? " *" : " (optional)"}</label>{key === "subtitle" ? <textarea id={`${prefix}-${key}`} name={key} defaultValue={typeof section?.config[key] === "string" ? section.config[key] : ""} rows={3} maxLength={limit} aria-invalid={!!errors[key]} aria-describedby={errors[key] ? `${prefix}-${key}-error` : undefined} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" /> : <input id={`${prefix}-${key}`} name={key} defaultValue={typeof section?.config[key] === "string" ? section.config[key] : ""} required={key === "heading"} maxLength={limit} placeholder={key === "buttonLink" ? "/about-us" : undefined} aria-invalid={!!errors[key]} aria-describedby={errors[key] ? `${prefix}-${key}-error` : undefined} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" />}{errors[key] && <p id={`${prefix}-${key}-error`} className="mt-1 text-xs text-red-600">{errors[key]}</p>}</div>)}
        <div><label htmlFor={`${prefix}-sortOrder`} className="mb-2 block text-sm font-semibold">Display order *</label><input id={`${prefix}-sortOrder`} name="sortOrder" type="number" min={0} max={2147483647} step={1} required defaultValue={section?.sortOrder ?? nextOrder} aria-invalid={!!errors.sortOrder} aria-describedby={errors.sortOrder ? `${prefix}-order-error` : `${prefix}-order-help`} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" /><p id={`${prefix}-order-help`} className="mt-1 text-xs text-slate-500">Starts at 0. Higher numbers appear later.</p>{errors.sortOrder && <p id={`${prefix}-order-error`} className="text-xs text-red-600">{errors.sortOrder}</p>}</div>
        <label className="flex items-center gap-2 text-sm font-medium"><input name="isActive" type="checkbox" defaultChecked={section?.isActive ?? true} className="size-4" />Show section</label>
      </fieldset>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-3"><button type="submit" disabled={pending} className="rounded-lg bg-[#0987F5] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{pending ? "Saving..." : section ? "Save changes" : "Create section"}</button><button type="button" disabled={pending} onClick={() => { if (section) onCancel?.(); else setOpen(false); }} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold">Cancel</button></div>
    </form>}
  </div>;
}
