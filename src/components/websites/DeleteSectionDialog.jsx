"use client";
import { useRef, useState } from "react";
import BuilderDialog from "../builder/BuilderDialog";

export default function DeleteSectionDialog({ tenantId, siteId, pageId, section, onClose, onDeleted }) {
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const label = typeof section.config.heading === "string" && section.config.heading ? section.config.heading : typeof section.config.title === "string" && section.config.title ? section.config.title : section.type.replaceAll("_", " ");
  async function confirm() {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError("");
    try {
      const response = await fetch(`/api/tenants/${encodeURIComponent(tenantId)}/sites/${encodeURIComponent(siteId)}/pages/${encodeURIComponent(pageId)}/sections/${encodeURIComponent(section.id)}`, { method: "DELETE", headers: { Accept: "application/json" } });
      const data = await response.json();
      if (!response.ok) setError(data.error || "Unable to delete this section.");
      else { onDeleted(); return; }
    } catch { setError("Unable to confirm deletion. Refresh sections before retrying."); }
    lock.current = false; setBusy(false);
  }
  return <BuilderDialog title="Delete section?" confirmLabel={busy ? "Deleting..." : "Delete section"} dangerous busy={busy} onConfirm={confirm} onCancel={onClose}>
    <p>Delete <strong>{label}</strong> from this page? It will be removed from the list after the server confirms deletion.</p>
    {error && <p role="alert" className="mt-3 text-red-600">{error}</p>}
  </BuilderDialog>;
}
