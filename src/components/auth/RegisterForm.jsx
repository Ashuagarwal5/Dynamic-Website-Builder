"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ArrowRight, Layers, LoaderCircle } from "lucide-react";
import { register } from "../../app/register/actions";

const inputClass = "w-full rounded-lg border border-slate-300 px-3 py-3 text-sm";

function Field({ id, label, hint, ...props }) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-semibold">{label}</label>
      <input id={id} name={id} className={inputClass} {...props} />
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export default function RegisterForm() {
  const [state, action, pending] = useActionState(register, null);
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F5FAFF] px-5 py-12 text-[#06325E]">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center justify-center gap-3">
          <span className="rounded-xl bg-[#0987F5] p-3 text-white"><Layers size={26} aria-hidden="true" /></span>
          <div>
            <p className="text-xl font-bold">Site Studio</p>
            <p className="text-xs text-slate-500">Dynamic Website Builder</p>
          </div>
        </div>
        <section className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">Start building and managing your websites.</p>
          <form action={action} className="mt-7 space-y-5">
            <Field id="name" label="Full name" required maxLength={120} autoComplete="name" />
            <Field id="email" label="Email address" type="email" required maxLength={254} autoComplete="username" placeholder="you@example.com" />
            <Field id="password" label="Password" type="password" required minLength={8} maxLength={1024} autoComplete="new-password" hint="At least 8 characters." />
            <fieldset className="space-y-5 rounded-lg border border-slate-200 p-4">
              <legend className="px-1 text-xs font-semibold text-slate-500">First branch (optional)</legend>
              <Field id="tenantName" label="Branch name" maxLength={120} placeholder="Jaipur Pharma" />
              <Field id="tenantSlug" label="Branch slug" maxLength={60} placeholder="jaipur-pharma" hint="Lowercase letters, numbers and hyphens." />
            </fieldset>
            {state?.error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}
            <button disabled={pending} className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#0987F5] px-4 py-3 text-sm font-semibold text-white hover:bg-blue-600 disabled:cursor-wait disabled:opacity-60">
              {pending ? <><LoaderCircle size={18} className="animate-spin" />Creating account…</> : <>Create account<ArrowRight size={18} /></>}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account? <Link href="/login" className="font-semibold text-blue-600">Sign in</Link>
          </p>
        </section>
      </div>
    </main>
  );
}
