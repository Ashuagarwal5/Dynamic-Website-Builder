import { Suspense } from "react";
import BackendBuilderWorkspace from "../../../../../components/builder/BackendBuilderWorkspace";

export const metadata = { title: "Website editor | Site Studio" };
export const instant = false;

async function EditorContent({ params, searchParams }) {
  const { slug: siteId } = await params;
  const query = await searchParams;
  return <BackendBuilderWorkspace key={siteId} siteId={siteId} tenantId={typeof query.tenantId === "string" ? query.tenantId : ""} partialSetup={query.setup === "partial"} />;
}

export default function WebsiteEditorPage(props) {
  return <Suspense fallback={<p className="p-8 text-sm text-slate-500">Loading editor…</p>}><EditorContent {...props} /></Suspense>;
}
