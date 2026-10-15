"use client";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import WebsiteTemplate from "../../../components/WebsiteTemplate";
import { getSite } from "../../../lib/site-service";
import {
  LoadingSkeleton,
  NotFoundState,
} from "../../../components/admin/States";
import ServiceError from "../../../components/websites/ServiceError";
export default function PublicWebsitePage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <PublicWebsiteRoute />
    </Suspense>
  );
}
function PublicWebsiteRoute() {
  const { slug } = useParams();
  const params = useSearchParams();
  const preview = params.get("preview") === "1";
  const requestedScope = params.get("workspace");
  const scope = requestedScope?.startsWith("site-studio-sites:")
    ? requestedScope
    : undefined;
  return (
    <PublicWebsiteContent
      key={`${slug}-${preview}-${scope}`}
      slug={slug}
      preview={preview}
      scope={scope}
    />
  );
}
function PublicWebsiteContent({ slug, preview, scope }) {
  const [site, setSite] = useState(undefined),
    [error, setError] = useState(null);
  const reload = () => {
    setError(null);
    getSite(slug, scope).then(setSite).catch(setError);
  };
  useEffect(() => {
    let active = true;
    function load() {
      getSite(slug, scope)
        .then((record) => {
          if (active) {
            setSite(record);
            setError(null);
          }
        })
        .catch((problem) => {
          if (active) setError(problem);
        });
    }
    function changed(event) {
      if (
        event.key === null ||
        event.key === (scope || "dynamic-builder-sites-v1")
      )
        load();
    }
    load();
    window.addEventListener("storage", changed);
    window.addEventListener("focus", load);
    return () => {
      active = false;
      window.removeEventListener("storage", changed);
      window.removeEventListener("focus", load);
    };
  }, [slug, scope]);
  if (error)
    return (
      <div className="mx-auto max-w-3xl p-8">
        <ServiceError error={error} onRetry={reload} scope={scope} />
      </div>
    );
  if (site === undefined)
    return (
      <div className="p-8">
        <LoadingSkeleton />
      </div>
    );
  if (!site || (!preview && !site.published))
    return (
      <main className="min-h-screen bg-[#F5FAFF] px-4 py-20">
        <NotFoundState />
      </main>
    );
  return (
    <>
      {preview && (
        <div className="sticky top-0 z-50 flex flex-wrap items-center justify-between gap-3 bg-amber-100 px-5 py-3 text-sm font-semibold text-amber-900">
          <span>Draft preview - changes are not publicly published</span>
          <Link href="/dashboard/websites" className="underline">
            Back to websites
          </Link>
        </div>
      )}
      <WebsiteTemplate content={preview ? site.draft : site.live} />
    </>
  );
}
