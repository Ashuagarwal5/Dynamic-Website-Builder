/* eslint-disable @next/next/no-img-element -- Uploaded images and arbitrary user URLs. */
import {
  ArrowRight,
  Check,
  ImageIcon,
  MapPin,
  Phone,
  Mail,
  Play,
  Sparkles,
  Quote,
} from "lucide-react";
import { safeLink, validLink } from "../../lib/site-validation";

function Picture({ src, alt, className = "", primary }) {
  return src ? (
    <img
      src={safeLink(src, "", true)}
      alt={alt}
      className={`h-full w-full object-cover ${className}`}
      loading="lazy"
    />
  ) : (
    <div
      aria-hidden="true"
      className={`relative flex h-full min-h-52 items-center justify-center overflow-hidden bg-slate-100 ${className}`}
    >
      <div
        className="absolute -right-12 -top-16 size-64 rounded-full opacity-10"
        style={{ background: primary }}
      />
      <div className="absolute -bottom-16 -left-12 size-56 rounded-full bg-white/70" />
      <span
        className="relative flex size-20 items-center justify-center rounded-3xl border border-white bg-white/70 shadow-sm"
        style={{ color: primary }}
      >
        <ImageIcon size={32} strokeWidth={1.25} />
      </span>
    </div>
  );
}

