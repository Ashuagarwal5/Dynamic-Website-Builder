"use client";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowUpRight,
  Clock3,
  Globe,
  Pencil,
  Copy,
  Settings,
  Trash2,
} from "lucide-react";
import StatusBadge from "../websites/StatusBadge";
export default function WebsiteCard({
  site,
  list = false,
  onDuplicate,
  onDelete,
  busy = false,
}) {
  const [failedImage, setFailedImage] = useState("");
  const updated =
    site.updatedAt && !Number.isNaN(Date.parse(site.updatedAt))
      ? new Date(site.updatedAt)
      : null;
  const slug = encodeURIComponent(site.slug);
  const image = site.draft.hero.image || site.draft.logo;
  return (
    <article
      className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${list ? "sm:flex sm:items-center" : ""}`}
    >
      <div
        className={`flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 to-slate-50 ${list ? "h-28 shrink-0 sm:w-36" : "h-36"}`}
      >
        {image && failedImage !== image ? (
          // User-supplied URLs are rendered directly; arbitrary remote hosts are supported.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={`${site.name} preview`}
            onError={() => setFailedImage(image)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex items-center gap-3 rounded-xl border border-white bg-white/80 px-6 py-4">
            <Globe size={25} aria-hidden="true" />
            <span className="text-lg font-bold">
              {site.name.slice(0, 2).toUpperCase()}
            </span>
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="break-words text-lg font-bold">{site.name}</h3>
          <StatusBadge published={site.published} />
        </div>
        <p className="mt-2 break-all text-sm text-slate-500">
          /site/{site.slug}
        </p>
        {site.name !== site.draft.businessName && (
          <p className="mt-2 break-words text-xs text-slate-500">
            Business: {site.draft.businessName}
          </p>
        )}
        <p className="mt-4 flex items-center gap-2 text-xs text-slate-500">
          <Clock3 size={13} aria-hidden="true" />
          Updated:{" "}
          {updated ? (
            <time dateTime={site.updatedAt}>{updated.toLocaleString()}</time>
          ) : (
            "Not recorded"
          )}
        </p>
        <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
          <Link
            href={`/dashboard/sites/${slug}`}
            aria-label={`Edit website ${site.name}`}
            className="admin-primary"
          >
            <Pencil size={14} aria-hidden="true" />
            Edit website
          </Link>
          <Link
            href={`/site/${slug}${site.published ? "" : "?preview=1"}`}
            aria-label={`${site.published ? "View website" : "View draft"} ${site.name}`}
            className="admin-secondary"
          >
            {site.published ? "View website" : "View draft"}
            <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
          <Link
            href={`/dashboard/websites/${slug}/settings`}
            aria-label={`Website settings for ${site.name}`}
            className="admin-secondary"
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
              className="admin-secondary"
            >
              <Copy size={14} aria-hidden="true" />
              {busy ? "Working..." : "Duplicate"}
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              disabled={busy}
              onClick={() => onDelete(site)}
              aria-label={`Delete website ${site.name}`}
              className="admin-secondary text-red-700"
            >
              <Trash2 size={14} aria-hidden="true" />
              Delete
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
