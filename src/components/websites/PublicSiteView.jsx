import Link from "next/link";
import WebsiteTemplate from "../WebsiteTemplate";
import { fromBackendSection, isSettingsSection, toTemplateContent } from "../../lib/section-config";

// Renders a published website with the same template renderer as the editor
// preview, so what visitors see matches what the owner edited.
export default function PublicSiteView({ site, subdomain, activeSlug }) {
  const page = site.pages.find((candidate) => candidate.slug === activeSlug) || site.pages.find((candidate) => candidate.slug === "home") || site.pages[0];
  const raw = page?.sections || [];
  const settings = raw.find(isSettingsSection)?.config || null;
  const sections = raw.filter((section) => !isSettingsSection(section)).map((section) => fromBackendSection(section));
  const content = toTemplateContent({ name: site.name, theme: site.theme, sections, settings });
  return (
    <>
      {site.pages.length > 1 && (
        <nav aria-label="Pages" className="flex flex-wrap gap-4 border-b border-slate-200 bg-slate-50 px-6 py-2 text-sm font-medium">
          {site.pages.map((item) => <Link key={item.id} href={`/sites/${encodeURIComponent(subdomain)}?page=${encodeURIComponent(item.slug)}`} aria-current={item === page ? "page" : undefined} className={item === page ? "text-blue-700" : "text-slate-600"}>{item.name}</Link>)}
        </nav>
      )}
      {sections.length ? <WebsiteTemplate content={content} /> : <p className="px-6 py-20 text-center text-slate-500">This page has no content yet.</p>}
    </>
  );
}
