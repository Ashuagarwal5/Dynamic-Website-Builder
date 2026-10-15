import { Suspense } from "react";
import SitePagesView from "../../../../../components/websites/SitePagesView";
import { LoadingSkeleton } from "../../../../../components/admin/States";
async function PagesContent({ params, searchParams }) {
  const { slug: siteId } = await params;
  const query = await searchParams;
  return <SitePagesView siteId={siteId} tenantId={typeof query.tenantId === "string" ? query.tenantId : ""} />;
}
export default function WebsitePagesPage(props) {
  return <Suspense fallback={<LoadingSkeleton />}><PagesContent {...props} /></Suspense>;
}
export const instant = false;
