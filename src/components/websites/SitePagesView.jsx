"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "../auth/SessionProvider";
import { parsePageList } from "../../lib/page-list";
import { LoadingSkeleton } from "../admin/States";
import CreatePageForm from "./CreatePageForm";
import PublishBackendPageDialog from "./PublishBackendPageDialog";
import PageDetails from "./PageDetails";
import PageSections from "./PageSections";

export default function SitePagesView({ siteId, tenantId }) {
  const session = useSession();
  const [result, setResult] = useState(null);
  const [revision, setRevision] = useState(0);
  const [publishingPage, setPublishingPage] = useState(null);
  const [selectedPage, setSelectedPage] = useState(null);
  const [sectionsPage, setSectionsPage] = useState(null);
  const allowed = session.activeBranch?.id === tenantId;
  useEffect(() => {
    if (!allowed || !tenantId || !siteId) return;
    let active = true;
    async function load() {
      try {
        const response = await fetch(`/api/tenants/${encodeURIComponent(tenantId)}/sites/${encodeURIComponent(siteId)}/pages`, { headers: { Accept: "application/json" }, cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load pages.");
        const pages = parsePageList(data, siteId);
        if (active) setResult({ tenantId, siteId, revision, pages });
      } catch (error) {
        if (active) setResult({ tenantId, siteId, revision, error: error.message });
      }
    }
    load();
    // Ignore late read results; cleanup must not abort browser fetches.
    return () => { active = false; };
  }, [tenantId, siteId, revision, allowed]);
  const current = result?.tenantId === tenantId && result?.siteId === siteId && result?.revision === revision ? result : null;
  return <main className="space-y-6">
    <Link href="/dashboard/websites" className="text-sm font-semibold text-blue-600">Back to websites</Link>
    <div><h1 className="text-3xl font-bold">Website pages</h1><p className="mt-2 text-sm text-slate-500">Pages in this website for {session.activeBranch?.name || "your branch"}.</p></div>
    {allowed && <CreatePageForm key={`${tenantId}:${siteId}`} tenantId={tenantId} siteId={siteId} onCreated={() => setRevision((value) => value + 1)} />}
    {!allowed ? <p role="status" className="rounded-xl border border-slate-200 bg-white p-6">This website belongs to a different branch. Return to My Websites and select a website in your current branch.</p> : !current ? <LoadingSkeleton /> : current.error ? <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800"><p>{current.error}</p><button type="button" onClick={() => setRevision((value) => value + 1)} className="mt-4 rounded-lg bg-white px-4 py-2 font-semibold">Retry</button></div> : !current.pages.length ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center"><h2 className="text-xl font-semibold">No pages yet</h2><p className="mt-2 text-sm text-slate-500">This website has no pages.</p></div> : <>
      <p aria-live="polite" className="text-sm text-slate-500">{current.pages.length} {current.pages.length === 1 ? "page" : "pages"}</p>
      <div role="region" aria-label="Website pages" tabIndex={0} className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full min-w-[560px] text-left text-sm"><caption className="sr-only">Website pages, slugs, publication status, and last update</caption><thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr>{["Page", "Slug", "Status", "Updated", "Actions"].map((label) => <th key={label} scope="col" className="px-5 py-4">{label}</th>)}</tr></thead>
          <tbody className="divide-y divide-slate-100">{current.pages.map((page) => <tr key={page.id} className="hover:bg-slate-50"><th scope="row" className="max-w-64 break-words px-5 py-4 font-semibold">{page.name}</th><td className="max-w-64 break-words px-5 py-4 text-slate-500">{page.slug}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${page.status === "PUBLISHED" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"}`}>{page.status === "PUBLISHED" ? "Published" : page.status === "DRAFT" ? "Draft" : page.status.replaceAll("_", " ")}</span></td><td className="px-5 py-4 text-slate-500"><time dateTime={page.updatedAt}>{new Date(page.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" })}</time></td><td className="px-5 py-4"><button type="button" onClick={() => setSelectedPage(page.id)} aria-label={`View details for ${page.name}`} aria-controls="page-details" aria-expanded={selectedPage === page.id} className="whitespace-nowrap rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50">View details</button><button type="button" onClick={() => setSectionsPage({ id: page.id, name: page.name })} aria-label={`View sections for ${page.name}`} aria-controls="page-sections" aria-expanded={sectionsPage?.id === page.id} className="ml-2 whitespace-nowrap rounded-lg bg-[#0987F5] px-3 py-2 text-xs font-semibold text-white hover:bg-blue-600">Sections</button><button type="button" onClick={() => setPublishingPage(page)} aria-label={`${page.status === "PUBLISHED" ? "Unpublish" : "Publish"} ${page.name}`} className={`ml-2 whitespace-nowrap rounded-lg border px-3 py-2 text-xs font-semibold ${page.status === "PUBLISHED" ? "border-amber-200 text-amber-800 hover:bg-amber-50" : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"}`}>{page.status === "PUBLISHED" ? "Unpublish" : "Publish"}</button></td></tr>)}</tbody>
        </table>
      </div>
    </>}
    {allowed && publishingPage && <PublishBackendPageDialog key={`publish:${tenantId}:${siteId}:${publishingPage.id}`} page={publishingPage} tenantId={tenantId} siteId={siteId} onClose={() => setPublishingPage(null)} onPublished={() => { setPublishingPage(null); setRevision((value) => value + 1); }} />}
    {allowed && selectedPage && <PageDetails key={`details:${tenantId}:${siteId}:${selectedPage}`} tenantId={tenantId} siteId={siteId} pageId={selectedPage} onClose={() => setSelectedPage(null)} />}
    {allowed && sectionsPage && <PageSections key={`sections:${tenantId}:${siteId}:${sectionsPage.id}`} tenantId={tenantId} siteId={siteId} pageId={sectionsPage.id} pageName={sectionsPage.name} onClose={() => setSectionsPage(null)} />}
  </main>;
}
