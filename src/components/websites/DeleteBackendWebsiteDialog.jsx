"use client";
import { useRef, useState } from "react";
import BuilderDialog from "../builder/BuilderDialog";

export default function DeleteBackendWebsiteDialog({ site, onClose, onDeleted }) {
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [typed, setTyped] = useState("");
  async function confirm() {
    if (lock.current) return;
    if (typed.trim() !== site.name) { setError("Type the website name exactly to confirm."); return; }
    lock.current = true; setBusy(true); setError("");
    try {
      const response = await fetch(`/api/tenants/${encodeURIComponent(site.tenantId)}/sites/${encodeURIComponent(site.id)}`, { method: "DELETE", headers: { Accept: "application/json" } });
      const data = await response.json();
      if (!response.ok) setError(data.error || "Unable to delete this website.");
      else { onDeleted(); return; }
    } catch { setError("Unable to confirm deletion. Refresh websites to check whether it was deleted before retrying."); }
    lock.current = false; setBusy(false);
  }
  return <BuilderDialog title="Delete website?" confirmLabel={busy ? "Deleting..." : "Delete website"} dangerous busy={busy} onConfirm={confirm} onCancel={onClose}>
    <p>Delete <strong>{site.name}</strong>? It disappears from the list after the server confirms deletion. This cannot be undone.</p>
    {site.status === "PUBLISHED" && <p className="mt-3 text-amber-800">This website is published. Deleting it removes it from public access.</p>}
    <label htmlFor="delete-site-confirm" className="mt-4 block text-sm font-semibold">Type <span className="font-bold">{site.name}</span> to confirm</label>
    <input id="delete-site-confirm" value={typed} onChange={(event) => setTyped(event.target.value)} disabled={busy} autoComplete="off" className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3 text-sm" />
    {error && <p role="alert" className="mt-3 text-red-600">{error}</p>}
  </BuilderDialog>;
}
