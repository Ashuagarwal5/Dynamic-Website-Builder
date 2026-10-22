"use client";
import { useRef, useState } from "react";
import BuilderDialog from "../builder/BuilderDialog";

export default function PublishBackendWebsiteDialog({ site, onClose, onPublished }) {
  const unpublishing = site.status === "PUBLISHED";
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function confirm() {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError("");
    try {
      const response = await fetch(`/api/tenants/${encodeURIComponent(site.tenantId)}/sites/${encodeURIComponent(site.id)}/${unpublishing ? "unpublish" : "publish"}`, { method: "POST", headers: { Accept: "application/json" } });
      const data = await response.json();
      if (!response.ok) setError(data.error || "Unable to change the publication status.");
      else { onPublished(); return; }
    } catch { setError("Unable to confirm the status change. Refresh websites to check the status before retrying."); }
    lock.current = false; setBusy(false);
  }
  return <BuilderDialog title={unpublishing ? "Unpublish website?" : "Publish website?"} confirmLabel={busy ? "Saving..." : unpublishing ? "Unpublish website" : "Publish website"} dangerous={unpublishing} busy={busy} onConfirm={confirm} onCancel={onClose}>
    <p>{unpublishing ? "Unpublish" : "Publish"} <strong>{site.name}</strong>? {unpublishing ? "This requests removal of the website from public access." : "Make sure its content and theme are ready for visitors."}</p>
    {error && <p role="alert" className="mt-3 text-red-600">{error}</p>}
  </BuilderDialog>;
}
