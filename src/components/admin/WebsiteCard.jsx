"use client";
import Link from "next/link";
import {
  ArrowUpRight,
  Clock3,
  Globe,
  Pencil,
  Copy,
  Settings,
  Trash2,
  GlobeLock,
  PanelsTopLeft,
} from "lucide-react";
import StatusBadge from "../websites/StatusBadge";
import { useSession } from "../auth/SessionProvider";
import { siteViewUrl } from "../../lib/demo-workspace";

export default function WebsiteCard({
  site,
  list = false,
  onDuplicate,
  onDelete,
  onPublishChange,
  busy = false,
}) {
  const scope = useSession()?.websiteScope;
  const slug = encodeURIComponent(site.slug);
  const updated =
    site.updatedAt && !Number.isNaN(Date.parse(site.updatedAt))
      ? new Date(site.updatedAt)
      : null;
  const palettes = [
    {
      cover: "from-blue-50 to-indigo-100/60",
      accent: "bg-blue-500",
      ink: "text-blue-600",
    },
    {
      cover: "from-teal-50 to-emerald-100/60",
      accent: "bg-teal-500",
      ink: "text-teal-600",
    },
    {
      cover: "from-violet-50 to-purple-100/60",
      accent: "bg-violet-500",
      ink: "text-violet-600",
    },
  ];
  const hash = Array.from(site.id).reduce(
    (sum, letter) => sum + letter.charCodeAt(0),
    0,
  );
  const palette = palettes[hash % palettes.length];
  return (
    <article
      aria-label={site.name}
      className={`group relative flex h-full rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-shadow hover:shadow-md ${list ? "flex-col sm:flex-row sm:items-center" : "flex-col"}`}
    >
      <div
        className={`relative flex shrink-0 items-center justify-center rounded-t-2xl bg-gradient-to-br ${palette.cover} ${list ? "h-32 sm:h-40 sm:w-44 sm:rounded-l-2xl sm:rounded-tr-none" : "h-40"}`}
      >
        <div
          aria-hidden="true"
          className="relative w-36 -rotate-3 rounded-lg border border-white/90 bg-white/90 p-2.5 shadow-lg shadow-slate-900/5 transition-transform group-hover:rotate-0"
        >
          <div className="mb-2 flex items-center gap-1 border-b border-slate-100 pb-2">
            <span className="size-1 rounded-full bg-slate-300" />
            <span className="size-1 rounded-full bg-slate-300" />
            <span className="size-1 rounded-full bg-slate-300" />
            <span className="ml-auto h-1 w-8 rounded bg-slate-100" />
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`flex size-7 items-center justify-center rounded-md bg-slate-50 ${palette.ink}`}
            >
              <PanelsTopLeft size={16} />
            </span>
            <div className="flex-1 space-y-1.5">
              <div className={`h-1.5 w-14 rounded ${palette.accent}`} />
              <div className="h-1 w-10 rounded bg-slate-200" />
            </div>
          </div>
          <div className="mt-2.5 grid grid-cols-3 gap-1.5">
            <div className="h-6 rounded bg-slate-100" />
            <div className="h-6 rounded bg-slate-100" />
            <div className="h-6 rounded bg-slate-100" />
          </div>
        </div>
        {!list && (
          <div className="absolute right-4 top-4">
            <StatusBadge published={site.published} />
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="break-words text-lg font-semibold tracking-tight text-[#06325E]">
              {site.name}
            </h3>
            <p className="mt-1.5 break-words text-xs text-slate-500">
              {site.draft.businessName}
              {site.industry ? ` / ${site.industry}` : ""}
            </p>
          </div>
          {list && <StatusBadge published={site.published} />}
        </div>
        <p className="mt-4 flex min-w-0 items-center gap-2 text-sm text-slate-500">
          <Globe
            size={14}
            className="shrink-0 text-slate-400"
            aria-hidden="true"
          />
          <span className="truncate" title={`/site/${site.slug}`}>
            /site/{site.slug}
          </span>
        </p>
        <p className="mt-2 flex items-center gap-2 text-xs text-slate-400">
          <Clock3 size={13} className="shrink-0" aria-hidden="true" />
          {updated ? (
            <time dateTime={site.updatedAt} title={updated.toLocaleString()}>
              Updated{" "}
              {updated.toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </time>
          ) : (
            "No updates yet"
          )}
        </p>
        <div className="mt-auto pt-5">
          <div className="grid grid-cols-2 gap-2">
            <Link
              href={`/dashboard/sites/${slug}`}
              aria-label={`Edit website ${site.name}`}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#0879dc] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#06325E]"
            >
              <Pencil size={14} aria-hidden="true" />
              Edit website
            </Link>
            {onPublishChange && (
              <button
                type="button"
                disabled={busy}
                onClick={() => onPublishChange(site)}
                aria-label={`${site.published ? "Unpublish" : "Publish"} website ${site.name}`}
                className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition disabled:cursor-wait disabled:opacity-50 ${site.published ? "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100" : "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"}`}
              >
                {site.published ? (
                  <GlobeLock size={15} aria-hidden="true" />
                ) : (
                  <Globe size={15} aria-hidden="true" />
                )}
                {site.published ? "Unpublish" : "Publish"}
              </button>
            )}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
            <Link
              href={siteViewUrl(site.slug, !site.published, scope)}
              aria-label={`${site.published ? "View website" : "View draft"} ${site.name}`}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              {site.published ? "View website" : "View draft"}
              <ArrowUpRight size={14} aria-hidden="true" />
            </Link>
            <Link
              href={`/dashboard/websites/${slug}/settings`}
              aria-label={`Website settings for ${site.name}`}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              <Settings size={14} aria-hidden="true" />
              Settings
            </Link>
            {onDuplicate && (
              <button
                type="button"
                disabled={busy}
                onClick={() => onDuplicate(site)}
                aria-label={`Duplicate website ${site.name}`}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                <Copy size={14} aria-hidden="true" />
                Duplicate
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                disabled={busy}
                onClick={() => onDelete(site)}
                aria-label={`Delete website ${site.name}`}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:border-red-200 hover:bg-red-50 disabled:opacity-50"
              >
                <Trash2 size={14} aria-hidden="true" />
                Delete
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
