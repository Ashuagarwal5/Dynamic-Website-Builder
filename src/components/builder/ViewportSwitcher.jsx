"use client";
import { Monitor, Tablet, Smartphone } from "lucide-react";
import { viewports } from "../../lib/builder-sections";
export default function ViewportSwitcher({ value, onChange }) {
  const icons = { desktop: Monitor, tablet: Tablet, mobile: Smartphone };
  return (
    <div
      role="group"
      aria-label="Preview device"
      className="flex rounded-lg border border-slate-200 bg-white p-1"
    >
      {viewports.map((viewport) => {
        const Icon = icons[viewport.id];
        return (
          <button
            type="button"
            key={viewport.id}
            aria-label={`${viewport.label} preview, ${viewport.width} pixels`}
            aria-pressed={value === viewport.id}
            onClick={() => onChange(viewport.id)}
            className={`flex size-9 shrink-0 items-center justify-center rounded-lg hover:bg-slate-50 ${value === viewport.id ? "bg-blue-50 text-blue-600" : "text-slate-400"}`}
          >
            <Icon size={18} />
          </button>
        );
      })}
    </div>
  );
}
