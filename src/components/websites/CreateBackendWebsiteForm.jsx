"use client";
import Link from "next/link";
import { useRef, useState, startTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Globe } from "lucide-react";
import { useSession } from "../auth/SessionProvider";

export default function CreateBackendWebsiteForm({ templateId = null }) {
  const session = useSession();
  const branch = session.activeBranch;
  const router = useRouter();
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});
  const [pending, setPending] = useState(false);
  const lock = useRef(false);
  if (!branch) return <main className="rounded-2xl border border-slate-200 bg-white p-8"><h1 className="text-2xl font-bold">Choose a branch first</h1><Link href="/dashboard/tenants" className="mt-4 inline-block font-semibold text-blue-600">Manage branches</Link></main>;
  async function submit(event) {
    event.preventDefault();
    if (lock.current) return;
    const form = new FormData(event.currentTarget);
    const payload = { name: form.get("name").trim(), slug: form.get("slug").trim() };
    lock.current = true;
    setPending(true);
    setError("");
    setErrors({});
    try {
      const response = await fetch(`/api/tenants/${encodeURIComponent(branch.id)}/sites${templateId ? "/from-template" : ""}`, {
        method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(templateId ? { ...payload, templateId } : payload),
      });
      const data = await response.json();
      if (response.ok) {
        // Open the editor right away; a partial setup is reported there.
        const target = templateId && data.siteId ? `/dashboard/websites/${encodeURIComponent(data.siteId)}/edit?tenantId=${encodeURIComponent(branch.id)}${data.warnings?.length ? "&setup=partial" : ""}` : "/dashboard/websites";
        startTransition(() => { router.replace(target); router.refresh(); });
        return;
      }
      setErrors(data.errors || {});
      setError(data.error || "Unable to create this website.");
    } catch {
      setError("Unable to confirm creation. Check My Websites before retrying to avoid a duplicate.");
    }
    lock.current = false;
    setPending(false);
  }
  return <main className="mx-auto max-w-3xl space-y-6">
    <Link href="/dashboard/websites" className="inline-flex items-center gap-2 text-sm text-slate-500"><ArrowLeft size={16} aria-hidden="true" />Back to websites</Link>
    <div><h1 className="text-3xl font-bold">Create a website</h1><p className="mt-2 text-sm text-slate-500">Add a website to <span className="font-semibold">{branch.name}</span>.</p></div>
    <form onSubmit={submit} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
      <div className="flex items-center gap-3"><Globe size={22} className="text-blue-600" aria-hidden="true" /><h2 className="text-lg font-semibold">Website details</h2></div>
      {templateId && <p className="rounded-lg bg-blue-50 p-3 text-sm text-blue-900">Template: <span className="font-semibold">Business Essentials</span>. After you create the website, the editor opens so you can customize it. <Link href="/dashboard/templates" className="font-semibold underline">Change template</Link></p>}
      <fieldset disabled={pending} className="grid gap-5 sm:grid-cols-2"><legend className="sr-only">Website name and slug</legend>
        {[["name", "Website name", "Jaipur Pharma Website", 120], ["slug", "Website slug", "jaipur-pharma", 60]].map(([field, label, placeholder, limit]) => <div key={field}>
          <label htmlFor={field} className="mb-2 block text-sm font-semibold">{label} <span className="text-red-500">*</span></label>
          <input id={field} name={field} required maxLength={limit} minLength={field === "slug" ? 3 : undefined} pattern={field === "slug" ? "[a-z0-9]+(-[a-z0-9]+)*" : undefined} placeholder={placeholder} aria-invalid={!!errors[field]} aria-describedby={errors[field] ? `${field}-error` : field === "slug" ? "slug-help" : undefined} className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm" />
          {field === "slug" && <p id="slug-help" className="mt-2 text-xs text-slate-500">Use lowercase letters, numbers, and hyphens.</p>}
          {errors[field] && <p id={`${field}-error`} className="mt-2 text-xs text-red-600">{errors[field]}</p>}
        </div>)}
      </fieldset>
      {error && <p role="alert" className="text-sm text-red-600">{error} <Link href="/dashboard/websites" className="underline">Check My Websites</Link></p>}
      {pending && <p role="status" className="sr-only">Creating website...</p>}
      <div className="flex gap-3"><button type="submit" disabled={pending} className="rounded-lg bg-[#0987F5] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{pending ? "Creating..." : templateId ? "Create & open editor" : "Create website"}</button><Link href="/dashboard/websites" className="rounded-lg border border-slate-200 px-5 py-3 text-sm font-semibold">Cancel</Link></div>
    </form>
  </main>;
}
