"use client";
import { useRef, useState } from "react";
import BuilderDialog from "../builder/BuilderDialog";
import { publishSite, unpublishSite } from "../../lib/site-service";
import { useSession } from "../auth/SessionProvider";

export default function PublishWebsiteDialog({ site, onClose, onUpdated }) {
  const scope = useSession()?.websiteScope;
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function confirm() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const updated = await (site.published ? unpublishSite : publishSite)(
        site.slug,
        scope,
      );
      onUpdated(updated);
    } catch (problem) {
      setError(problem.message);
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <BuilderDialog
      title={site.published ? "Unpublish website?" : "Publish website?"}
      confirmLabel={
        busy ? "Working…" : site.published ? "Unpublish" : "Publish"
      }
      dangerous={site.published}
      busy={busy}
      onConfirm={confirm}
      onCancel={onClose}
    >
      <p className="break-words">
        {site.published ? (
          <>
            Unpublish <strong>{site.name}</strong> to make its public preview
            unavailable. Your saved draft stays available for editing and can be
            published again.
          </>
        ) : (
          <>
            Publish the saved draft of <strong>{site.name}</strong> to make it
            available at its public preview URL.
          </>
        )}
      </p>
      {error && (
        <p role="alert" className="mt-3 text-red-700">
          {error}
        </p>
      )}
    </BuilderDialog>
  );
}
