import "server-only";
import { apiFetch } from "../lib/api";

// Return the backend Response unchanged. The action handles errors, validates
// the response, and stores the access token without returning it to the browser.
export function loginUser({ email, password }) {
  return apiFetch("/auth/login", {
    authenticated: false,
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

// Registration: POST /auth/register is known, but its payload and response
// contract have not been supplied. Add registerUser once those are confirmed.