export default function SectionBlocks({ content, editorSection }) {
  const primary = content.theme?.primary || "#0987F5";
  const dark = content.theme?.secondary || "#06325E";
  const sectionHeading = (section, light = false) => (
    <div className="max-w-2xl">
      {section.eyebrow && (
        <p
          className="mb-4 text-xs font-bold uppercase tracking-[0.18em]"
          style={{ color: light ? "#ffffffbb" : primary }}
        >
          {section.eyebrow}
        </p>
      )}
      <h2
        className="text-3xl font-semibold leading-tight tracking-tight md:text-4xl"
        style={{ color: light ? "#ffffff" : dark }}
      >
        {section.heading}
      </h2>
      {section.description && (
        <p
          className={`mt-5 whitespace-pre-line text-base leading-8 ${light ? "text-white/75" : "text-slate-500"}`}
        >
          {section.description}
        </p>
      )}
    </div>
  );
  const button = (section, light = false) =>
    section.buttonText && section.buttonUrl ? (
      <a
        href={safeLink(section.buttonUrl)}
        className={`mt-7 inline-flex items-center gap-3 rounded-xl px-6 py-3.5 text-sm font-semibold transition hover:opacity-90 ${light ? "bg-white" : "text-white"}`}
        style={{
          background: light ? "#ffffff" : primary,
          color: light ? dark : "#ffffff",
        }}
      >
        {section.buttonText}
        <ArrowRight size={16} aria-hidden="true" />
      </a>
    ) : null;
  return content.sections
    .filter((section) => section.enabled)
    .map((section) => {
      const editing = !!editorSection;
      const items = section.items || [];
      if (section.type === "TESTIMONIALS" && !items.length && !editing)
        return null;
      const marker = {
        id: section.id,
        "data-builder-section": section.id,
        "data-builder-active":
          editorSection === section.id ? "true" : undefined,
      };
      if (section.type === "HERO")
        return (
          <section
            key={section.id}
            {...marker}
            className="relative overflow-hidden bg-slate-50 px-6 py-20 md:py-28"
          >
            <div className="mx-auto grid max-w-6xl items-center gap-14 md:grid-cols-2">
              <div>
                {section.eyebrow && (
                  <p
                    className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-[11px] font-bold tracking-wider"
                    style={{ color: primary }}
                  >
                    <Sparkles size={13} aria-hidden="true" />
                    {section.eyebrow}
                  </p>
                )}
                <h1
                  className="text-4xl font-semibold leading-[1.08] tracking-tight md:text-6xl"
                  style={{ color: dark }}
                >
                  {section.heading}
                </h1>
                <p className="mt-6 max-w-lg whitespace-pre-line text-lg leading-8 text-slate-500">
                  {section.description}
                </p>
                {button(section)}
                <p className="mt-7 flex items-center gap-2 text-xs text-slate-400">
                  <Check size={14} aria-hidden="true" />
                  Here to help, every step of the way.
                </p>
              </div>
              <div className="relative">
                <div
                  className="absolute inset-5 translate-x-5 translate-y-5 rounded-[2rem] opacity-10"
                  style={{ background: primary }}
                />
                <div className="relative h-80 overflow-hidden rounded-[2rem] border-8 border-white bg-white shadow-xl shadow-slate-900/5 md:h-[420px]">
                  <Picture
                    src={section.image}
                    alt={section.heading}
                    primary={primary}
                  />
                </div>
                <div className="absolute -bottom-5 left-5 flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-lg shadow-slate-900/5">
                  <span
                    className="flex size-10 items-center justify-center rounded-xl bg-slate-50"
                    style={{ color: primary }}
                  >
                    <Sparkles size={20} aria-hidden="true" />
                  </span>
                  <div>
                    <p
                      className="text-sm font-semibold"
                      style={{ color: dark }}
                    >
                      {content.businessName}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      A personal touch. A better experience.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        );
      if (section.type === "CTA" || section.type === "BANNER")
        return (
          <section key={section.id} {...marker} className="px-6 py-12">
            <div
              className={`mx-auto max-w-6xl rounded-3xl px-8 py-12 md:px-14 ${section.type === "BANNER" ? "md:flex md:items-center md:justify-between md:gap-10" : "text-center [&>div]:mx-auto"}`}
              style={{ background: dark }}
            >
              {sectionHeading(section, true)}
              {button(section, true)}
            </div>
          </section>
        );
      if (section.type === "IMAGE_TEXT")
        return (
          <section
            key={section.id}
            {...marker}
            className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 md:grid-cols-2"
          >
            <div className="h-80 overflow-hidden rounded-3xl">
              <Picture
                src={section.image}
                alt={section.heading}
                primary={primary}
              />
            </div>
            <div>
              {sectionHeading(section)}
              {button(section)}
            </div>
          </section>
        );
      if (section.type === "CONTACT")
        return (
          <section
            key={section.id}
            {...marker}
            className="bg-slate-50 px-6 py-20"
          >
            <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-2">
              {sectionHeading(section)}
              <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-7">
                {[
                  [MapPin, "Visit us", section.address, null],
                  [Phone, "Call us", section.phone, `tel:${section.phone}`],
                  [Mail, "Email us", section.email, `mailto:${section.email}`],
                ].map(
                  ([Icon, label, value, href]) =>
                    value && (
                      <div key={label} className="flex items-start gap-4">
                        <span
                          className="rounded-xl bg-slate-50 p-3"
                          style={{ color: primary }}
                        >
                          <Icon size={18} aria-hidden="true" />
                        </span>
                        <div>
                          <p className="text-xs text-slate-400">{label}</p>
                          {href ? (
                            <a
                              href={safeLink(href)}
                              className="mt-1 block break-all text-sm font-medium"
                            >
                              {value}
                            </a>
                          ) : (
                            <p className="mt-1 whitespace-pre-line text-sm">
                              {value}
                            </p>
                          )}
                        </div>
                      </div>
                    ),
                )}
                {editing &&
                  !section.address &&
                  !section.phone &&
                  !section.email && (
                    <p className="text-sm text-slate-400">
                      Add your address, phone and email in the editor.
                    </p>
                  )}
              </div>
            </div>
          </section>
        );
      return (
        <section
          key={section.id}
          {...marker}
          className={`px-6 py-20 ${["FEATURES", "FAQ"].includes(section.type) ? "bg-slate-50" : ""}`}
        >
          <div className="mx-auto max-w-6xl">
            {sectionHeading(section)}
            {section.type === "TEXT" && button(section)}
            {section.type === "IMAGE" && (
              <div className="mt-8 h-80 overflow-hidden rounded-3xl md:h-[480px]">
                <Picture
                  src={section.image}
                  alt={section.heading}
                  primary={primary}
                />
              </div>
            )}
            {section.type === "VIDEO" &&
              (section.url &&
              validLink(section.url, true) &&
              !section.url.startsWith("data:") ? (
                <video
                  className="mt-8 aspect-video w-full rounded-2xl bg-slate-900"
                  controls
                  preload="metadata"
                  src={section.url}
                  poster={
                    section.image
                      ? safeLink(section.image, "", true)
                      : undefined
                  }
                  aria-label={section.heading}
                >
                  <track kind="captions" />
                  Your browser does not support video playback.
                </video>
              ) : (
                editing && (
                  <div className="mt-8 flex aspect-video items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                    <Play size={40} aria-hidden="true" />
                    <span className="ml-3 text-sm">Add a hosted video URL</span>
                  </div>
                )
              ))}
            {section.type === "FEATURES" && (
              <div className="mt-10 grid gap-5 md:grid-cols-3">
                {items.map((item, index) => (
                  <article
                    key={item.id}
                    className="rounded-2xl border border-slate-200/70 bg-white p-7"
                  >
                    <span
                      className="mb-6 flex size-11 items-center justify-center rounded-xl bg-slate-50 text-sm font-bold"
                      style={{ color: primary }}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    {item.image && (
                      <div className="mb-5 h-40 overflow-hidden rounded-xl">
                        <Picture
                          src={item.image}
                          alt={item.title}
                          primary={primary}
                        />
                      </div>
                    )}
                    <h3
                      className="text-lg font-semibold"
                      style={{ color: dark }}
                    >
                      {item.title}
                    </h3>
                    <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-500">
                      {item.description}
                    </p>
                  </article>
                ))}
              </div>
            )}
            {section.type === "TESTIMONIALS" && (
              <div className="mt-10 grid gap-5 md:grid-cols-2">
                {items.map((item) => (
                  <blockquote
                    key={item.id}
                    className="rounded-2xl border border-slate-200 p-7"
                  >
                    <Quote
                      size={24}
                      className="mb-5"
                      style={{ color: primary }}
                      aria-hidden="true"
                    />
                    <p className="whitespace-pre-line text-lg leading-8">
                      {item.description}
                    </p>
                    <footer className="mt-6 flex items-center gap-3">
                      {item.image && (
                        <img
                          src={safeLink(item.image, "", true)}
                          alt=""
                          className="size-10 rounded-full object-cover"
                        />
                      )}
                      <span
                        className="text-sm font-semibold"
                        style={{ color: dark }}
                      >
                        {item.title}
                      </span>
                    </footer>
                  </blockquote>
                ))}
                {!items.length && (
                  <p className="text-sm text-slate-400">
                    Add a real customer review to show this section.
                  </p>
                )}
              </div>
            )}
            {section.type === "FAQ" && (
              <div className="mt-10 max-w-3xl space-y-3">
                {items.map((item) => (
                  <details
                    key={item.id}
                    className="group rounded-xl border border-slate-200 bg-white px-6 py-5"
                  >
                    <summary
                      className="cursor-pointer text-sm font-semibold"
                      style={{ color: dark }}
                    >
                      {item.title}
                    </summary>
                    <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-500">
                      {item.description}
                    </p>
                  </details>
                ))}
              </div>
            )}
            {section.type === "GALLERY" && (
              <div className="mt-10 grid gap-5 sm:grid-cols-2 md:grid-cols-3">
                {items
                  .filter((item) => editing || item.image)
                  .map((item) => (
                    <figure key={item.id}>
                      <div className="h-60 overflow-hidden rounded-2xl">
                        <Picture
                          src={item.image}
                          alt={item.title}
                          primary={primary}
                        />
                      </div>
                      <figcaption className="mt-3 text-sm text-slate-500">
                        {item.title}
                      </figcaption>
                    </figure>
                  ))}
              </div>
            )}
          </div>
        </section>
      );
    });
}
