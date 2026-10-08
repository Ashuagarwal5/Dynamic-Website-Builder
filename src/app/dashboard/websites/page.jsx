import { Suspense } from "react";
import WebsitesView from "../../../components/admin/WebsitesView";
import { LoadingSkeleton } from "../../../components/admin/States";
export default function WebsitesPage() { return <Suspense fallback={<LoadingSkeleton/>}><WebsitesView/></Suspense>; }
