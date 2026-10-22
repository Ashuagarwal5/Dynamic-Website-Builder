"use client";
import Link from "next/link";
import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowRight, Globe, CircleCheck, FileText, Plus } from "lucide-react";
import { sortSites } from "../../lib/site-validation";
import BackendWebsiteCard from "./BackendWebsiteCard";
import { LoadingSkeleton } from "./States";
import WebsiteFilters from "../websites/WebsiteFilters";
import { useSession } from "../auth/SessionProvider";
import { useTenantSites } from "../../hooks/useTenantSites";
import PublishBackendWebsiteDialog from "../websites/PublishBackendWebsiteDialog";
import EditBackendWebsiteDialog from "../websites/EditBackendWebsiteDialog";
import DeleteBackendWebsiteDialog from "../websites/DeleteBackendWebsiteDialog";

export default function WebsitesView({ overview = false }) {
  const session = useSession();
  const tenantId = session.activeBranch?.id;
  const { sites, error, reload } = useTenantSites(tenantId);
  const params = useSearchParams();
  const router = useRouter();
  const query = params.get("q") || "";
  const [filter, setFilter] = useState("all");
  const [layout, setLayout] = useState("grid");
  const [sort, setSort] = useState("recent");
  const [publishing, setPublishing] = useState(null);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  if (!tenantId) return <main className="rounded-2xl border border-slate-200 bg-white p-8"><h1 className="text-2xl font-bold">Choose a branch</h1><p className="mt-3 text-sm text-slate-500">Create or select a branch to view its websites.</p><Link href="/dashboard/tenants" className="mt-5 inline-block font-semibold text-blue-600">Manage branches</Link></main>;
  if (error) return <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800"><p>{error.message}</p><button type="button" onClick={reload} className="mt-4 rounded-lg border border-red-200 bg-white px-4 py-2 font-semibold">Retry</button></div>;
  if (!sites) return <LoadingSkeleton />;
  const term = query.trim().toLowerCase();
  const filtered = sites.filter((site) => overview || ((!term || `${site.name} ${site.slug}`.toLowerCase().includes(term)) && (filter === "all" || site.status === (filter === "published" ? "PUBLISHED" : "DRAFT"))));
  const visible = overview ? sortSites(filtered).slice(0, 3) : sortSites(filtered, sort);
  const stats = [
    { label: "Total websites", value: sites.length, icon: Globe, detail: "All websites in this branch" },
    { label: "Published", value: sites.filter((site) => site.status === "PUBLISHED").length, icon: CircleCheck, detail: "Websites marked as published" },
    { label: "Drafts", value: sites.filter((site) => site.status === "DRAFT").length, icon: FileText, detail: "Websites marked as draft" },
  ];
  return <main>
    <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0987F5]">Your workspace</p><h1 className="mt-2 text-3xl font-bold tracking-tight">{overview ? "Dashboard" : "My Websites"}</h1><p className="mt-3 text-sm leading-6 text-slate-500">Websites for {session.activeBranch.name}.</p></div>
      <div className="flex flex-wrap gap-3">{overview && <Link href="/dashboard/websites" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#06325E]">Manage websites<ArrowRight size={16} aria-hidden="true" /></Link>}<Link href="/dashboard/websites/new" className="inline-flex items-center gap-2 rounded-lg bg-[#0987F5] px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-600"><Plus size={16} aria-hidden="true" />Create Website</Link></div>
    </div>
    {overview && <>
      <div className="mb-8 grid gap-4 sm:grid-cols-3">{stats.map(({ label, value, icon: Icon, detail }) => <section key={label} className="rounded-2xl border border-slate-200 bg-white p-6"><div className="flex items-center justify-between"><h2 className="text-sm font-semibold text-slate-500">{label}</h2><span className="rounded-xl bg-blue-50 p-2.5 text-[#0987F5]"><Icon size={20} aria-hidden="true" /></span></div><p className="mt-3 text-4xl font-bold">{value}</p><p className="mt-3 text-xs leading-5 text-slate-500">{detail}</p></section>)}</div>
      <div className="mb-6 flex items-center justify-between gap-3"><div><h2 className="text-xl font-bold">Recent websites</h2><p className="mt-1 text-sm text-slate-500">Your three most recently updated websites.</p></div><Link href="/dashboard/websites" className="text-sm font-semibold text-blue-600">View all</Link></div>
    </>}
    {!overview && <><WebsiteFilters query={query} onQuery={(value) => router.replace(`/dashboard/websites?q=${encodeURIComponent(value)}`, { scroll: false })} filter={filter} onFilter={setFilter} sort={sort} onSort={setSort} layout={layout} onLayout={setLayout} /><p aria-live="polite" className="mb-4 text-xs text-slate-500">{visible.length} {visible.length === 1 ? "website" : "websites"}</p></>}
    {!visible.length ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center"><Globe size={32} className="mx-auto text-blue-500" aria-hidden="true" /><h2 className="mt-4 text-xl font-bold">{sites.length ? "No matching websites" : "No websites yet"}</h2><p className="mt-2 text-sm text-slate-500">{sites.length ? "Try another search or status filter." : "This branch has no websites."}</p></div> : <div className={layout === "list" && !overview ? "grid gap-4" : "grid gap-5 md:grid-cols-2 xl:grid-cols-3"}>{visible.map((site) => <BackendWebsiteCard key={site.id} site={site} list={layout === "list" && !overview} onPublish={setPublishing} onEdit={setEditing} onDelete={setDeleting} />)}</div>}
    {editing && editing.tenantId === tenantId && <EditBackendWebsiteDialog key={editing.id} site={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}
    {deleting && deleting.tenantId === tenantId && <DeleteBackendWebsiteDialog key={deleting.id} site={deleting} onClose={() => setDeleting(null)} onDeleted={() => { setDeleting(null); reload(); }} />}
    {publishing && publishing.tenantId === tenantId && <PublishBackendWebsiteDialog key={publishing.id} site={publishing} onClose={() => setPublishing(null)} onPublished={() => { setPublishing(null); reload(); }} />}
  </main>;
}
