"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  createLocalId,
  getSite,
  publishSite,
  saveDraft,
} from "../../../../lib/site-service";

import {
  LoadingSkeleton,
  NotFoundState,
} from "../../../../components/admin/States";
import ServiceError from "../../../../components/websites/ServiceError";
const tabs = [
  "Brand",
  "Hero",
  "About",
  "Services",
  "Testimonials",
  "Contact",
  "SEO",
];
export default function WebsiteEditorPage() {
  const { slug } = useParams();
  return <WebsiteEditorContent key={slug} slug={slug} />;
}
function WebsiteEditorContent({ slug }) {
  const router = useRouter();
  const [draft, setDraft] = useState(null);
  const [tab, setTab] = useState("Brand");
  const [status, setStatus] = useState("");
  const [loadError, setLoadError] = useState(null);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const reload = () => {
    setLoadError(null);
    getSite(slug)
      .then((site) => setDraft(site?.draft ?? false))
      .catch(setLoadError);
  };
  useEffect(() => {
    let active = true;
    getSite(slug)
      .then((site) => {
        if (active) setDraft(site?.draft ?? false);
      })
      .catch((error) => {
        if (active) setLoadError(error);
      });
    return () => {
      active = false;
    };
  }, [slug]);
  const update = (section, key, value) =>
    setDraft((old) =>
      section
        ? { ...old, [section]: { ...old[section], [key]: value } }
        : { ...old, [key]: value },
    );
  const setItem = (collection, index, key, value) =>
    setDraft((old) => ({
      ...old,
      [collection]: old[collection].map((item, i) =>
        i === index ? { ...item, [key]: value } : item,
      ),
    }));
  const addItem = (collection) =>
    setDraft((old) => ({
      ...old,
      [collection]: [
        ...old[collection],
        collection === "services"
          ? { id: createLocalId(), title: "New service", description: "" }
          : { id: createLocalId(), name: "Customer", quote: "" },
      ],
    }));
  const removeItem = (collection, index) =>
    setDraft((old) => ({
      ...old,
      [collection]: old[collection].filter((_, i) => i !== index),
    }));
  const runAction = async (action) => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setStatus("");
    const previewWindow =
      action === "preview" ? window.open("", "_blank") : null;
    if (previewWindow) previewWindow.opener = null;
    try {
      await saveDraft(slug, draft);
      if (action === "publish") {
        await publishSite(slug);
        setStatus("Published in local demo storage (not a live deployment).");
      } else if (action === "preview") {
        const url = `/site/${encodeURIComponent(slug)}?preview=1`;
        if (previewWindow) previewWindow.location.href = url;
        else router.push(url);
        setStatus("Draft saved. Preview opened.");
      } else setStatus("Draft saved in this browser.");
    } catch (error) {
      previewWindow?.close();
      setStatus(error.message);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const input = (label, section, key, multiline = false, type = "text") => (
    <label key={`${section}-${key}`} className="block space-y-2">
      <span className="block text-sm font-semibold text-slate-700">
        {label}
      </span>
      {multiline ? (
        <textarea
          className="min-h-24 w-full rounded-xl border border-slate-200 px-4 py-3 outline-blue-500"
          value={draft[section]?.[key] ?? ""}
          onChange={(e) => update(section, key, e.target.value)}
        />
      ) : (
        <input
          type={type}
          className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-blue-500"
          value={section ? (draft[section]?.[key] ?? "") : (draft[key] ?? "")}
          onChange={(e) => update(section, key, e.target.value)}
        />
      )}
    </label>
  );
  if (loadError) return <ServiceError error={loadError} onRetry={reload} />;
  if (draft === null) return <LoadingSkeleton />;
  if (draft === false) return <NotFoundState />;
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white px-6 py-5">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div>
            <Link href="/dashboard/websites" className="text-sm text-blue-600">
              All websites
            </Link>
            <h1 className="mt-1 text-2xl font-bold">
              Editing: {draft.businessName}
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/dashboard/websites/${encodeURIComponent(slug)}/settings`}
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold"
            >
              Website settings
            </Link>
            <button
              disabled={busy}
              onClick={() => runAction("save")}
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold"
            >
              Save draft
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => runAction("preview")}
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold"
            >
              Save &amp; preview
            </button>
            <button
              disabled={busy}
              onClick={() => runAction("publish")}
              className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white"
            >
              Publish
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto grid max-w-7xl gap-6 px-6 py-8 md:grid-cols-[220px_1fr]">
        <aside className="rounded-2xl border border-slate-200 bg-white p-3 md:self-start">
          {tabs.map((item) => (
            <button
              key={item}
              onClick={() => setTab(item)}
              className={`block w-full rounded-xl px-4 py-3 text-left text-sm font-semibold ${tab === item ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"}`}
            >
              {item}
            </button>
          ))}
        </aside>
        <section className="rounded-2xl border border-slate-200 bg-white p-7">
          <h2 className="mb-6 text-2xl font-bold">{tab} Settings</h2>
          <div className="grid gap-5">
            {tab === "Brand" && (
              <>
                {input("Business name", null, "businessName")}
                {input("Logo image URL", null, "logo")}
                {input("Phone", null, "phone")}
                {input("Email", null, "email")}
                {input("Primary color", "theme", "primary", false, "color")}
                {input("Secondary color", "theme", "secondary", false, "color")}
              </>
            )}
            {tab === "Hero" && (
              <>
                {input("Eyebrow", "hero", "eyebrow")}
                {input("Heading", "hero", "heading")}
                {input("Description", "hero", "description", true)}
                {input("Button text", "hero", "buttonText")}
                {input("Button URL", "hero", "buttonUrl")}
                {input("Hero image URL", "hero", "image")}
              </>
            )}
            {tab === "About" && (
              <>
                {input("Heading", "about", "heading")}
                {input("Description", "about", "description", true)}
                {input("Image URL", "about", "image")}
              </>
            )}
            {tab === "Contact" && (
              <>
                {["address", "phone", "email", "instagram", "facebook"].map(
                  (key) =>
                    input(
                      key[0].toUpperCase() + key.slice(1),
                      "contact",
                      key,
                      key === "address",
                    ),
                )}
              </>
            )}
            {tab === "SEO" && (
              <>
                {input("SEO title", "seo", "title")}
                {input("Meta description", "seo", "description", true)}
                <p className="text-sm text-amber-700">
                  SEO values are stored for future server-side metadata
                  integration.
                </p>
              </>
            )}
            {["Services", "Testimonials"].includes(tab) && (
              <>
                {draft[tab.toLowerCase()].map((item, index) => (
                  <div
                    key={item.id}
                    className="space-y-3 rounded-xl border border-slate-200 p-4"
                  >
                    {Object.keys(item)
                      .filter((key) => key !== "id")
                      .map((key) => (
                        <label key={key} className="block space-y-1">
                          <span className="text-sm font-semibold capitalize">
                            {key}
                          </span>
                          <input
                            className="w-full rounded-lg border border-slate-200 p-3"
                            value={item[key]}
                            onChange={(e) =>
                              setItem(
                                tab.toLowerCase(),
                                index,
                                key,
                                e.target.value,
                              )
                            }
                          />
                        </label>
                      ))}
                    <button
                      className="text-sm font-semibold text-red-600"
                      onClick={() => removeItem(tab.toLowerCase(), index)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => addItem(tab.toLowerCase())}
                  className="rounded-xl border border-blue-200 px-5 py-3 font-semibold text-blue-700"
                >
                  + Add {tab === "Services" ? "service" : "testimonial"}
                </button>
              </>
            )}
          </div>
          {status && (
            <p role="status" className="mt-5 text-sm text-emerald-700">
              {status}
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
