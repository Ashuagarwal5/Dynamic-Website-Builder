"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useSession } from "../auth/SessionProvider";
import Dropdown from "../ui/Dropdown";

export default function TenantSwitcher({ mobile = false }) {
  const session = useSession();
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const id = mobile ? "mobile-branch" : "desktop-branch";
  const value = session.activeBranch
    ? `${session.activeBranch.kind}:${session.activeBranch.id}`
    : "";
  function changeBranch(selection) {
    if (pending || !selection || selection === value) return;
    setError("");
    startTransition(async () => {
      try {
        await session.selectBranch(selection);
      } catch (problem) {
        setError(problem.message || "Unable to switch branches.");
      }
    });
  }
  return (
    <div className="mx-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
      {session.branches.length ? (
        <div>
          <label
            htmlFor={id}
            id={`${id}-label`}
            className="mb-2 block text-xs font-semibold text-slate-500"
          >
            Active branch
          </label>
          <Dropdown
            id={id}
            name="branch"
            value={value}
            onChange={changeBranch}
            disabled={pending}
            aria-describedby={`${id}-status`}
            aria-labelledby={`${id}-label`}
            placeholder="Select a branch"
            className="w-full"
            options={session.branches.map((branch) => ({
              value: branch.key,
              label: branch.city
                ? `${branch.name} — ${branch.city}`
                : branch.name,
            }))}
          />
          <p
            id={`${id}-status`}
            role="status"
            className="mt-2 text-xs text-slate-500"
          >
            {pending ? "Switching…" : "Selection applies automatically."}
          </p>
          {error && (
            <p role="alert" className="mt-2 text-xs text-red-600">
              {error}
            </p>
          )}
        </div>
      ) : (
        <p className="text-xs text-slate-500">
          Create a branch to get started.
        </p>
      )}
      <Link
        href="/dashboard/tenants"
        className="mt-2 block text-xs font-semibold text-blue-600"
      >
        Manage branches
      </Link>
    </div>
  );
}
