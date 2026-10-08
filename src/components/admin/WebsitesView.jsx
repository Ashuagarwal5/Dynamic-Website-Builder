"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowRight, Globe, CircleCheck, FileText, Plus } from "lucide-react";
import { duplicateSite, listSites } from "../../lib/site-service";
import { sortSites } from "../../lib/site-validation";
import WebsiteCard from "./WebsiteCard";
import { EmptyState, LoadingSkeleton } from "./States";
import WebsiteFilters from "../websites/WebsiteFilters";
import DeleteWebsiteDialog from "../websites/DeleteWebsiteDialog";
import ServiceError from "../websites/ServiceError";
export default function WebsitesView({ overview = false }) {
  const params = useSearchParams(),
    router = useRouter();
  const query = params.get("q") || "";
  const [sites, setSites] = useState(null),
    [error, setError] = useState(null);
  const [filter, setFilter] = useState("all"),
    [layout, setLayout] = useState("grid"),
    [sort, setSort] = useState("recent");
  const [deleting, setDeleting] = useState(null),
    [busyId, setBusyId] = useState(null);
  const lock = useRef(false);
  const reload = async () => {
    setError(null);
    try {
      setSites(await listSites());
    } catch (problem) {
      setError(problem);
    }
  };
  useEffect(() => {
    let active = true;
    listSites()
      .then((data) => {
        if (active) setSites(data);
      })
      .catch((problem) => {
        if (active) setError(problem);
      });
    return () => {
      active = false;
    };
  }, []);
  async function duplicate(site) {
    if (lock.current) return;
    lock.current = true;
    setBusyId(site.id);
    setError(null);
    try {
      const copied = await duplicateSite(site.slug);
      router.push(`/dashboard/sites/${encodeURIComponent(copied.slug)}`);
    } catch (problem) {
      setError(problem);
      lock.current = false;
      setBusyId(null);
    }
  }
  if (!sites)
    return error ? (
      <ServiceError error={error} onRetry={reload} />
    ) : (
      <LoadingSkeleton />
    );
  const published = sites.filter((site) => site.published).length,
    term = query.trim().toLowerCase();
  const filtered = sites.filter(
    (site) =>
      overview ||
      ((!term ||
        `${site.name} ${site.draft.businessName} ${site.slug}`
          .toLowerCase()
          .includes(term)) &&
        (filter === "all" ||
          (filter === "published" ? site.published : !site.published))),
  );
  const visible = overview
    ? sortSites(filtered).slice(0, 3)
    : sortSites(filtered, sort);
  const stats = [
    {
      label: "Total websites",
      value: sites.length,
      icon: Globe,
      detail: "All websites in your workspace",
    },
    {
      label: "Published",
      value: published,
      icon: CircleCheck,
      detail: "Published snapshots in this browser",
    },
    {
      label: "Drafts",
      value: sites.length - published,
      icon: FileText,
      detail: "Unpublished websites",
    },
  ];
  return (
    <main>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0987F5]">
            Your workspace
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            {overview ? "Dashboard" : "My Websites"}
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            {overview
              ? "A clear view of your websites. Everything you need to keep them moving."
              : "Create, organize and manage your websites in one place."}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {overview && (
            <Link href="/dashboard/websites" className="admin-secondary">
              Manage websites
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          )}
          <Link href="/dashboard/websites/new" className="admin-primary">
            <Plus size={16} aria-hidden="true" />
            Create Website
          </Link>
        </div>
      </div>
      {error && (
        <div className="mb-6">
          <ServiceError error={error} onRetry={reload} />
        </div>
      )}
      {overview && (
        <>
          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            {stats.map(({ label, value, icon: Icon, detail }) => (
              <section
                key={label}
                className="rounded-2xl border border-slate-200 bg-white p-6"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-slate-500">
                    {label}
                  </h2>
                  <span className="rounded-xl bg-blue-50 p-2.5 text-[#0987F5]">
                    <Icon size={20} aria-hidden="true" />
                  </span>
                </div>
                <p className="mt-3 text-4xl font-bold">{value}</p>
                <p className="mt-3 text-xs leading-5 text-slate-500">
                  {detail}
                </p>
              </section>
            ))}
          </div>
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">Recent websites</h2>
              <p className="mt-1 text-sm text-slate-500">
                Your three most recently updated websites.
              </p>
            </div>
            <Link
              href="/dashboard/websites"
              className="text-sm font-semibold text-blue-600"
            >
              View all
            </Link>
          </div>
        </>
      )}
      {!overview && (
        <>
          <WebsiteFilters
            query={query}
            onQuery={(value) =>
              router.replace(
                `/dashboard/websites?q=${encodeURIComponent(value)}`,
                { scroll: false },
              )
            }
            filter={filter}
            onFilter={setFilter}
            sort={sort}
            onSort={setSort}
            layout={layout}
            onLayout={setLayout}
          />
          <p aria-live="polite" className="mb-4 text-xs text-slate-500">
            {visible.length} {visible.length === 1 ? "website" : "websites"}
          </p>
        </>
      )}
      {!visible.length ? (
        <EmptyState filtered={sites.length > 0} />
      ) : (
        <div
          className={
            layout === "list" && !overview
              ? "grid gap-4"
              : "grid gap-5 md:grid-cols-2 xl:grid-cols-3"
          }
        >
          {visible.map((site) => (
            <WebsiteCard
              key={site.id}
              site={site}
              list={layout === "list" && !overview}
              busy={!!busyId}
              onDuplicate={duplicate}
              onDelete={setDeleting}
            />
          ))}
        </div>
      )}
      {deleting && (
        <DeleteWebsiteDialog
          site={deleting}
          onClose={() => setDeleting(null)}
          onDeleted={async () => {
            setDeleting(null);
            await reload();
          }}
        />
      )}
      <p className="mt-8 text-xs leading-5 text-slate-500">
        Demo workspace. Changes are saved in this browser. Publishing updates
        the local public preview.
      </p>
    </main>
  );
}
