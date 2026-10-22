"use client";
import { useRef, useState } from "react";
import BuilderDialog from "../builder/BuilderDialog";
import { validateSiteEdit } from "../../lib/site-edit";

const fields = [["name", "Website name", 120], ["slug", "Slug", 60], ["subdomain", "Subdomain", 60]];

export default function EditBackendWebsiteDialog({ site, onClose, onSaved }) {
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});
  const initial = { name: site.name, slug: site.slug, subdomain: site.subdomain || "" };
  const [values, setValues] = useState(initial);
  async function save() {
    if (lock.current) return;
    // Send only fields that changed.
    const input = {};
    for (const [field] of fields) if (values[field].trim() !== initial[field]) input[field] = values[field];
    const { errors: found } = validateSiteEdit(input);
    setErrors(found); setError("");
    if (Object.keys(found).length) { if (found.form) setError(found.form); return; }
    lock.current = true; setBusy(true);
    try {
      const response = await fetch(`/api/tenants/${encodeURIComponent(site.tenantId)}/sites/${encodeURIComponent(site.id)}`, { method: "PATCH", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(input) });
      const data = await response.json();
      if (!response.ok) { setErrors(data.errors || {}); setError(data.error || "Unable to update the website."); }
      else { onSaved(); return; }
    } catch {
      setError("Unable to confirm the update. Refresh websites to check the saved details before retrying.");
    }
    lock.current = false; setBusy(false);
  }
  return <BuilderDialog title="Edit website" confirmLabel={busy ? "Saving..." : "Save changes"} busy={busy} onConfirm={save} onCancel={onClose}>
    <form onSubmit={(event) => { event.preventDefault(); save(); }} className="space-y-5" noValidate>
      {fields.map(([field, label, limit]) => <div key={field}><label htmlFor={`edit-site-${field}`} className="mb-2 block font-semibold">{label}</label><input id={`edit-site-${field}`} name={field} value={values[field]} onChange={(event) => setValues((current) => ({ ...current, [field]: event.target.value }))} maxLength={limit} disabled={busy} aria-invalid={!!errors[field]} aria-describedby={errors[field] ? `edit-site-${field}-error` : undefined} className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm" />{errors[field] && <p id={`edit-site-${field}-error`} className="mt-2 text-xs text-red-600">{errors[field]}</p>}</div>)}
      <button type="submit" className="sr-only" tabIndex={-1} disabled={busy}>Save changes</button>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    </form>
  </BuilderDialog>;
}
