"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Settings } from "lucide-react";
import { getSite, listSites, updateSiteSettings } from "../../lib/site-service";
import { validateDetails } from "../../lib/site-validation";
import { LoadingSkeleton, NotFoundState } from "../admin/States";
import WebsiteDetailsFields from "./WebsiteDetailsFields";
import DeleteWebsiteDialog from "./DeleteWebsiteDialog";
import ServiceError from "./ServiceError";
import StatusBadge from "./StatusBadge";
export default function WebsiteSettingsForm() {
  const { slug } = useParams();
  return <SettingsContent key={slug} slug={slug} />;
}
function SettingsContent({ slug }) {
  const router = useRouter(),
    search = useSearchParams();
  const [site, setSite] = useState(undefined),
    [sites, setSites] = useState([]),
    [values, setValues] = useState(null);
  const [loadError, setLoadError] = useState(null),
    [error, setError] = useState(null);
  const [busy, setBusy] = useState(false),
    [deleting, setDeleting] = useState(false),
    [success, setSuccess] = useState(search.get("saved") === "1");
  const lock = useRef(false);
  function apply([record, all]) {
    setSite(record);
    setSites(all);
    if (record)
      setValues({
        name: record.name,
        businessName: record.draft.businessName,
        industry: record.industry || "",
        slug: record.slug,
        seoTitle: record.draft.seo.title || "",
        seoDescription: record.draft.seo.description || "",
      });
  }
  function load() {
    setLoadError(null);
    Promise.all([getSite(slug), listSites()])
      .then(apply)
      .catch(setLoadError);
  }
  useEffect(() => {
    let active = true;
    Promise.all([getSite(slug), listSites()])
      .then((data) => {
        if (active) apply(data);
      })
      .catch((problem) => {
        if (active) setLoadError(problem);
      });
    return () => {
      active = false;
    };
  }, [slug]);
  if (loadError) return <ServiceError error={loadError} onRetry={load} />;
  if (site === undefined) return <LoadingSkeleton />;
  if (!site) return <NotFoundState />;
  const errors = validateDetails(values, sites, site.id);
  async function save(event) {
    event.preventDefault();
    if (lock.current || Object.keys(errors).length) return;
    lock.current = true;
    setBusy(true);
    setError(null);
    setSuccess(false);
    try {
      const updated = await updateSiteSettings(slug, values);
      if (updated.slug !== slug)
        router.replace(
          `/dashboard/websites/${encodeURIComponent(updated.slug)}/settings?saved=1`,
        );
      else {
        setSite(updated);
        setSuccess(true);
        lock.current = false;
        setBusy(false);
      }
    } catch (problem) {
      setError(problem);
      lock.current = false;
      setBusy(false);
      listSites()
        .then(setSites)
        .catch(() => {});
    }
  }
  return (
    <main className="mx-auto max-w-4xl">
      <Link
        href="/dashboard/websites"
        className="mb-6 inline-flex items-center gap-2 text-sm text-blue-700"
      >
        <ArrowLeft size={16} />
        My Websites
      </Link>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">
            Website management
          </p>
          <h1 className="mt-2 break-words text-3xl font-bold">
            Website settings
          </h1>
          <p className="mt-2 break-words text-sm text-slate-500">{site.name}</p>
        </div>
        <StatusBadge published={site.published} />
      </div>
      <form
        onSubmit={save}
        className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-8"
      >
        <h2 className="mb-6 flex items-center gap-2 text-lg font-bold">
          <Settings size={20} />
          Basic details and SEO
        </h2>
        <WebsiteDetailsFields
          settings
          values={values}
          errors={{ ...errors, ...error?.fields }}
          disabled={busy}
          onChange={(name, value) => {
            setValues((old) => ({ ...old, [name]: value }));
            setError(null);
            setSuccess(false);
          }}
        />
        <p className="mt-5 rounded-xl bg-[#F5FAFF] p-4 text-sm leading-6 text-slate-500">
          Changing a slug changes the local URL for this website, including its
          published demo URL. The old URL will no longer find this website. No
          redirects or custom domains are configured. Business name and SEO
          changes stay in the draft until you publish from the editor. SEO
          metadata integration is Coming Soon.
        </p>
        {error && (
          <div className="mt-5">
            <ServiceError error={error} />
          </div>
        )}
        {success && (
          <p
            role="status"
            className="mt-5 text-sm font-semibold text-emerald-700"
          >
            Website settings saved in this browser.
          </p>
        )}
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Link
            href={`/dashboard/sites/${encodeURIComponent(site.slug)}`}
            className="admin-secondary"
          >
            Open content editor
          </Link>
          <button
            type="submit"
            disabled={busy || Object.keys(errors).length > 0}
            className="admin-primary"
          >
            {busy ? "Saving..." : "Save settings"}
          </button>
        </div>
      </form>
      <section className="mt-8 rounded-2xl border border-red-200 bg-white p-6">
        <h2 className="font-bold text-red-800">Delete website</h2>
        <p className="mt-2 text-sm text-slate-500">
          Remove this website and its saved content from this browser.
        </p>
        <button
          type="button"
          disabled={busy}
          onClick={() => setDeleting(true)}
          className="mt-4 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700"
        >
          Delete {site.name}
        </button>
      </section>
      {deleting && (
        <DeleteWebsiteDialog
          site={site}
          onClose={() => setDeleting(false)}
          onDeleted={() => router.replace("/dashboard/websites")}
        />
      )}
    </main>
  );
}
