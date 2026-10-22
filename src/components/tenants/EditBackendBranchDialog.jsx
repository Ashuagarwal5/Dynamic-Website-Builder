"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import BuilderDialog from "../builder/BuilderDialog";

export default function EditBackendBranchDialog({ branch, onClose, onSaved }) {
  const router = useRouter();
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});
  const [values, setValues] = useState({ name: branch.name, slug: branch.slug });
  async function save() {
    if (lock.current) return;
    const name = values.name.trim();
    const slug = values.slug.trim();
    const fields = {};
    if (!name || name.length > 120) fields.name = "Enter a branch name of at most 120 characters.";
    if (slug.length < 3 || slug.length > 60 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) fields.slug = "Use 3-60 lowercase letters, numbers, or single hyphens between words.";
    setErrors(fields); setError("");
    if (Object.keys(fields).length) return;
    lock.current = true; setBusy(true);
    try {
      const response = await fetch(`/api/tenants/${encodeURIComponent(branch.id)}`, { method: "PATCH", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ name, slug }) });
      const data = await response.json();
      if (!response.ok) { setErrors(data.errors || {}); setError(data.error || "Unable to update the branch."); }
      else { onSaved(); router.refresh(); return; }
    } catch {
      setError("Unable to confirm the update. Refresh branches to check the saved details before retrying.");
    }
    lock.current = false; setBusy(false);
  }
  return <BuilderDialog title="Edit branch" confirmLabel={busy ? "Saving..." : "Save changes"} busy={busy} onConfirm={save} onCancel={onClose}>
    <form onSubmit={(event) => { event.preventDefault(); save(); }} className="space-y-5" noValidate>
      {[["name", "Branch name", 120], ["slug", "Branch slug", 60]].map(([field, label, limit]) => <div key={field}><label htmlFor={`edit-branch-${field}`} className="mb-2 block font-semibold">{label} <span className="text-red-500">*</span></label><input id={`edit-branch-${field}`} name={field} value={values[field]} onChange={(event) => setValues((current) => ({ ...current, [field]: event.target.value }))} required maxLength={limit} disabled={busy} aria-invalid={!!errors[field]} aria-describedby={errors[field] ? `edit-branch-${field}-error` : undefined} className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm" />{errors[field] && <p id={`edit-branch-${field}-error`} className="mt-2 text-xs text-red-600">{errors[field]}</p>}</div>)}
      <button type="submit" className="sr-only" tabIndex={-1} disabled={busy}>Save changes</button>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    </form>
  </BuilderDialog>;
}
