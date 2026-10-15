"use client";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  Eye,
  Check,
  PanelsTopLeft,
  Monitor,
  Smartphone,
} from "lucide-react";

export default function TemplateLibrary({ templateSections = [] }) {
  const [preview, setPreview] = useState(false);
  const [mobile, setMobile] = useState(false);
  return (
    <main className="space-y-7">
      <div>
        <p className="text-xs font-bold tracking-widest text-blue-600">
          A GREAT PLACE TO START
        </p>
        <h1 className="mt-2 text-3xl font-bold">Templates</h1>
        <p className="mt-3 text-sm text-slate-500">
          Choose a starting point. Make every section your own.
        </p>
      </div>
      <div className="grid overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[1.1fr_1fr]">
        <div className="flex min-h-72 items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100/60 p-8">
          <div
            aria-hidden="true"
            className="w-full max-w-sm overflow-hidden rounded-xl border border-white bg-white shadow-xl shadow-blue-900/10"
          >
            <div className="flex items-center justify-between border-b border-slate-100 p-4">
              <span className="flex items-center gap-2 text-xs font-bold">
                <PanelsTopLeft size={16} className="text-blue-500" />
                Your Business
              </span>
              <div className="h-2 w-16 rounded bg-slate-100" />
            </div>
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-6">
              <div>
                <div className="h-1.5 w-12 rounded bg-blue-200" />
                <div className="mt-3 h-3 w-full rounded bg-slate-700" />
                <div className="mt-2 h-3 w-3/4 rounded bg-slate-700" />
                <div className="mt-3 h-1.5 w-full rounded bg-slate-200" />
                <div className="mt-1.5 h-1.5 w-4/5 rounded bg-slate-200" />
                <div className="mt-4 h-6 w-16 rounded-md bg-blue-500" />
              </div>
              <div className="flex items-center justify-center rounded-xl bg-blue-100">
                <PanelsTopLeft size={36} className="text-blue-400" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 p-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-lg border border-slate-100 p-3">
                  <div className="size-4 rounded bg-blue-100" />
                  <div className="mt-2 h-1.5 rounded bg-slate-200" />
                  <div className="mt-1 h-1 w-3/4 rounded bg-slate-100" />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="p-7 md:p-9">
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            Ready to customize
          </span>
          <h2 className="mt-5 text-2xl font-bold">Business Essentials</h2>
          <p className="mt-3 text-sm leading-7 text-slate-500">
            A clean, responsive website for clinics, agencies, local businesses,
            and service teams. Introduce your business, show what you offer, and
            help visitors get in touch.
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3 text-xs text-slate-600">
            {[
              "8 starter sections",
              "12 section types",
              "Mobile responsive",
              "Custom colors & fonts",
            ].map((text) => (
              <p key={text} className="flex items-center gap-2">
                <Check
                  size={14}
                  className="shrink-0 text-emerald-600"
                  aria-hidden="true"
                />
                {text}
              </p>
            ))}
          </div>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/dashboard/websites/new"
              className="inline-flex items-center gap-2 rounded-lg bg-[#0879dc] px-5 py-3 text-sm font-semibold text-white hover:bg-[#06325E]"
            >
              Use template
              <ArrowRight size={16} />
            </Link>
            <button
              type="button"
              aria-expanded={preview}
              aria-controls="template-preview"
              onClick={() => setPreview((value) => !value)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-5 py-3 text-sm font-semibold hover:bg-slate-50"
            >
              <Eye size={16} />
              {preview ? "Close preview" : "Preview template"}
            </button>
          </div>
        </div>
      </div>
      {preview && (
        <section
          id="template-preview"
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
            <h2 className="text-sm font-semibold">Template preview</h2>
            <div role="group" aria-label="Preview size" className="flex gap-2">
              <button
                type="button"
                aria-pressed={!mobile}
                onClick={() => setMobile(false)}
                className={`rounded-lg p-2 ${!mobile ? "bg-slate-100" : ""}`}
                aria-label="Desktop preview"
              >
                <Monitor size={18} />
              </button>
              <button
                type="button"
                aria-pressed={mobile}
                onClick={() => setMobile(true)}
                className={`rounded-lg p-2 ${mobile ? "bg-slate-100" : ""}`}
                aria-label="Mobile preview"
              >
                <Smartphone size={18} />
              </button>
            </div>
          </div>
          <div className="max-h-[700px] overflow-auto bg-slate-100 p-3">
            <iframe
              src="/template-preview"
              title={`Business Essentials ${mobile ? "mobile" : "desktop"} preview`}
              className={`mx-auto block h-[620px] rounded-xl border border-slate-200 bg-white ${mobile ? "w-full max-w-[390px]" : "w-full"}`}
            />
          </div>
          <p className="border-t border-slate-200 p-4 text-xs text-slate-500">
            Sample content. Replace the images and text with your own in the
            website editor.
          </p>
        </section>
      )}
      <section>
        <h2 className="text-lg font-semibold">Sections you can build with</h2>
        <p className="mt-2 text-sm text-slate-500">
          Add, reorder, hide, or remove sections to suit your website.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {templateSections.map((section) => (
            <div
              key={section.type}
              className="rounded-xl border border-slate-200 bg-white p-4"
            >
              <h3 className="text-sm font-semibold">{section.label}</h3>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                {section.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
