"use client";
import { useEffect, useState } from "react";
import { parsePageDetails } from "../../lib/page-list";

export default function PageDetails({ tenantId, siteId, pageId, onClose }) {
  const [result, setResult] = useState(null);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await fetch(`/api/tenants/${encodeURIComponent(tenantId)}/sites/${encodeURIComponent(siteId)}/pages/${encodeURIComponent(pageId)}`, { headers: { Accept: "application/json" }, cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load page details.");
        const page = parsePageDetails(data, siteId, pageId);
        if (active) setResult({ tenantId, siteId, pageId, revision, page });
      } catch (error) {
        if (active) setResult({ tenantId, siteId, pageId, revision, error: error.message });
      }
    }
    load();
    // Closing the panel invalidates results without generating an AbortError.
    return () => { active = false; };
  }, [tenantId, siteId, pageId, revision]);
  const current = result?.tenantId === tenantId && result?.siteId === siteId && result?.pageId === pageId && result?.revision === revision ? result : null;
  return <section id="page-details" aria-labelledby="page-details-title" className="rounded-2xl border border-slate-200 bg-white p-6">
    <div className="flex items-center justify-between gap-4"><h2 id="page-details-title" className="text-xl font-semibold">Page details</h2><button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold">Close details</button></div>
    {!current ? <p role="status" className="mt-4 text-sm text-slate-500">Loading page details...</p> : current.error ? <div role="alert" className="mt-4 text-sm text-red-700"><p>{current.error}</p><button type="button" onClick={() => setRevision((value) => value + 1)} className="mt-3 rounded-lg border px-3 py-2 font-semibold">Retry</button></div> : <dl className="mt-5 grid gap-5 sm:grid-cols-2">
      {[["Name", current.page.name], ["Slug", current.page.slug], ["Status", current.page.status], ["Page ID", current.page.id], ["Website ID", current.page.siteId], ["Created", new Date(current.page.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })], ["Updated", new Date(current.page.updatedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })]].map(([label, value]) => <div key={label}><dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</dt><dd className="mt-1 break-words text-sm text-slate-800">{value}</dd></div>)}
    </dl>}
  </section>;
}
