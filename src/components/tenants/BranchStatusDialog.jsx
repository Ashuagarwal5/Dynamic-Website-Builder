"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import BuilderDialog from "../builder/BuilderDialog";

export default function BranchStatusDialog({ branch, selected, onClose, onSaved }) {
  const router = useRouter();
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const activating = !branch.isActive;
  async function confirm() {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError("");
    try {
      const response = await fetch(`/api/tenants/${encodeURIComponent(branch.id)}/status`, { method: "PATCH", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ isActive: activating }) });
      const data = await response.json();
      if (!response.ok) setError(data.error || "Unable to change branch status.");
      else { onSaved(); router.refresh(); return; }
    } catch { setError("Unable to confirm the status change. Refresh branches before retrying."); }
    lock.current = false; setBusy(false);
  }
  return <BuilderDialog title={activating ? "Activate branch?" : "Deactivate branch?"} confirmLabel={busy ? "Saving..." : activating ? "Activate branch" : "Deactivate branch"} dangerous={!activating} busy={busy} onConfirm={confirm} onCancel={onClose}>
    <p>{activating ? "Activate" : "Deactivate"} <strong>{branch.name}</strong>? {activating ? "It will be available in the branch selector again." : "It will no longer be available in the branch selector."}</p>
    {!activating && selected && <p className="mt-3">This is your current branch. The workspace will select another active branch if one is available.</p>}
    {error && <p role="alert" className="mt-3 text-red-600">{error}</p>}
  </BuilderDialog>;
}
