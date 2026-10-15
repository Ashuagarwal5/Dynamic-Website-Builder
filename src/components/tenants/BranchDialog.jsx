"use client";
import { useRef, useState } from "react";
import BuilderDialog from "../builder/BuilderDialog";
import { useSession } from "../auth/SessionProvider";
import { validateBranchDraft } from "../../lib/tenant-drafts";

export default function BranchDialog({ branch, deleting = false, onClose }) {
  const session = useSession();
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});
  const [values, setValues] = useState({
    name: branch.name,
    city: branch.city || "",
    address: branch.address || "",
  });
  async function confirm() {
    if (lock.current) return;
    setError("");
    if (!deleting) {
      const fields = validateBranchDraft(values);
      setErrors(fields);
      if (Object.keys(fields).length) return;
    }
    lock.current = true;
    setBusy(true);
    try {
      if (deleting) await session.deleteBranch(branch.key);
      else await session.updateBranch(branch.key, values);
      onClose();
    } catch (problem) {
      setError(problem.message || "Unable to save branch changes.");
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <BuilderDialog
      title={deleting ? "Delete branch?" : "Edit branch"}
      confirmLabel={
        busy ? "Working..." : deleting ? "Delete branch" : "Save changes"
      }
      dangerous={deleting}
      busy={busy}
      onConfirm={confirm}
      onCancel={onClose}
    >
      {deleting ? (
        <p className="break-words">
          Delete <strong>{branch.name}</strong>? Only empty branches can be
          deleted. If this is your active branch, the workspace will switch to
          another available branch.
        </p>
      ) : (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            confirm();
          }}
          className="space-y-4"
          noValidate
        >
          {[
            ["name", "Branch name", 120],
            ["city", "City", 100],
            ["address", "Address (optional)", 500],
          ].map(([field, label, limit]) => {
            const Control = field === "address" ? "textarea" : "input";
            return (
              <div key={field}>
                <label
                  htmlFor={`edit-branch-${field}`}
                  className="mb-1.5 block text-sm font-semibold text-slate-700"
                >
                  {label}
                  {field !== "address" && " *"}
                </label>
                <Control
                  id={`edit-branch-${field}`}
                  value={values[field]}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      [field]: event.target.value,
                    }))
                  }
                  disabled={busy}
                  required={field !== "address"}
                  maxLength={limit}
                  rows={field === "address" ? 3 : undefined}
                  aria-invalid={!!errors[field]}
                  aria-describedby={
                    errors[field] ? `edit-branch-${field}-error` : undefined
                  }
                  className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm ${errors[field] ? "border-red-400" : "border-slate-300"}`}
                />
                {errors[field] && (
                  <p
                    id={`edit-branch-${field}-error`}
                    className="mt-1 text-xs text-red-600"
                  >
                    {errors[field]}
                  </p>
                )}
              </div>
            );
          })}
          <button
            type="submit"
            className="hidden"
            tabIndex={-1}
            aria-hidden="true"
          >
            Save changes
          </button>
        </form>
      )}
      {error && (
        <p role="alert" className="mt-4 text-sm text-red-700">
          {error}
        </p>
      )}
    </BuilderDialog>
  );
}
