const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Validate an edit request and keep only the fields that were supplied.
// UpdateSiteDto is undocumented in Swagger; name, slug and subdomain are the
// website fields the list endpoint returns, so only those are ever sent.
export function validateSiteEdit(input) {
  const errors = {};
  const changes = {};
  if (input?.name !== undefined) {
    const name = typeof input.name === "string" ? input.name.trim() : "";
    if (!name || name.length > 120) errors.name = "Enter a website name of at most 120 characters.";
    else changes.name = name;
  }
  for (const key of ["slug", "subdomain"]) {
    if (input?.[key] === undefined) continue;
    const value = typeof input[key] === "string" ? input[key].trim() : "";
    if (value.length < 3 || value.length > 60 || !slugPattern.test(value))
      errors[key] = "Use 3-60 lowercase letters, numbers, or single hyphens between words.";
    else changes[key] = value;
  }
  if (!Object.keys(errors).length && !Object.keys(changes).length) errors.form = "Change at least one field.";
  return { errors, changes };
}
