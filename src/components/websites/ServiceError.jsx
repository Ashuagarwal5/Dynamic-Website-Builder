"use client";
import { useState } from "react";
import { exportSavedSites } from "../../lib/site-service";
export default function ServiceError({ error, onRetry }) {
  const [backupError, setBackupError] = useState("");
  async function download() {
    try {
      const raw = await exportSavedSites();
      const url = URL.createObjectURL(
        new Blob([raw], { type: "application/json" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = "website-storage-backup.json";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (problem) {
      setBackupError(problem.message);
    }
  }
  return (
    <div
      role="alert"
      className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800"
    >
      <p>{error.message || "Unable to load websites. Please retry."}</p>
      <div className="mt-4 flex flex-wrap gap-3">
        {onRetry && (
          <button type="button" onClick={onRetry} className="admin-secondary">
            Retry
          </button>
        )}
        {error.code === "CORRUPT_STORAGE" && (
          <button type="button" onClick={download} className="admin-secondary">
            Download saved data backup
          </button>
        )}
      </div>
      {backupError && <p className="mt-3">{backupError}</p>}
    </div>
  );
}
