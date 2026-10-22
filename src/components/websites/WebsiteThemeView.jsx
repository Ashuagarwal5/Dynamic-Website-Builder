"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "../auth/SessionProvider";
import { parseSiteTheme } from "../../lib/site-theme";
import { LoadingSkeleton } from "../admin/States";
import EditThemeForm from "./EditThemeForm";

export default function WebsiteThemeView({ tenantId, siteId }) {
  const session = useSession();
  const allowed = session.activeBranch?.id === tenantId;
  const [result, setResult] = useState(null);
  const [revision, setRevision] = useState(0);
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    if (!allowed || !tenantId || !siteId) return;
    let active = true;
    async function load() {
      try {
        const response = await fetch(`/api/tenants/${encodeURIComponent(tenantId)}/sites/${encodeURIComponent(siteId)}/theme`, { headers: { Accept: "application/json" }, cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load the theme.");
        const theme = parseSiteTheme(data, siteId);
        if (active) setResult({ tenantId, siteId, revision, theme });
      } catch (error) {
        if (active) setResult({ tenantId, siteId, revision, error: error.message });
      }
    }
    load();
    return () => { active = false; };
  }, [tenantId, siteId, revision, allowed]);
  const current = result?.tenantId === tenantId && result?.siteId === siteId && result?.revision === revision ? result : null;
  return <main className="space-y-6">
    <Link href="/dashboard/websites" className="text-sm font-semibold text-blue-600">Back to websites</Link>
    <div><h1 className="text-3xl font-bold">Theme &amp; branding</h1><p className="mt-2 text-sm text-slate-500">Saved website theme for {session.activeBranch?.name || "your branch"}.</p></div>
    {saved && <p role="status" className="text-sm text-emerald-700">Theme saved successfully.</p>}
    {allowed && current && !current.error && <EditThemeForm key={`${tenantId}:${siteId}:${revision}`} tenantId={tenantId} siteId={siteId} theme={current.theme} onSaved={() => { setSaved(true); setRevision((value) => value + 1); }} />}
    {!allowed ? <p role="status" className="rounded-xl border border-slate-200 bg-white p-6">Choose a website in your current branch from My Websites.</p> : !current ? <LoadingSkeleton /> : current.error ? <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800"><p>{current.error}</p><button type="button" onClick={() => setRevision((value) => value + 1)} className="mt-3 rounded-lg bg-white px-4 py-2 font-semibold">Retry</button></div> : !current.theme ? <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-slate-500">No saved theme yet.</p> : <>
      <div className="grid gap-5 sm:grid-cols-3">{[["primaryColor", "Primary color"], ["secondaryColor", "Secondary color"], ["accentColor", "Accent color"]].map(([key, label]) => <section key={key} className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><div aria-hidden="true" className="h-28 border-b border-slate-100" style={{ backgroundColor: current.theme[key] }} /><div className="p-5"><h2 className="text-sm font-semibold">{label}</h2><p className="mt-2 font-mono text-sm text-slate-500">{current.theme[key]}</p></div></section>)}</div>
      <dl className="grid gap-5 rounded-2xl border border-slate-200 bg-white p-6 sm:grid-cols-2"><div><dt className="text-sm font-semibold">Font family</dt><dd className="mt-2 break-words text-slate-500">{current.theme.fontFamily}</dd></div><div><dt className="text-sm font-semibold">Corner radius</dt><dd className="mt-2 flex items-center gap-3 text-slate-500"><span aria-hidden="true" className="size-10 border-2 border-slate-300 bg-slate-50" style={{ borderRadius: current.theme.borderRadius }} />{current.theme.borderRadius}</dd></div></dl>
    </>}
  </main>;
}
