import "server-only";
import { requireSession } from "../lib/auth";
import { resolveActiveTenant } from "../lib/tenant-context";
import { apiFetch } from "../lib/api";

export function listTenants() {
  return apiFetch("/tenants", { method: "GET" });
}

export function createTenant({ name, slug }) {
  return apiFetch("/tenants", {
    method: "POST",
    body: JSON.stringify({ name, slug }),
  });
}

// Return only documented membership fields to browser consumers. Never fall
// back to the login snapshot when the membership API cannot be verified.
export async function getActiveTenants() {
  const response = await listTenants();
  if (!response.ok) {
    const error = new Error("Unable to load branches. Please try again.");
    error.status = response.status;
    throw error;
  }
  const data = await response.json();
  const ids = new Set();
  if (
    !Array.isArray(data) ||
    !data.every((tenant) => {
      if (
        !tenant ||
        typeof tenant.id !== "string" ||
        !tenant.id ||
        ids.has(tenant.id) ||
        typeof tenant.name !== "string" ||
        !tenant.name.trim() ||
        typeof tenant.slug !== "string" ||
        !tenant.slug ||
        typeof tenant.role !== "string" ||
        !tenant.role ||
        typeof tenant.isActive !== "boolean"
      )
        return false;
      ids.add(tenant.id);
      return true;
    })
  )
    throw new Error("Unable to load branches. Please try again.");
  return data
    .filter((tenant) => tenant.isActive)
    .map(({ id, name, slug, role, isActive }) => ({
      id,
      name,
      slug,
      role,
      isActive,
    }));
}

export async function requireActiveTenant() {
  const session = await requireSession();
  const tenants = await getActiveTenants();
  const tenant = resolveActiveTenant({ ...session, tenants });
  if (!tenant) throw new Error("No branch membership is available.");
  return tenant;
}

// Local branch drafts are not backend memberships and must never be accepted
// by requireActiveTenant or used to authorize tenant API requests.
