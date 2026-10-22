export function parseSiteTheme(data, siteId) {
  if (data === null) return null;
  if (!data || typeof data !== "object" || Array.isArray(data) || (data.siteId !== undefined && data.siteId !== siteId)) throw new Error("Invalid theme response.");
  const colors = ["primaryColor", "secondaryColor", "accentColor"];
  if (!colors.every((key) => typeof data[key] === "string" && /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(data[key]))
    || typeof data.fontFamily !== "string" || !data.fontFamily.trim() || data.fontFamily.length > 120
    || typeof data.borderRadius !== "string" || !/^(?:0|\d+(?:\.\d+)?(?:px|rem|em|%))$/.test(data.borderRadius)) throw new Error("Invalid theme response.");
  const { primaryColor, secondaryColor, accentColor, fontFamily, borderRadius } = data;
  return { primaryColor, secondaryColor, accentColor, fontFamily, borderRadius };
}

export function validateThemeInput(input) {
  const errors = {};
  const payload = {};
  for (const key of ["primaryColor", "secondaryColor", "accentColor", "fontFamily", "borderRadius"]) payload[key] = typeof input?.[key] === "string" ? input[key].trim() : "";
  for (const key of ["primaryColor", "secondaryColor", "accentColor"]) {
    if (!/^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(payload[key])) errors[key] = "Enter a hex color such as #6D28D9.";
  }
  if (!payload.fontFamily || payload.fontFamily.length > 120) errors.fontFamily = "Enter a font family of at most 120 characters.";
  if (!/^(?:0|\d+(?:\.\d+)?(?:px|rem|em|%))$/.test(payload.borderRadius)) errors.borderRadius = "Use a non-negative radius such as 12px, 0.75rem, or 0.";
  return { errors, payload };
}
