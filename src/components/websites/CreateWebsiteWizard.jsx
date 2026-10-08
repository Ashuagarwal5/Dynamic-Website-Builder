"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, CheckCircle2 } from "lucide-react";
import {
  createDefaultContent,
  createSite,
  listSites,
} from "../../lib/site-service";
import {
  slugify,
  TEMPLATE_ID,
  validateDetails,
} from "../../lib/site-validation";
import WebsiteTemplate from "../WebsiteTemplate";
import WebsiteDetailsFields from "./WebsiteDetailsFields";
import ServiceError from "./ServiceError";
import { LoadingSkeleton } from "../admin/States";

export default function CreateWebsiteWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1),
    [sites, setSites] = useState(null),
    [loadError, setLoadError] = useState(null);
  const [values, setValues] = useState({
    name: "",
    businessName: "",
    industry: "",
    slug: "",
    templateId: TEMPLATE_ID,
  });
  const [manualSlug, setManualSlug] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(null);
  const lock = useRef(false),
    heading = useRef(null);
  const load = () => {
    setLoadError(null);
    listSites().then(setSites).catch(setLoadError);
  };
  useEffect(() => {
    let active = true;
    listSites()
      .then((data) => {
        if (active) setSites(data);
      })
      .catch((problem) => {
        if (active) setLoadError(problem);
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    heading.current?.focus();
  }, [step]);
  const errors = validateDetails(values, sites || []);
  function change(name, value) {
    if (name === "slug") setManualSlug(true);
    setValues((old) => ({
      ...old,
      [name]: value,
      ...(name === "name" && !manualSlug ? { slug: slugify(value) } : {}),
    }));
    setError(null);
  }
  async function submit(event) {
    event.preventDefault();
    if (lock.current || Object.keys(errors).length) return;
    if (step < 3) {
      setStep(step + 1);
      return;
    }
    lock.current = true;
    setBusy(true);
    setError(null);
    try {
      const site = await createSite(values);
      router.push(`/dashboard/sites/${encodeURIComponent(site.slug)}`);
    } catch (problem) {
      setError(problem);
      if (problem.fields?.slug) {
        setStep(1);
        listSites().then(setSites).catch(setLoadError);
      }
      lock.current = false;
      setBusy(false);
    }
  }
  if (loadError) return <ServiceError error={loadError} onRetry={load} />;
  if (!sites) return <LoadingSkeleton />;
  return (
    <main className="mx-auto max-w-4xl">
      <Link
        href="/dashboard/websites"
        className="mb-6 inline-flex items-center gap-2 text-sm text-blue-700"
      >
        <ArrowLeft size={16} />
        My Websites
      </Link>
      <h1 className="text-3xl font-bold">Create a website</h1>
      <p className="mt-3 text-sm text-slate-500">
        Start with your business details. Customize the content in the editor
        next.
      </p>
      <ol aria-label="Creation steps" className="my-8 grid grid-cols-3 gap-3">
        {[
          "Business information",
          "Template selection",
          "Review and create",
        ].map((label, index) => (
          <li
            key={label}
            aria-current={step === index + 1 ? "step" : undefined}
            className={`flex flex-wrap items-center gap-2 rounded-xl border p-3 text-xs sm:text-sm ${step === index + 1 ? "border-blue-300 bg-blue-50 font-semibold" : "border-slate-200 bg-white text-slate-500"}`}
          >
            <span className="flex size-6 items-center justify-center rounded-full bg-white">
              {step > index + 1 ? <Check size={14} /> : index + 1}
            </span>
            {label}
          </li>
        ))}
      </ol>
      <form
        onSubmit={submit}
        className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-8"
      >
        <h2 ref={heading} tabIndex={-1} className="mb-6 text-xl font-bold">
          {
            ["Business information", "Choose your template", "Ready to create"][
              step - 1
            ]
          }
        </h2>
        {step === 1 && (
          <WebsiteDetailsFields
            values={values}
            errors={{ ...errors, ...error?.fields }}
            onChange={change}
            disabled={busy}
          />
        )}
        {step === 2 && (
          <>
            <label className="mb-5 flex cursor-pointer items-center gap-3 rounded-xl border-2 border-blue-400 bg-blue-50 p-4">
              <input
                type="radio"
                name="template"
                value={TEMPLATE_ID}
                checked={values.templateId === TEMPLATE_ID}
                onChange={() =>
                  setValues((old) => ({ ...old, templateId: TEMPLATE_ID }))
                }
              />
              <span className="flex-1">
                <strong className="block">Business Template</strong>
                <span className="text-xs text-slate-500">
                  Hero, about, services, reviews and contact sections
                </span>
              </span>
              <CheckCircle2 size={20} className="text-blue-600" />
            </label>
            <p className="mb-3 text-xs text-slate-500">
              Preview of the reusable Business Template using your business
              name.
            </p>
            <div
              aria-hidden="true"
              inert
              className="h-64 overflow-hidden rounded-xl border border-slate-200"
            >
              <div
                style={{
                  width: 1000,
                  transform: "scale(0.5)",
                  transformOrigin: "top left",
                }}
              >
                <WebsiteTemplate
                  content={createDefaultContent(values.businessName)}
                />
              </div>
            </div>
            <div
              aria-disabled="true"
              className="mt-5 rounded-xl border border-dashed border-slate-200 p-5 text-sm text-slate-400"
            >
              More templates - Coming Soon
            </div>
          </>
        )}
        {step === 3 && (
          <>
            <dl className="grid gap-5 sm:grid-cols-2">
              {[
                ["Business", values.businessName],
                ["Website display name", values.name],
                ["Industry", values.industry || "Not specified"],
                ["Template", "Business Template"],
                ["Local URL", `/site/${values.slug}`],
                [
                  "Draft preview after creation",
                  `/site/${values.slug}?preview=1`,
                ],
                ["Initial status", "Draft / Unpublished"],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs text-slate-500">{label}</dt>
                  <dd className="mt-1 break-words font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-6 rounded-xl bg-[#F5FAFF] p-4 text-sm leading-6 text-slate-500">
              Your new website is saved only in this browser. It starts with
              editable default content. Creation does not publish or deploy it.
            </p>
          </>
        )}
        {error && (
          <div className="mt-5">
            <ServiceError error={error} />
          </div>
        )}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-6">
          {busy ? (
            <span className="text-sm text-slate-500">
              Creating your website...
            </span>
          ) : (
            <Link
              href="/dashboard/websites"
              className="text-sm font-semibold text-slate-500"
            >
              Cancel
            </Link>
          )}
          <div className="flex gap-3">
            {step > 1 && (
              <button
                type="button"
                className="admin-secondary"
                disabled={busy}
                onClick={() => setStep(step - 1)}
              >
                Back
              </button>
            )}
            <button
              type="submit"
              className="admin-primary"
              disabled={busy || Object.keys(errors).length > 0}
            >
              {busy
                ? "Creating..."
                : step === 3
                  ? "Create website"
                  : "Continue"}
            </button>
          </div>
        </div>
      </form>
    </main>
  );
}
