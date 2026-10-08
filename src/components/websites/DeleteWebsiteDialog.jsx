"use client";
import { useEffect, useRef, useState } from "react";
import { deleteSite } from "../../lib/site-service";
export default function DeleteWebsiteDialog({ site, onClose, onDeleted }) {
  const dialog = useRef(null),
    lock = useRef(false);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    return () => element.close();
  }, []);
  async function confirm() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      await deleteSite(site.slug);
      await onDeleted(site);
    } catch (problem) {
      setError(problem.message);
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <dialog
      ref={dialog}
      aria-labelledby="delete-title"
      aria-describedby="delete-description"
      onCancel={(event) => {
        event.preventDefault();
        if (!lock.current) onClose();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-[#06325E] shadow-xl backdrop:bg-[#06325E]/40"
    >
      <h2 id="delete-title" className="text-xl font-bold">
        Delete website?
      </h2>
      <p
        id="delete-description"
        className="mt-4 break-words text-sm leading-6 text-slate-600"
      >
        Deleting <strong>{site.name}</strong> removes this website and its draft
        and published content from the saved mock data in this browser. This
        cannot be undone.
      </p>
      {error && (
        <p role="alert" className="mt-4 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <button
          autoFocus
          disabled={busy}
          type="button"
          className="admin-secondary"
          onClick={onClose}
        >
          Cancel
        </button>
        <button
          disabled={busy}
          type="button"
          className="rounded-lg bg-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-800"
          onClick={confirm}
        >
          {busy ? "Deleting..." : "Delete website"}
        </button>
      </div>
    </dialog>
  );
}
