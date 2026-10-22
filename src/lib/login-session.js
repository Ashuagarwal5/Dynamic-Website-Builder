import "server-only";
import { tokenExpiry } from "./session-codec";

// Validate a login/register response body and build the session to store.
// Returns null when the body does not look like a login response.
export function sessionFromAuthResponse(data) {
  if (
    typeof data?.accessToken !== "string" ||
    !data.user?.id ||
    !data.user?.email ||
    !Array.isArray(data.tenants)
  )
    return null;
  return {
    accessToken: data.accessToken,
    user: { id: data.user.id, name: data.user.name, email: data.user.email },
    tenants: data.tenants.map(({ id, name, slug, role }) => ({ id, name, slug, role })),
    expiresAt: tokenExpiry(data.accessToken),
  };
}
