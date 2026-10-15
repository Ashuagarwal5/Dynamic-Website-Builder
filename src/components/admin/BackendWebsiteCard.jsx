"use client";
import Link from "next/link";
import { Globe, Clock3, Pencil, Settings, Copy, Trash2, Eye } from "lucide-react";

export default function BackendWebsiteCard({ site, list = false }) {
  const label = site.status === "PUBLISHED" ? "Published" : site.status === "DRAFT" ? "Draft" : site.status.replaceAll("_", " ");
  const statusColor = site.status === "PUBLISHED" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800";
  return <article aria-label={site.name} className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${list ? "flex flex-col sm:flex-row" : ""}`}>
    <div className={`flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100/60 ${list ? "min-h-28 sm:w-36 sm:shrink-0" : "h-32"}`}><Globe size={38} className="text-blue-500" aria-hidden="true" /></div>
    <div className="min-w-0 flex-1 p-5">
      <div className="flex items-start justify-between gap-3"><h3 className="break-words text-lg font-semibold text-[#06325E]">{site.name}</h3><span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${statusColor}`}>{label}</span></div>
      <p className="mt-3 break-all text-sm text-slate-500"><span className="font-medium">Slug:</span> {site.slug}</p>
      <p className="mt-2 break-all text-xs text-slate-500">{site.domain || (site.subdomain ? `Subdomain: ${site.subdomain}` : "No domain configured")}</p>
      <p className="mt-3 flex items-center gap-2 text-xs text-slate-400"><Clock3 size={13} aria-hidden="true" /><time dateTime={site.updatedAt}>Updated {new Date(site.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" })}</time></p>
      <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
        <Link href={`/dashboard/websites/${encodeURIComponent(site.id)}/pages?tenantId=${encodeURIComponent(site.tenantId)}`} aria-label={`View pages for ${site.name}`} className="inline-flex items-center gap-1.5 rounded-lg bg-[#0987F5] px-3 py-2 text-xs font-semibold text-white hover:bg-blue-600">Pages</Link>
        {[[Pencil, "Edit"], [Eye, "View"], [Globe, site.status === "PUBLISHED" ? "Unpublish" : "Publish"], [Settings, "Settings"], [Copy, "Duplicate"], [Trash2, "Delete"]].map(([Icon, action]) => <button key={action} type="button" disabled title={`${action} is not available yet`} aria-label={`${action} website ${site.name} (not available yet)`} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-medium text-slate-400 disabled:cursor-not-allowed"><Icon size={13} aria-hidden="true" />{action}</button>)}
      </div>
    </div>
  </article>;
}
