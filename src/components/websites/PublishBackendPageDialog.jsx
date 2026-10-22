"use client";
import { useRef, useState } from "react";
import BuilderDialog from "../builder/BuilderDialog";

export default function PublishBackendPageDialog({ page, tenantId, siteId, onClose, onPublished }) {
  const unpublishing = page.status === "PUBLISHED";
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function confirm() {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError("");
    try {
      const response = await fetch(`/api/tenants/${encodeURIComponent(tenantId)}/sites/${encodeURIComponent(siteId)}/pages/${encodeURIComponent(page.id)}/${unpublishing ? "unpublish" : "publish"}`, { method: "POST", headers: { Accept: "application/json" } });
      const data = await response.json();
      if (!response.ok) setError(data.error || "Unable to change the publication status.");
      else { onPublished(); return; }
    } catch { setError("Unable to confirm the status change. Refresh pages to check the status before retrying."); }
    lock.current = false; setBusy(false);
  }
  return <BuilderDialog title={unpublishing ? "Unpublish page?" : "Publish page?"} confirmLabel={busy ? "Saving..." : unpublishing ? "Unpublish page" : "Publish page"} dangerous={unpublishing} busy={busy} onConfirm={confirm} onCancel={onClose}>
    <p>{unpublishing ? "Unpublish" : "Publish"} <strong>{page.name}</strong>? {unpublishing ? "This requests removal of the page from public access." : "Make sure its content is ready. Public availability also depends on the website being published."}</p>
    {error && <p role="alert" className="mt-3 text-red-600">{error}</p>}
  </BuilderDialog>;
}
