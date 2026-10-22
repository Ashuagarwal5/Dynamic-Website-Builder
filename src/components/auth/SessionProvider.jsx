"use client";

import { createContext, useContext, useEffect } from "react";
import { websiteScope } from "../../lib/demo-workspace";
import { backendBranches } from "../../lib/tenant-context";
import { switchTenant } from "../../app/dashboard/tenants/actions";
const SessionContext = createContext(null);
export const useSession = () => useContext(SessionContext);

export default function SessionProvider({ session, children }) {
  useEffect(() => {
    function check() {
      if (Date.now() >= session.expiresAt) window.location.replace("/login");
    }
    const timer = setTimeout(check, Math.max(0, session.expiresAt - Date.now()));
    window.addEventListener("focus", check);
    return () => { clearTimeout(timer); window.removeEventListener("focus", check); };
  }, [session.expiresAt]);

  const branches = backendBranches(session.tenants);
  const allBranches = (session.allTenants || session.tenants).map((tenant) => ({ ...tenant, kind: "backend", key: `backend:${tenant.id}` }));
  const activeBranch = branches.find((branch) => branch.id === session.activeTenant?.id) || branches[0] || null;
  const scope = websiteScope(session.user.id, activeBranch?.kind || "none", activeBranch?.id || "none");

  async function selectBranch(key) {
    const branch = branches.find((item) => item.key === key);
    if (!branch) throw new Error("Branch not found.");
    const form = new FormData();
    form.set("tenantId", branch.id);
    const result = await switchTenant(null, form);
    if (result.error) throw new Error(result.error);
  }

  return <SessionContext.Provider value={{ ...session, activeBranch, websiteScope: scope, branches, allBranches, selectBranch }}>
    <div key={scope}>{children}</div>
  </SessionContext.Provider>;
}
