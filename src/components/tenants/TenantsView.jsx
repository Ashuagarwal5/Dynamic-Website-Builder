"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import {
  Building2,
  MapPin,
  Plus,
  ArrowRight,
  Check,
  Pencil,
  Trash2,
  LayoutGrid,
  List,
} from "lucide-react";
import { useSession } from "../auth/SessionProvider";

export default function TenantsView() {
  const session = useSession();
  const [error, setError] = useState("");
  const [view, setView] = useState("table");
  const [pending, startTransition] = useTransition();
  const activeKey = session.activeBranch
    ? `${session.activeBranch.kind}:${session.activeBranch.id}`
    : "";
  function activate(key) {
    if (pending) return;
    setError("");
    startTransition(async () => {
      try {
        if (key !== activeKey) await session.selectBranch(key);
      } catch (problem) {
        setError(problem.message || "Unable to switch branches.");
      }
    });
  }
  return (
    <main className="space-y-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-bold tracking-widest text-blue-600">
            YOUR LOCATIONS
          </p>
          <h1 className="text-3xl font-bold">Branches</h1>
          <p className="mt-2 text-sm text-slate-500">
            Manage your locations and choose where you want to work.
          </p>
        </div>
        <Link
          href="/dashboard/tenants/new"
          className="inline-flex items-center gap-2 rounded-lg bg-[#0987F5] px-4 py-3 text-sm font-semibold text-white"
        >
          <Plus size={18} aria-hidden="true" />
          Create branch
        </Link>
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      {pending && (
        <p role="status" className="sr-only">
          Switching branch...
        </p>
      )}
      {session.branches.length ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-500">
              {session.branches.length}{" "}
              {session.branches.length === 1 ? "branch" : "branches"}. Each
              branch has its own websites.
            </p>
            <div
              role="group"
              aria-label="Branch view"
              className="inline-flex gap-1 rounded-xl border border-slate-200 bg-white p-1"
            >
              {[
                ["table", "Table", List],
                ["cards", "Cards", LayoutGrid],
              ].map(([value, label, Icon]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={view === value}
                  onClick={() => setView(value)}
                  className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${view === value ? "bg-blue-50 text-blue-700" : "text-slate-500 hover:bg-slate-50"}`}
                >
                  <Icon size={16} aria-hidden="true" />
                  {label}
                </button>
              ))}
            </div>
          </div>
          {view === "table" ? (
            <div
              role="region"
              aria-label="Branches table"
              tabIndex={0}
              className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm focus-visible:outline-2 focus-visible:outline-blue-500"
            >
              <table className="w-full min-w-[760px] text-left text-sm">
                <caption className="sr-only">
                  Branches with slug, location, role, selection status, and
                  management actions
                </caption>
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    {[
                      "Branch",
                      "Slug",
                      "Location",
                      "Role",
                      "Switch branch",
                      "Actions",
                    ].map((label) => (
                      <th
                        key={label}
                        scope="col"
                        className="px-5 py-4 font-semibold"
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {session.branches.map((branch) => {
                    const active = branch.key === activeKey;
                    return (
                      <tr
                        key={branch.key}
                        className={
                          active ? "bg-blue-50/40" : "hover:bg-slate-50/70"
                        }
                      >
                        <th
                          scope="row"
                          className="max-w-64 break-words px-5 py-4 font-semibold text-slate-800"
                        >
                          {branch.name}
                        </th>
                        <td className="max-w-48 break-words px-5 py-4 text-slate-500">
                          {branch.slug || "—"}
                        </td>
                        <td className="max-w-60 px-5 py-4 text-slate-500">
                          <span className="block break-words">
                            {branch.city || "—"}
                          </span>
                          {branch.address && (
                            <span className="mt-1 block whitespace-pre-wrap break-words text-xs">
                              {branch.address}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-slate-500">
                          {branch.role || "—"}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              role="switch"
                              aria-checked={active}
                              aria-label={`Use ${branch.name} as active branch`}
                              aria-disabled={active || pending}
                              disabled={pending}
                              title={
                                active
                                  ? "Current branch. Select another branch to switch."
                                  : `Switch to ${branch.name}`
                              }
                              onClick={() => {
                                if (!active) activate(branch.key);
                              }}
                              className={`inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-500 disabled:opacity-50 ${active ? "bg-[#0987F5]" : "bg-slate-300 hover:bg-slate-400"}`}
                            >
                              <span
                                className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform motion-reduce:transition-none ${active ? "translate-x-5" : "translate-x-0"}`}
                              />
                            </button>
                          </div>
                        </td>
                        <td className="w-40 px-5 py-3">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              disabled
                              aria-label={`Edit branch ${branch.name}`}
                              title="Branch editing is not available yet"
                              className="inline-flex size-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-blue-50 hover:text-blue-600 focus-visible:outline-2 focus-visible:outline-blue-500 disabled:opacity-50"
                            >
                              <Pencil size={17} aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              disabled
                              aria-label={`Delete branch ${branch.name}`}
                              title="Branch deletion is not available yet"
                              className="inline-flex size-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:outline-2 focus-visible:outline-red-500 disabled:opacity-50"
                            >
                              <Trash2 size={17} aria-hidden="true" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {session.branches.map((branch) => {
                const active = branch.key === activeKey;
                return (
                  <article
                    key={branch.key}
                    className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="rounded-xl bg-blue-50 p-3 text-blue-600">
                        <Building2 size={24} aria-hidden="true" />
                      </span>
                      {active && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                          <Check size={13} aria-hidden="true" />
                          Active branch
                        </span>
                      )}
                    </div>
                    <h2 className="mt-5 break-words text-lg font-semibold">
                      {branch.name}
                    </h2>
                    {branch.city && (
                      <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                        <MapPin
                          size={15}
                          className="shrink-0"
                          aria-hidden="true"
                        />
                        <span className="break-words">{branch.city}</span>
                      </p>
                    )}
                    {branch.address && (
                      <p className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-500">
                        {branch.address}
                      </p>
                    )}
                    <div className="mt-auto pt-6">
                      {active ? (
                        <Link
                          href="/dashboard/websites"
                          className="inline-flex items-center gap-2 rounded-lg bg-[#0987F5] px-4 py-2.5 text-sm font-semibold text-white"
                        >
                          Manage websites
                          <ArrowRight size={15} aria-hidden="true" />
                        </Link>
                      ) : (
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => activate(branch.key)}
                          className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
                        >
                          Switch to branch
                        </button>
                      )}
                    </div>
                    <div className="mt-4 flex gap-2 border-t border-slate-100 pt-3">
                      <button
                        type="button"
                        disabled
                        aria-label={`Edit branch ${branch.name}`}
                        title="Branch editing is not available yet" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Pencil size={14} aria-hidden="true" />
                        Edit branch
                      </button>
                      <button
                        type="button"
                        disabled
                        aria-label={`Delete branch ${branch.name}`}
                        title="Branch deletion is not available yet" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Trash2 size={14} aria-hidden="true" />
                        Delete
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <Building2
            size={30}
            className="mx-auto text-blue-500"
            aria-hidden="true"
          />
          <h2 className="mt-4 text-lg font-semibold">
            Create your first branch
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Add a location to start managing its websites.
          </p>
          <Link
            href="/dashboard/tenants/new"
            className="mt-5 inline-flex rounded-lg bg-[#0987F5] px-4 py-2.5 text-sm font-semibold text-white"
          >
            Create branch
          </Link>
        </div>
      )}
    </main>
  );
}
