import { Suspense } from "react";
import { redirect } from "next/navigation";
import RegisterForm from "../../components/auth/RegisterForm";
import { getSession } from "../../lib/auth";

export const metadata = { title: "Create account | Site Studio" };

async function RegisterContent() {
  if (await getSession()) redirect("/dashboard");
  return <RegisterForm />;
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<p className="p-8 text-slate-500">Loading…</p>}>
      <RegisterContent />
    </Suspense>
  );
}
