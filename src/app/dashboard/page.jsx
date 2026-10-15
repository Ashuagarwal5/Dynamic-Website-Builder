import { Suspense } from "react";
import WebsitesView from "../../components/admin/WebsitesView";
import { LoadingSkeleton } from "../../components/admin/States";
export const instant = false;
export default function DashboardPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <WebsitesView overview />
    </Suspense>
  );
}
