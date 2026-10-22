import { Suspense } from "react";
import { ProfileView } from "../../../components/auth/AccountViews";
import { LoadingSkeleton } from "../../../components/admin/States";
import { getCurrentUser } from "../../../services/auth.service";

export const metadata = { title: "Your profile | Site Studio" };
export const instant = false;
// Authoritative account details from GET /auth/me; fall back to the session.
async function ProfileContent() {
  let account;
  try {
    const response = await getCurrentUser();
    if (response.ok) {
      const data = await response.json();
      account = {
        name: typeof data?.name === "string" ? data.name : undefined,
        email: typeof data?.email === "string" ? data.email : undefined,
      };
    }
  } catch {
    /* Use the session snapshot. */
  }
  return <ProfileView account={account} />;
}
export default function ProfilePage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <ProfileContent />
    </Suspense>
  );
}
