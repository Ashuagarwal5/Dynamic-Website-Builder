"use client";
import { useId } from "react";
export function EditorField({
  label,
  value,
  onChange,
  error,
  hint,
  multiline = false,
  type = "text",
  ...props
}) {
  const id = useId();
  const Control = multiline ? "textarea" : "input";
  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="block text-xs font-semibold text-slate-700"
      >
        {label}
      </label>
      <Control
        id={id}
        type={multiline ? undefined : type}
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={!!error}
        aria-describedby={`${id}-help`}
        className={`w-full rounded-lg border-0 bg-[#F5FAFF] px-3 py-2.5 text-sm text-slate-800 ${multiline ? "min-h-24 resize-y" : ""}`}
        {...props}
      />
      {(hint || error) && (
        <p
          id={`${id}-help`}
          className={`text-xs leading-5 ${error ? "text-red-700" : "text-slate-500"}`}
        >
          {error || hint}
        </p>
      )}
    </div>
  );
}
export function ColorField({ label, value, onChange, error }) {
  const id = useId();
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-xs font-semibold">
        {label}
      </label>
      <div className="flex gap-2">
        <input
          type="color"
          aria-label={`${label} color picker`}
          value={/^#[0-9a-f]{6}$/i.test(value || "") ? value : "#ffffff"}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 w-12 rounded-lg border-0 bg-[#F5FAFF] p-1 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-0 [&::-webkit-color-swatch]:rounded [&::-moz-color-swatch]:border-0 [&::-moz-color-swatch]:rounded"
        />
        <input
          id={id}
          value={value || ""}
          onChange={(event) => onChange(event.target.value)}
          maxLength={7}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className="min-w-0 flex-1 rounded-lg border-0 bg-[#F5FAFF] px-3 text-sm"
        />
      </div>
      {error && (
        <p id={`${id}-error`} className="text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
