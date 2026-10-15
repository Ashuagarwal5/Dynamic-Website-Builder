import { Suspense } from "react";
import DashboardFrame from "../../components/admin/DashboardFrame";
import { LoadingSkeleton } from "../../components/admin/States";
import { requireSession } from "../../lib/auth";
import SessionProvider from "../../components/auth/SessionProvider";
import { resolveActiveTenant } from "../../lib/tenant-context";
import { getActiveTenants } from "../../services/tenant.service";
import { redirect } from "next/navigation";

// Website screens still load scoped browser data until their API integration.
// Branch membership and selection come exclusively from the backend/session.
export const instant = false;

async function AuthenticatedDashboard({ children }) {
  const session = await requireSession();
  const { user, expiresAt } = session;
  let tenants;
  try {
    tenants = await getActiveTenants();
  } catch (error) {
    if (error.status === 401) redirect("/login");
    return (
      <main className="p-8">
        <p role="alert">Unable to load branches. Please try again.</p>
        <a
          href="/dashboard"
          className="mt-4 inline-block font-semibold text-blue-600 underline"
        >
          Retry
        </a>
      </main>
    );
  }
  const activeTenant = resolveActiveTenant({ ...session, tenants });
  return (
    <SessionProvider session={{ user, tenants, expiresAt, activeTenant }}>
      <DashboardFrame>{children}</DashboardFrame>
    </SessionProvider>
  );
}
export default function DashboardLayout({ children }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F5FAFF] p-8">
          <LoadingSkeleton />
        </div>
      }
    >
      <AuthenticatedDashboard>{children}</AuthenticatedDashboard>
    </Suspense>
  );
}
