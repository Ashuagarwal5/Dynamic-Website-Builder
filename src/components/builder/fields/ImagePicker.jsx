"use client";
import { useEffect, useId, useRef, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { readLocalImage } from "../../../lib/media-service";
import { safeLink } from "../../../lib/site-validation";
import { EditorField } from "./EditorField";
export function ImagePreview({ value, label }) {
  const [failed, setFailed] = useState("");
  const url = safeLink(value, "", true);
  if (!url || failed === url)
    return (
      <div className="grid h-28 place-items-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-xs text-slate-400">
        {url ? "Image unavailable" : "No image selected"}
      </div>
    );
  // Arbitrary user URLs and persisted data URLs cannot use a fixed remote host allowlist.
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={`${label} preview`}
      onError={() => setFailed(url)}
      className="h-28 w-full rounded-lg border border-slate-200 bg-slate-50 object-contain"
    />
  );
}
export default function ImagePicker({
  label,
  value,
  onChange,
  error,
  beginMedia,
}) {
  const id = useId(),
    input = useRef(null),
    generation = useRef(0),
    pendingRelease = useRef(null);
  const [problem, setProblem] = useState(""),
    [reading, setReading] = useState(false);
  useEffect(
    () => () => {
      generation.current++;
      pendingRelease.current?.();
    },
    [],
  );
  async function select(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    pendingRelease.current?.();
    const release = beginMedia?.() || (() => {});
    pendingRelease.current = release;
    const request = ++generation.current;
    setReading(true);
    setProblem("");
    try {
      const data = await readLocalImage(file);
      if (request === generation.current) onChange(data);
    } catch (issue) {
      if (request === generation.current) setProblem(issue.message);
    } finally {
      release();
      if (request === generation.current) setReading(false);
    }
  }
  return (
    <div className="space-y-3 rounded-xl border border-slate-200 p-3">
      <p className="text-xs font-semibold">{label}</p>
      <ImagePreview value={value} label={label} />
      <input
        ref={input}
        id={id}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        aria-label={`Choose ${label}`}
        className="sr-only"
        onChange={select}
        disabled={reading}
      />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={reading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-[#06325E] hover:bg-slate-50"
          onClick={() => input.current?.click()}
        >
          <ImagePlus size={14} />
          {reading
            ? "Reading image..."
            : value
              ? "Replace image"
              : "Choose image"}
        </button>
        {value && (
          <button
            type="button"
            disabled={reading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 hover:bg-slate-50"
            onClick={() => {
              generation.current++;
              onChange("");
              setProblem("");
            }}
            aria-label={`Remove ${label}`}
          >
            <Trash2 size={14} />
            Remove
          </button>
        )}
      </div>
      <EditorField
        label="Image URL or local public path"
        value={value?.startsWith("data:") ? "" : value}
        onChange={(url) => {
          generation.current++;
          setReading(false);
          onChange(url);
          setProblem("");
        }}
        placeholder={
          value?.startsWith("data:")
            ? "Local image selected; enter URL to replace"
            : "https://... or /images/..."
        }
        error={error}
      />
      <p className="text-[11px] leading-5 text-slate-500">
        JPEG, PNG, WebP. Maximum 256 KB. Local images stay in this browser and
        are persisted when you save.
      </p>
      {problem && (
        <p role="alert" className="text-xs text-red-700">
          {problem}
        </p>
      )}
    </div>
  );
}
