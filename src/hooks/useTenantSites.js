"use client";
import { useEffect, useState } from "react";
import { createSiteListLoader } from "../lib/site-list-loader";

export function useTenantSites(tenantId) {
  const [result, setResult] = useState(null);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!tenantId) return;
    const loader = createSiteListLoader(tenantId, (data) => setResult({ tenantId, revision, ...data }));
    loader.load();
    window.addEventListener("focus", loader.load);
    return () => { loader.dispose(); window.removeEventListener("focus", loader.load); };
  }, [tenantId, revision]);
  const current = result?.tenantId === tenantId && result.revision === revision ? result : null;
  return { sites: tenantId ? current?.sites ?? null : [], error: current?.error ?? null, reload: () => setRevision((value) => value + 1) };
}
