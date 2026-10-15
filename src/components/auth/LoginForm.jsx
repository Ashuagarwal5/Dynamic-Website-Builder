"use client";

import { useActionState, useState } from "react";
import { ArrowRight, Eye, EyeOff, Layers, LoaderCircle } from "lucide-react";
import { login } from "../../app/login/actions";

export default function LoginForm({ returnTo }) {
  const [state, action, pending] = useActionState(login, null);
  const [visible, setVisible] = useState(false);
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F5FAFF] px-5 py-12 text-[#06325E]">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center justify-center gap-3">
          <span className="rounded-xl bg-[#0987F5] p-3 text-white">
            <Layers size={26} aria-hidden="true" />
          </span>
          <div>
            <p className="text-xl font-bold">Site Studio</p>
            <p className="text-xs text-slate-500">Dynamic Website Builder</p>
          </div>
        </div>
        <section className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Sign in to manage your websites and workspace.
          </p>
          <form action={action} className="mt-7 space-y-5">
            <input type="hidden" name="returnTo" value={returnTo} />
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold"
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                required
                maxLength={254}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={visible ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  maxLength={1024}
                  placeholder="Enter your password"
                  className="w-full rounded-lg border border-slate-300 py-3 pl-3 pr-12 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setVisible(!visible)}
                  aria-label={visible ? "Hide password" : "Show password"}
                  aria-pressed={visible}
                  className="absolute inset-y-0 right-0 px-3 text-slate-500"
                >
                  {visible ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            {state?.error && (
              <p
                role="alert"
                className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
              >
                {state.error}
              </p>
            )}
            <button
              disabled={pending}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#0987F5] px-4 py-3 text-sm font-semibold text-white hover:bg-blue-600 disabled:cursor-wait disabled:opacity-60"
            >
              {pending ? (
                <>
                  <LoaderCircle size={18} className="animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </section>
        <p className="mt-6 text-center text-xs text-slate-500">
          Your websites. Your workspace. One place.
        </p>
      </div>
    </main>
  );
}
