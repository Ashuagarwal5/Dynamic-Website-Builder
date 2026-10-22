import { Suspense } from "react";
import CreateBackendWebsiteForm from "../../../../components/websites/CreateBackendWebsiteForm";
import { LoadingSkeleton } from "../../../../components/admin/States";
import { TEMPLATE_ID } from "../../../../lib/section-config";

async function NewWebsiteContent({ searchParams }) {
  const query = await searchParams;
  return <CreateBackendWebsiteForm templateId={query.template === TEMPLATE_ID || !query.template ? TEMPLATE_ID : null} />;
}
export default function NewWebsitePage(props) {
  return <Suspense fallback={<LoadingSkeleton />}><NewWebsiteContent {...props} /></Suspense>;
}
export const instant = false;
