"use client";
import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import WebsiteTemplate from "../WebsiteTemplate";
import {
  getBuilderSections,
  PREVIEW_CHANNEL,
  PREVIEW_VERSION,
  validPreviewMessage,
} from "../../lib/builder-sections";
export default function PreviewDocument() {
  const { slug } = useParams(),
    session = useSearchParams().get("session");
  const [content, setContent] = useState(null),
    [section, setSection] = useState("hero");
  const root = useRef(null);
  useEffect(() => {
    if (!session || window.parent === window) return;
    const parent = window.parent,
      origin = window.location.origin;
    const ready = () =>
      parent.postMessage(
        {
          channel: PREVIEW_CHANNEL,
          version: PREVIEW_VERSION,
          type: "READY",
          slug,
          session,
        },
        origin,
      );
    function receive(event) {
      if (
        !validPreviewMessage(event, parent, origin, slug, session) ||
        event.data.type !== "SYNC"
      )
        return;
      if (
        !event.data.content?.hero ||
        !event.data.content?.about ||
        !event.data.content?.contact ||
        !Array.isArray(event.data.content?.services) ||
        !Array.isArray(event.data.content?.testimonials)
      )
        return;
      clearInterval(timer);
      setContent(event.data.content);
      if (
        getBuilderSections(event.data.content).some(
          (item) => item.id === event.data.section,
        )
      )
        setSection(event.data.section);
    }
    window.addEventListener("message", receive);
    const timer = setInterval(ready, 500);
    ready();
    return () => {
      clearInterval(timer);
      window.removeEventListener("message", receive);
    };
  }, [slug, session]);
  useEffect(() => {
    document.documentElement.classList.add("builder-preview-document");
    return () =>
      document.documentElement.classList.remove("builder-preview-document");
  }, []);
  useEffect(() => {
    const element = root.current?.querySelector(
      `[data-builder-section="${section}"]`,
    );
    if (!element) return;
    // Scroll only this iframe. scrollIntoView can also move ancestor documents.
    const top = element.getBoundingClientRect().top + window.scrollY - 84;
    window.scrollTo({
      top: Math.max(0, top),
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  }, [section]);
  if (!content)
    return (
      <div className="p-8 text-center text-sm text-slate-500">
        Waiting for the website editor. This preview receives unsaved content
        only from its parent builder.
      </div>
    );
  function select(event) {
    if (event.target.closest("a")) event.preventDefault();
    const selected = event.target.closest("[data-builder-section]")?.dataset
      .builderSection;
    if (!selected) return;
    window.parent.postMessage(
      {
        channel: PREVIEW_CHANNEL,
        version: PREVIEW_VERSION,
        type: "SELECT",
        slug,
        session,
        section: selected,
      },
      window.location.origin,
    );
  }
  return (
    <div
      ref={root}
      className="[&_[data-builder-active=true]]:ring-2 [&_[data-builder-active=true]]:ring-inset [&_[data-builder-active=true]]:ring-[#0987F5] [&_[data-builder-active=true]]:scroll-mt-[84px] [&_a]:cursor-default"
      onClickCapture={select}
      onAuxClickCapture={(event) => event.preventDefault()}
    >
      <WebsiteTemplate content={content} editorSection={section} />
    </div>
  );
}
