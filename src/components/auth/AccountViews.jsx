"use client";

import Link from "next/link";
import { Settings, ShieldCheck, UserRound } from "lucide-react";
import { useSession } from "./SessionProvider";
import { logout } from "../../app/login/actions";

export function ProfileView({ account }) {
  const session = useSession();
  const user = { ...session?.user, ...account };
  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Your profile</h1>
        <p className="mt-2 text-sm text-slate-500">
          Your account and branches.
        </p>
      </div>
      <div className="grid items-start gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="mb-6 flex items-center gap-3">
            <span className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <UserRound size={24} />
            </span>
            <h2 className="text-lg font-semibold">Account details</h2>
          </div>
          <dl className="grid gap-6 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-slate-500">Name</dt>
              <dd className="mt-1 break-words font-semibold">
                {user.name || "Not provided"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Email address</dt>
              <dd className="mt-1 break-all font-semibold">
                {user.email}
              </dd>
            </div>
          </dl>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">Branches</h2>
          {session?.branches.length ? (
            <ul className="divide-y divide-slate-100">
              {session.branches.map((branch) => (
                <li
                  key={branch.key}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="break-words font-semibold">{branch.name}</p>
                    {branch.city && (
                      <p className="mt-1 break-words text-xs text-slate-500">
                        {branch.city}
                      </p>
                    )}
                  </div>
                  {session.activeBranch?.kind === branch.kind &&
                    session.activeBranch.id === branch.id && (
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                        Active branch
                      </span>
                    )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">No branches yet.</p>
          )}
        </section>
      </div>
    </main>
  );
}

export function SettingsView() {
  const session = useSession();
  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="mt-2 text-sm text-slate-500">
          Manage your account and current session.
        </p>
      </div>
      <div className="grid items-start gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="mb-4 flex items-center gap-3">
            <Settings size={22} className="text-blue-600" />
            <h2 className="text-lg font-semibold">Account</h2>
          </div>
          <p className="break-all text-sm text-slate-500">
            Signed in as {session?.user.email}.
          </p>
          <Link
            href="/dashboard/profile"
            className="mt-5 inline-flex rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold hover:bg-slate-50"
          >
            View profile
          </Link>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="mb-4 flex items-center gap-3">
            <ShieldCheck size={22} className="text-blue-600" />
            <h2 className="text-lg font-semibold">Session</h2>
          </div>
          <p className="text-sm leading-6 text-slate-500">
            Sign out of this browser when you have finished using your
            workspace.
          </p>
          <form action={logout}>
            <button className="mt-5 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50">
              Sign out
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
