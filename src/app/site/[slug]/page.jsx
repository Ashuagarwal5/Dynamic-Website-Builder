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
  const preview = useSearchParams().get("preview") === "1";
  return (
    <PublicWebsiteContent
      key={`${slug}-${preview}`}
      slug={slug}
      preview={preview}
    />
  );
}
function PublicWebsiteContent({ slug, preview }) {
  const [site, setSite] = useState(undefined),
    [error, setError] = useState(null);
  const reload = () => {
    setError(null);
    getSite(slug).then(setSite).catch(setError);
  };
  useEffect(() => {
    let active = true;
    getSite(slug)
      .then((record) => {
        if (active) setSite(record);
      })
      .catch((problem) => {
        if (active) setError(problem);
      });
    return () => {
      active = false;
    };
  }, [slug]);
  if (error)
    return (
      <div className="mx-auto max-w-3xl p-8">
        <ServiceError error={error} onRetry={reload} />
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
          <Link
            href={`/dashboard/sites/${encodeURIComponent(slug)}`}
            className="underline"
          >
            Back to editor
          </Link>
        </div>
      )}
      <WebsiteTemplate content={preview ? site.draft : site.live} />
    </>
  );
}
