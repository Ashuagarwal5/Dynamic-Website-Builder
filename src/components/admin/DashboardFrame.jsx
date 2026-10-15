"use client";
import { usePathname } from "next/navigation";
import AdminShell from "./AdminShell";
export default function DashboardFrame({ children }) {
  const pathname = usePathname();
  return /^\/dashboard\/sites\/[^/]+$/.test(pathname) ? (
    children
  ) : (
    <AdminShell>{children}</AdminShell>
  );
}
