import { Suspense } from "react";
import AdminShell from "../../components/admin/AdminShell";
import { LoadingSkeleton } from "../../components/admin/States";
export default function DashboardLayout({ children }) { return <Suspense fallback={<div className="min-h-screen bg-[#F5FAFF] p-8"><LoadingSkeleton /></div>}><AdminShell>{children}</AdminShell></Suspense>; }
