"use client";
import { useRef, useState } from "react";
import { Plus } from "lucide-react";

export default function CreatePageForm({ tenantId, siteId, onCreated }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const lock = useRef(false);
  async function submit(event) {
    event.preventDefault();
    if (lock.current) return;
    const form = event.currentTarget;
    const values = new FormData(form);
    const payload = { name: values.get("name").trim(), slug: values.get("slug").trim() };
    lock.current = true;
    setPending(true);
    setError(""); setErrors({}); setSuccess(false);
    try {
      const response = await fetch(`/api/tenants/${encodeURIComponent(tenantId)}/sites/${encodeURIComponent(siteId)}/pages`, {
        method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        setErrors(data.errors || {});
        setError(data.error || "Unable to create this page.");
      } else {
        form.reset(); setOpen(false); setSuccess(true);
        onCreated();
      }
    } catch {
      setError("Unable to confirm creation. Check the page list before retrying to avoid a duplicate.");
    } finally {
      lock.current = false;
      setPending(false);
    }
  }
  return <section aria-label="Create a page" className="space-y-4">
    <button type="button" aria-expanded={open} aria-controls="create-page-form" disabled={pending} onClick={() => { setOpen((value) => !value); setSuccess(false); }} className="inline-flex items-center gap-2 rounded-lg bg-[#0987F5] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"><Plus size={16} aria-hidden="true" />{open ? "Close form" : "Create page"}</button>
    {success && <p role="status" className="text-sm text-emerald-700">Page created successfully.</p>}
    {open && <form id="create-page-form" onSubmit={submit} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6">
      <h2 className="text-lg font-semibold">New page</h2>
      <fieldset disabled={pending} className="grid gap-5 sm:grid-cols-2"><legend className="sr-only">Page name and slug</legend>
        {[["name", "Page name", "Home", 120], ["slug", "Page slug", "home", 60]].map(([field, label, placeholder, limit]) => <div key={field}>
          <label htmlFor={`page-${field}`} className="mb-2 block text-sm font-semibold">{label} <span className="text-red-500">*</span></label>
          <input id={`page-${field}`} name={field} required maxLength={limit} minLength={field === "slug" ? 3 : undefined} pattern={field === "slug" ? "[a-z0-9]+(-[a-z0-9]+)*" : undefined} placeholder={placeholder} aria-invalid={!!errors[field]} aria-describedby={errors[field] ? `page-${field}-error` : field === "slug" ? "page-slug-help" : undefined} className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm" />
          {field === "slug" && <p id="page-slug-help" className="mt-2 text-xs text-slate-500">Use lowercase letters, numbers, and hyphens, such as about-us.</p>}
          {errors[field] && <p id={`page-${field}-error`} className="mt-2 text-xs text-red-600">{errors[field]}</p>}
        </div>)}
      </fieldset>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-3"><button type="submit" disabled={pending} className="rounded-lg bg-[#0987F5] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{pending ? "Creating..." : "Create page"}</button><button type="button" disabled={pending} onClick={() => setOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold disabled:opacity-50">Cancel</button></div>
    </form>}
  </section>;
}
