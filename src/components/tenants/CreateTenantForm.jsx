"use client";

import Link from "next/link";
import { startTransition, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Building2 } from "lucide-react";

export default function CreateTenantForm() {
  const router = useRouter();
  const [state, setState] = useState({ errors: {}, error: "", values: {} });
  const [pending, setPending] = useState(false);
  const submitting = useRef(false);
  async function submit(event) {
    event.preventDefault();
    if (submitting.current) return;
    const form = new FormData(event.currentTarget);
    const values = {
      name: form.get("name").trim(),
      slug: form.get("slug").trim(),
    };
    submitting.current = true;
    setPending(true);
    setState({ errors: {}, error: "", values });
    try {
      const response = await fetch("/api/tenants", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(values),
      });
      const data = await response.json();
      if (!response.ok) {
        setState({
          errors: data.errors || {},
          error: data.error || "Unable to create the branch.",
          values,
        });
      } else {
        // Refresh the shared membership list without reloading the document.
        startTransition(() => {
          router.replace("/dashboard/tenants");
          router.refresh();
        });
        return;
      }
    } catch {
      setState({
        errors: {},
        error:
          "Unable to confirm creation. Check the Branches page before retrying to avoid a duplicate.",
        values,
      });
    }
    submitting.current = false;
    setPending(false);
  }
  return (
    <main className="space-y-6">
      <Link
        href="/dashboard/tenants"
        className="inline-flex items-center gap-2 text-sm text-slate-500"
      >
        <ArrowLeft size={16} />
        Back to branches
      </Link>
      <div>
        <h1 className="text-3xl font-bold">Create a branch</h1>
        <p className="mt-2 text-sm text-slate-500">
          Give each location its own identity.
        </p>
      </div>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <form
          onSubmit={submit}
          className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7"
        >
          <div className="flex items-center gap-3">
            <Building2 size={22} className="text-blue-600" />
            <h2 className="text-lg font-semibold">Branch details</h2>
          </div>
          <fieldset disabled={pending} className="grid gap-5 sm:grid-cols-2">
            <legend className="sr-only">Branch name and slug</legend>
            {[
              ["name", "Branch name", "e.g. Jaipur Pharma", 120],
              ["slug", "Branch slug", "e.g. jaipur-pharma", 60],
            ].map(([name, label, placeholder, limit]) => (
              <div key={name}>
                <label
                  htmlFor={name}
                  className="mb-2 block text-sm font-semibold"
                >
                  {label} <span className="text-red-500">*</span>
                </label>
                <input
                  id={name}
                  name={name}
                  required
                  maxLength={limit}
                  minLength={name === "slug" ? 3 : undefined}
                  pattern={
                    name === "slug" ? "[a-z0-9]+(-[a-z0-9]+)*" : undefined
                  }
                  defaultValue={state.values[name] || ""}
                  placeholder={placeholder}
                  aria-invalid={!!state.errors[name]}
                  aria-describedby={
                    state.errors[name]
                      ? `${name}-error`
                      : name === "slug"
                        ? "slug-help"
                        : undefined
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm"
                />
                {name === "slug" && (
                  <p id="slug-help" className="mt-2 text-xs text-slate-500">
                    Use lowercase letters, numbers, and hyphens, such as
                    jaipur-pharma.
                  </p>
                )}
                {state.errors[name] && (
                  <p id={`${name}-error`} className="mt-2 text-xs text-red-600">
                    {state.errors[name]}
                  </p>
                )}
              </div>
            ))}
          </fieldset>
          <p className="rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-600">
            Each branch has its own websites. After creating a branch, select it
            to start managing its content.
          </p>
          {state.error && (
            <p role="alert" className="text-sm text-red-600">
              {state.error}{" "}
              <Link href="/dashboard/tenants" className="underline">
                View branches
              </Link>
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <button
              disabled={pending}
              className="rounded-lg bg-[#0987F5] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {pending ? "Creating..." : "Create branch"}
            </button>
            <Link
              href="/dashboard/tenants"
              className="rounded-lg border border-slate-200 px-5 py-3 text-sm font-semibold"
            >
              Cancel
            </Link>
          </div>
        </form>
        <aside className="rounded-2xl border border-blue-100 bg-blue-50 p-6">
          <h2 className="font-semibold">A workspace for each location</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Keep each location organized with its own websites, content, and
            themes. Switch branches at any time from the sidebar.
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Create a website after adding your branch to build its online
            presence.
          </p>
        </aside>
      </div>
    </main>
  );
}
