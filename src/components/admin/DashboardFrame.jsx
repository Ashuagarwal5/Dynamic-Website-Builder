"use client";
import { usePathname } from "next/navigation";
import AdminShell from "./AdminShell";
export default function DashboardFrame({ children }) {
  const pathname = usePathname();
  // The full-screen builder (local and backend-backed) renders without the admin shell.
  return /^\/dashboard\/(sites\/[^/]+|websites\/[^/]+\/edit)$/.test(pathname) ? (
    children
  ) : (
    <AdminShell>{children}</AdminShell>
  );
}
