export function resolveActiveTenant(session) {
  return (
    session.tenants.find((tenant) => tenant.id === session.activeTenantId) ||
    session.tenants[0] ||
    null
  );
}

export function backendBranches(tenants) {
  return tenants.filter((tenant) => tenant.isActive !== false).map((tenant) => ({
    ...tenant, kind: "backend", key: `backend:${tenant.id}`,
  }));
}
