import { Suspense } from "react";
import { notFound } from "next/navigation";
import PublicSiteView from "../../../components/websites/PublicSiteView";
import { LoadingSkeleton } from "../../../components/admin/States";
import { parsePublicSite } from "../../../lib/public-site";
import { isSettingsSection } from "../../../lib/section-config";
import { getPublicSite } from "../../../services/public-site.service";

export const instant = false;

// Returns { site } or { status } ("missing" for 404, "unavailable" otherwise).
async function loadSite(subdomain) {
  try {
    const response = await getPublicSite(subdomain);
    if (response.status === 404) return { status: "missing" };
    if (!response.ok) return { status: "unavailable" };
    return { site: parsePublicSite(await response.json()) };
  } catch {
    return { status: "unavailable" };
  }
}

const homePage = (site, slug) => site.pages.find((page) => page.slug === slug) || site.pages.find((page) => page.slug === "home") || site.pages[0];

// SEO title and description come from the stored settings section.
export async function generateMetadata({ params, searchParams }) {
  const { subdomain } = await params;
  const query = await searchParams;
  const { site, status } = await loadSite(subdomain);
  if (!site) return { title: status === "missing" ? "Website not found" : "Website unavailable", robots: { index: false } };
  const seo = homePage(site, typeof query.page === "string" ? query.page : "")?.sections.find(isSettingsSection)?.config?.seo;
  const title = (typeof seo?.title === "string" && seo.title.trim()) || site.name;
  const description = typeof seo?.description === "string" ? seo.description.trim() : "";
  return { title, ...(description ? { description } : {}) };
}

async function PublicSiteContent({ params, searchParams }) {
  const { subdomain } = await params;
  const query = await searchParams;
  const { site, status } = await loadSite(subdomain);
  if (status === "missing") notFound();
  if (!site) return <main className="p-10 text-center text-slate-600">This website is temporarily unavailable.</main>;
  return <PublicSiteView site={site} subdomain={subdomain} activeSlug={typeof query.page === "string" ? query.page : ""} />;
}

export default function PublicSitePage(props) {
  return <Suspense fallback={<LoadingSkeleton />}><PublicSiteContent {...props} /></Suspense>;
}
