"use server";

import { requireSession, writeSession } from "../../../lib/auth";
import { getActiveTenants } from "../../../services/tenant.service";

export async function switchTenant(previousState, formData) {
  const session = await requireSession();
  const tenantId = formData.get("tenantId");
  try {
    const tenants = await getActiveTenants();
    if (!tenants.some((tenant) => tenant.id === tenantId)) {
      return { error: "You do not have access to this branch." };
    }
    await writeSession({ ...session, activeTenantId: tenantId });
    return { error: null };
  } catch {
    return { error: "Unable to switch branches. Please try again." };
  }
}
