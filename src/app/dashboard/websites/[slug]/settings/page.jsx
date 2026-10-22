import { Suspense } from "react";
import WebsiteThemeView from "../../../../../components/websites/WebsiteThemeView";
import { LoadingSkeleton } from "../../../../../components/admin/States";
async function SettingsContent({ params, searchParams }) {
  const { slug: siteId } = await params;
  const query = await searchParams;
  return <WebsiteThemeView tenantId={typeof query.tenantId === "string" ? query.tenantId : ""} siteId={siteId} />;
}
export default function WebsiteSettingsPage(props) {
  return <Suspense fallback={<LoadingSkeleton />}><SettingsContent {...props} /></Suspense>;
}
export const instant = false;
