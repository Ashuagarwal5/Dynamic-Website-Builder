import { industries } from "../../lib/site-validation";
export function FormField({ label, name, error, hint, multiline, ...props }) {
  const Control = multiline ? "textarea" : "input";
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold">
        {label}
        {props.required && " *"}
      </span>
      <Control
        {...props}
        name={name}
        aria-invalid={!!error}
        aria-describedby={`${name}-help`}
        className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-800 ${error ? "border-red-400" : "border-slate-200"} ${multiline ? "min-h-28" : ""}`}
      />
      <span
        id={`${name}-help`}
        className={`block text-xs leading-5 ${error ? "text-red-700" : "text-slate-500"}`}
      >
        {error || hint}
      </span>
    </label>
  );
}
export default function WebsiteDetailsFields({
  values,
  errors,
  onChange,
  settings = false,
  disabled = false,
}) {
  const field = (name, label, extra = {}) => (
    <FormField
      name={name}
      label={label}
      value={values[name] || ""}
      error={errors[name]}
      disabled={disabled}
      onChange={(event) => onChange(name, event.target.value)}
      {...extra}
    />
  );
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {field("businessName", "Business name", {
        required: true,
        maxLength: 120,
      })}
      {field("name", "Website display name", {
        required: true,
        maxLength: 120,
        hint: "Shown in your workspace. Can differ from the public business name.",
      })}
      <label className="block space-y-2">
        <span className="text-sm font-semibold">Industry (optional)</span>
        <select
          value={values.industry}
          disabled={disabled}
          onChange={(event) => onChange("industry", event.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
        >
          <option value="">Select an industry</option>
          {industries.map((industry) => (
            <option key={industry}>{industry}</option>
          ))}
        </select>
        {errors.industry && (
          <span className="text-xs text-red-700">{errors.industry}</span>
        )}
      </label>
      {field("slug", "Website slug", {
        required: true,
        maxLength: 60,
        autoCapitalize: "none",
        spellCheck: false,
        hint: `Local URL: /site/${values.slug || "your-slug"}`,
      })}
      {settings && (
        <>
          {field("seoTitle", "SEO title", {
            maxLength: 160,
            hint: "Saved to draft content. Publish from the editor to update the published snapshot.",
          })}
          {field("seoDescription", "SEO description", {
            maxLength: 500,
            multiline: true,
          })}
        </>
      )}
    </div>
  );
}
