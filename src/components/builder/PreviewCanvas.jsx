"use client";
import { useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { createLocalId } from "../../lib/site-service";
import {
  PREVIEW_CHANNEL,
  PREVIEW_VERSION,
  validPreviewMessage,
  viewports,
  getBuilderSections,
} from "../../lib/builder-sections";
export default function PreviewCanvas({ editor }) {
  const slug = editor.site.slug;
  const setSection = editor.setSection;
  const sectionIds = useRef([]);
  useEffect(() => {
    sectionIds.current = getBuilderSections(editor.draft).map(
      (section) => section.id,
    );
  }, [editor.draft]);
  const frame = useRef(null),
    canvas = useRef(null);
  const [session] = useState(createLocalId),
    [ready, setReady] = useState(false),
    [failed, setFailed] = useState(false),
    [revision, setRevision] = useState(0),
    [attempt, setAttempt] = useState(0);
  const [size, setSize] = useState({ width: 1000, height: 700 });
  const selected = viewports.find(
    (viewport) => viewport.id === editor.viewport,
  );
  const scale = Math.min(1, Math.max(0.1, (size.width - 32) / selected.width));
  const height = Math.max(300, size.height - 72);
  useEffect(() => {
    const element = canvas.current;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setSize({ width, height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    function receive(event) {
      if (
        !validPreviewMessage(
          event,
          frame.current?.contentWindow,
          window.location.origin,
          slug,
          session,
        )
      )
        return;
      if (event.data.type === "READY") {
        setReady(true);
        setFailed(false);
        setRevision((value) => value + 1);
        clearTimeout(timeout);
      }
      if (
        event.data.type === "SELECT" &&
        sectionIds.current.includes(event.data.section)
      )
        setSection(event.data.section);
    }
    window.addEventListener("message", receive);
    const timeout = setTimeout(() => setFailed(true), 12000);
    return () => {
      window.removeEventListener("message", receive);
      clearTimeout(timeout);
    };
  }, [session, slug, setSection, attempt]);
  useEffect(() => {
    if (!ready) return;
    frame.current?.contentWindow?.postMessage(
      {
        channel: PREVIEW_CHANNEL,
        version: PREVIEW_VERSION,
        type: "SYNC",
        slug: slug,
        session,
        content: editor.draft,
        section: editor.section,
      },
      window.location.origin,
    );
  }, [ready, revision, editor.draft, editor.section, slug, session]);
  return (
    <section
      ref={canvas}
      className="relative min-h-0 min-w-0 flex-1 overflow-hidden bg-[#edf3f9] bg-[radial-gradient(#cbd5e1_0.6px,transparent_0.6px)] bg-size-[12px_12px] p-3 lg:p-4 max-lg:group-data-[tab=edit]/builder:hidden"
      aria-label="Live website preview"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
        <p>
          {selected.label} / {selected.width}px / {Math.round(scale * 100)}% fit
        </p>
        <span>Live canvas includes unsaved changes</span>
      </div>
      {!ready && (
        <div
          role="status"
          className="absolute inset-x-4 top-24 z-10 rounded-xl border border-slate-200 bg-white p-5 text-center text-sm"
        >
          {failed ? (
            <>
              <p>
                Preview could not connect. Your editor changes are still here.
              </p>
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-[#06325E] hover:bg-slate-50 mt-3"
                onClick={() => {
                  setReady(false);
                  setFailed(false);
                  setAttempt((value) => value + 1);
                }}
              >
                <RefreshCw size={14} />
                Retry preview
              </button>
            </>
          ) : (
            "Connecting live preview..."
          )}
        </div>
      )}
      <div
        className="mx-auto overflow-hidden rounded-xl border border-slate-300 bg-white shadow-lg"
        style={{ width: selected.width * scale, height }}
      >
        <iframe
          key={attempt}
          ref={frame}
          src={`/builder-preview/${encodeURIComponent(slug)}?session=${encodeURIComponent(session)}`}
          title={`${editor.site.name} live ${selected.label.toLowerCase()} preview`}
          className="block origin-top-left border-0 motion-safe:transition-[width] motion-safe:duration-300"
          style={{
            width: selected.width,
            height: height / scale,
            transform: `scale(${scale})`,
          }}
        />
      </div>
      <p className="mt-3 text-center text-[10px] text-slate-400">
        Scroll inside the website. Click a section to edit it. Navigation is
        disabled inside the canvas.
      </p>
    </section>
  );
}
