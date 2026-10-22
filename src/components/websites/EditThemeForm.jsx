"use client";
import { useRef, useState } from "react";
import { validateThemeInput } from "../../lib/site-theme";

export default function EditThemeForm({ tenantId, siteId, theme, onSaved }) {
  const [values, setValues] = useState(theme || { primaryColor: "", secondaryColor: "", accentColor: "", fontFamily: "", borderRadius: "" });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  async function submit(event) {
    event.preventDefault();
    if (lock.current) return;
    const checked = validateThemeInput(values);
    setErrors(checked.errors); setError("");
    if (Object.keys(checked.errors).length) return;
    lock.current = true; setBusy(true);
    try {
      const response = await fetch(`/api/tenants/${encodeURIComponent(tenantId)}/sites/${encodeURIComponent(siteId)}/theme`, { method: "PATCH", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(checked.payload) });
      const data = await response.json();
      if (!response.ok) { setErrors(data.errors || {}); setError(data.error || "Unable to save the theme."); }
      else { onSaved(); return; }
    } catch { setError("Unable to confirm the update. Refresh the theme before retrying."); }
    finally { lock.current = false; setBusy(false); }
  }
  return <form onSubmit={submit} noValidate className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6">
    <h2 className="text-xl font-semibold">{theme ? "Edit theme" : "Create theme"}</h2>
    <fieldset disabled={busy} className="grid gap-5 sm:grid-cols-2"><legend className="sr-only">Colors, typography, and corner radius</legend>
      {[["primaryColor", "Primary color", "#6D28D9"], ["secondaryColor", "Secondary color", "#1E293B"], ["accentColor", "Accent color", "#F59E0B"], ["fontFamily", "Font family", "Inter"], ["borderRadius", "Corner radius", "12px"]].map(([key, label, placeholder]) => <div key={key}>
        <label htmlFor={`theme-${key}`} className="mb-2 block text-sm font-semibold">{label} *</label>
        <div className="flex items-center gap-3">{key.endsWith("Color") && <span aria-hidden="true" className="size-10 shrink-0 rounded-lg border border-slate-200" style={{ backgroundColor: /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(values[key]) ? values[key] : "transparent" }} />}<input id={`theme-${key}`} name={key} value={values[key]} onChange={(event) => setValues((current) => ({ ...current, [key]: event.target.value }))} required maxLength={key.endsWith("Color") ? 9 : 120} placeholder={placeholder} aria-invalid={!!errors[key]} aria-describedby={errors[key] ? `theme-${key}-error` : undefined} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" /></div>
        {errors[key] && <p id={`theme-${key}-error`} className="mt-2 text-xs text-red-600">{errors[key]}</p>}
      </div>)}
    </fieldset>
    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    <div className="flex flex-wrap gap-3"><button type="submit" disabled={busy} className="rounded-lg bg-[#0987F5] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Saving..." : "Save theme"}</button><button type="button" disabled={busy} onClick={() => { setValues(theme || { primaryColor: "", secondaryColor: "", accentColor: "", fontFamily: "", borderRadius: "" }); setErrors({}); setError(""); }} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold disabled:opacity-50">Reset changes</button></div>
  </form>;
}
