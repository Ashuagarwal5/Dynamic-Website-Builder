"use client";
import { useEffect, useRef } from "react";
export default function BuilderDialog({
  title,
  children,
  confirmLabel,
  onConfirm,
  onCancel,
  dangerous = false,
  busy = false,
}) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby="builder-dialog-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onCancel();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-[#06325E] shadow-xl backdrop:bg-[#06325E]/40"
    >
      <h2 id="builder-dialog-title" className="text-xl font-bold">
        {title}
      </h2>
      <div className="mt-4 text-sm leading-6 text-slate-600">{children}</div>
      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <button
          type="button"
          autoFocus
          disabled={busy}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#06325E] hover:bg-slate-50"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={busy}
          className={
            dangerous
              ? "rounded-lg bg-red-700 px-4 py-2.5 text-sm font-semibold text-white"
              : "inline-flex items-center justify-center gap-2 rounded-lg bg-[#0879dc] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#06325E]"
          }
          onClick={onConfirm}
        >
          {confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
