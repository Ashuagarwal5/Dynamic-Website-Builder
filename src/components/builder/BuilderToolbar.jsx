"use client";
import {
  ArrowLeft,
  Undo2,
  Redo2,
  Eye,
  Save,
  Send,
  Settings,
  RotateCcw,
  GlobeLock,
} from "lucide-react";
import StatusBadge from "../websites/StatusBadge";
import ViewportSwitcher from "./ViewportSwitcher";
import { useSession } from "../auth/SessionProvider";
import { siteViewUrl } from "../../lib/demo-workspace";
export default function BuilderToolbar({
  editor,
  onExit,
  onDiscard,
  onPublish,
  onUnpublish,
}) {
  const working = editor.busy || editor.mediaPending > 0;
  // Backend websites have no separate draft copy: saving a published site updates it.
  const live = Boolean(editor.backend && editor.site.published);
  const scope = useSession()?.websiteScope;
  const invalid = Object.keys(editor.validation).length > 0;
  return (
    <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 max-lg:max-h-[220px] max-lg:overflow-y-auto">
      <div className="flex min-w-0 flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => onExit("/dashboard/websites")}
          className="flex size-9 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-50"
          aria-label="Back to My Websites"
        >
          <ArrowLeft size={19} />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-bold">{editor.site.name}</h1>
          <p className="truncate text-[11px] text-slate-500">
            {editor.displayPath ?? `/site/${editor.site.slug}`}
          </p>
        </div>
        <StatusBadge published={editor.site.published} />
        <span
          className={`text-[11px] font-medium ${editor.dirty ? "text-amber-700" : "text-slate-400"}`}
          role="status"
        >
          {editor.dirty
            ? "Unsaved changes"
            : live
              ? "Saved and live"
              : "Draft up to date"}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1">
          <button
            type="button"
            className="flex size-9 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-50"
            aria-label="Undo"
            disabled={working || !editor.past.length}
            onClick={editor.undo}
          >
            <Undo2 size={17} />
          </button>
          <button
            type="button"
            className="flex size-9 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-50"
            aria-label="Redo"
            disabled={working || !editor.future.length}
            onClick={editor.redo}
          >
            <Redo2 size={17} />
          </button>
        </div>
        <ViewportSwitcher
          value={editor.viewport}
          onChange={editor.setViewport}
        />
        <button
          type="button"
          className="flex size-9 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-50"
          aria-label="Website settings"
          disabled={working}
          onClick={() =>
            onExit(
              editor.settingsUrl ??
                `/dashboard/websites/${encodeURIComponent(editor.site.slug)}/settings`,
            )
          }
        >
          <Settings size={17} />
        </button>
        <button
          type="button"
          className="flex size-9 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-50"
          aria-label="Discard unsaved changes"
          disabled={working || !editor.dirty}
          onClick={onDiscard}
        >
          <RotateCcw size={17} />
        </button>
        {(editor.liveUrl !== undefined
          ? editor.liveUrl
          : siteViewUrl(editor.site.slug, true, scope)) && (
          <a
            href={
              editor.liveUrl !== undefined
                ? editor.liveUrl
                : siteViewUrl(editor.site.slug, true, scope)
            }
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-[#06325E] hover:bg-slate-50"
            title={
              editor.liveUrl !== undefined
                ? "Opens the published website."
                : "Opens the saved draft only. The canvas includes unsaved changes."
            }
          >
            <Eye size={15} />
            {editor.liveUrl !== undefined ? "View live" : "Saved preview"}
          </a>
        )}
        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#06325E] hover:bg-slate-50"
          disabled={working || invalid}
          onClick={editor.save}
        >
          <Save size={15} />
          {working ? "Working..." : live ? "Save changes" : "Save Draft"}
        </button>
        {!live && (
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0879dc] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#06325E]"
            disabled={working || invalid}
            onClick={onPublish}
          >
            <Send size={15} />
            {editor.site.published ? "Update published site" : "Publish"}
          </button>
        )}
        {editor.site.published && (
          <button
            type="button"
            disabled={working}
            onClick={onUnpublish}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-amber-200 bg-white px-3 py-2.5 text-sm font-semibold text-amber-700 hover:bg-amber-50"
          >
            <GlobeLock size={15} />
            Unpublish
          </button>
        )}
      </div>
    </header>
  );
}
