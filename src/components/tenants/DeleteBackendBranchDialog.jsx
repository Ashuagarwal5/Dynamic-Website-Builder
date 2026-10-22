"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import BuilderDialog from "../builder/BuilderDialog";

export default function DeleteBackendBranchDialog({ branch, selected, onClose, onDeleted }) {
  const router = useRouter();
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function confirm() {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError("");
    try {
      const response = await fetch(`/api/tenants/${encodeURIComponent(branch.id)}`, { method: "DELETE", headers: { Accept: "application/json" } });
      const data = await response.json();
      if (!response.ok) setError(data.error || "Unable to delete this branch.");
      else { onDeleted(); router.refresh(); return; }
    } catch { setError("Unable to confirm deletion. Refresh branches to check whether it was deleted before retrying."); }
    lock.current = false; setBusy(false);
  }
  return <BuilderDialog title="Delete branch?" confirmLabel={busy ? "Deleting..." : "Delete branch"} dangerous busy={busy} onConfirm={confirm} onCancel={onClose}>
    <p>Delete <strong>{branch.name}</strong>? The branch will be removed from the list after the server confirms deletion.</p>
    {selected && <p className="mt-3">This is your current branch. The workspace will select another active branch if one is available.</p>}
    {error && <p role="alert" className="mt-3 text-red-600">{error}</p>}
  </BuilderDialog>;
}
