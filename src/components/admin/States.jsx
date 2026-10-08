import Link from "next/link";
import { Globe, SearchX } from "lucide-react";
export function LoadingSkeleton() {
  return (
    <div role="status">
      <span className="sr-only">Loading websites…</span>
      <div className="mb-8 h-8 w-48 rounded bg-slate-200 motion-safe:animate-pulse" />
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((key) => (
          <div
            key={key}
            className="h-64 rounded-2xl border border-slate-200 bg-white p-6"
          >
            <div className="h-24 rounded-xl bg-slate-100 motion-safe:animate-pulse" />
            <div className="mt-6 h-4 w-2/3 rounded bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
export function EmptyState({ filtered = false }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
      <Globe size={32} className="mx-auto text-blue-500" aria-hidden="true" />
      <h2 className="mt-4 text-xl font-bold">
        {filtered ? "No matching websites" : "No websites yet"}
      </h2>
      <p className="mt-2 text-sm text-slate-500">
        {filtered
          ? "Try another search or status filter."
          : "Create your first website to start building your online presence."}
      </p>
      {!filtered && (
        <Link href="/dashboard/websites/new" className="admin-primary mt-6">
          Create Website
        </Link>
      )}
    </div>
  );
}
export function NotFoundState() {
  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center text-[#06325E]">
      <SearchX size={36} className="mx-auto text-blue-500" aria-hidden="true" />
      <h1 className="mt-5 text-2xl font-bold">Page not found</h1>
      <p className="mt-3 text-sm text-slate-500">
        This page or website is unavailable.
      </p>
      <Link href="/dashboard/websites" className="admin-primary mt-6">
        Back to My Websites
      </Link>
    </div>
  );
}
