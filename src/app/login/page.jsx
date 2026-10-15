import { Suspense } from "react";
import { redirect } from "next/navigation";
import LoginForm from "../../components/auth/LoginForm";
import { getSession } from "../../lib/auth";
import { safeReturnTo } from "../../lib/session-codec";

export const metadata = { title: "Sign in | Site Studio" };

async function LoginContent({ searchParams }) {
  const returnTo = safeReturnTo((await searchParams).returnTo);
  if (await getSession()) redirect(returnTo);
  return <LoginForm returnTo={returnTo} />;
}

export default function LoginPage({ searchParams }) {
  return (
    <Suspense fallback={<p className="p-8 text-slate-500">Loading sign in…</p>}>
      <LoginContent searchParams={searchParams} />
    </Suspense>
  );
}
