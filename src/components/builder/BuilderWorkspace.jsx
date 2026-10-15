"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PanelLeft, Eye } from "lucide-react";
import useWebsiteEditor from "../../hooks/useWebsiteEditor";
import { LoadingSkeleton, NotFoundState } from "../admin/States";
import ServiceError from "../websites/ServiceError";
import BuilderToolbar from "./BuilderToolbar";
import BuilderSidebar from "./BuilderSidebar";
import PreviewCanvas from "./PreviewCanvas";
import BuilderDialog from "./BuilderDialog";
export default function BuilderWorkspace() {
  const { slug } = useParams();
  return <Workspace key={slug} slug={slug} />;
}
function Workspace({ slug }) {
  const editor = useWebsiteEditor(slug),
    router = useRouter();
  const [tab, setTab] = useState("edit"),
    [collapsed, setCollapsed] = useState(false),
    [dialog, setDialog] = useState(null);
  if (editor.error)
    return (
      <div className="min-h-screen bg-[#F5FAFF] p-8">
        <ServiceError error={editor.error} onRetry={editor.retry} />
      </div>
    );
  if (editor.site === undefined || (editor.site && !editor.draft))
    return (
      <div className="min-h-screen bg-[#F5FAFF] p-8">
        <LoadingSkeleton />
      </div>
    );
  if (!editor.site)
    return (
      <main className="min-h-screen bg-[#F5FAFF] p-8">
        <NotFoundState />
      </main>
    );
  const exit = (url) => {
    if (editor.busy) return;
    if (editor.dirty || editor.mediaPending) setDialog({ type: "leave", url });
    else router.push(url);
  };
  const errors = Object.entries(editor.validation);
  function confirm() {
    const action = dialog;
    setDialog(null);
    if (action.type === "leave") {
      editor.discard();
      router.push(action.url);
    }
    if (action.type === "discard") editor.discard();
    if (action.type === "publish") editor.publish();
    if (action.type === "unpublish") editor.unpublish();
  }
  return (
    <div
      data-tab={tab}
      className="group/builder fixed inset-0 flex h-dvh flex-col overflow-hidden bg-[#F5FAFF] text-[#06325E] [&_:is(a,button):focus-visible]:outline-2 [&_:is(a,button):focus-visible]:outline-solid [&_:is(a,button):focus-visible]:outline-[#0987F5] [&_:is(a,button):focus-visible]:outline-offset-3 [&_button:disabled]:cursor-not-allowed [&_button:disabled]:opacity-45 [&_:is(input,textarea,select)]:border-0 [&_:is(input,textarea,select)]:outline-none [&_:is(input,textarea,select)]:shadow-none [&_:is(input,textarea,select)]:bg-[#F5FAFF] [&_:is(input,textarea,select):focus]:border-0 [&_:is(input,textarea,select):focus-visible]:outline-1! [&_:is(input,textarea,select):focus-visible]:outline-solid! [&_:is(input,textarea,select):focus-visible]:outline-slate-400! [&_:is(input,textarea,select):focus]:outline-offset-0 [&_:is(input,textarea,select):focus]:shadow-none [&_:is(input,textarea,select)[aria-invalid=true]]:bg-rose-50!"
    >
      <BuilderToolbar
        editor={editor}
        onExit={exit}
        onDiscard={() => setDialog({ type: "discard" })}
        onPublish={() => setDialog({ type: "publish" })}
        onUnpublish={() => setDialog({ type: "unpublish" })}
      />
      <div className="max-h-[110px] shrink-0 overflow-auto border-b border-slate-200 bg-white px-5 py-2 text-[11px] text-slate-500">
        <span role="status" aria-live="polite">
          {editor.mediaPending
            ? "Reading selected image. Wait for it to finish before saving."
            : editor.status ||
              (editor.dirty
                ? "Changes are only in the live canvas until you save."
                : "Editing your saved draft. Publish when your changes are ready.")}
        </span>
        {errors.length > 0 && (
          <details className="max-w-full text-red-700">
            <summary className="cursor-pointer">
              {errors.length} validation{" "}
              {errors.length === 1 ? "issue" : "issues"}
            </summary>
            <ul className="mt-2 space-y-1">
              {errors.map(([path, message]) => (
                <li key={path} className="break-words">
                  {path}: {message}
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
      <div
        className="flex shrink-0 gap-2 border-b border-slate-200 bg-white px-4 py-2 lg:hidden [&_button]:flex [&_button]:flex-1 [&_button]:items-center [&_button]:justify-center [&_button]:gap-2 [&_button]:rounded-lg [&_button]:p-2 [&_button]:text-xs [&_button]:font-semibold [&_[aria-pressed=true]]:bg-blue-50 [&_[aria-pressed=true]]:text-[#0987F5]"
        role="group"
        aria-label="Builder view"
      >
        <button
          type="button"
          aria-pressed={tab === "edit"}
          onClick={() => setTab("edit")}
        >
          <PanelLeft size={16} />
          Edit content
        </button>
        <button
          type="button"
          aria-pressed={tab === "preview"}
          onClick={() => setTab("preview")}
        >
          <Eye size={16} />
          Live preview
        </button>
      </div>
      <div className="flex min-h-0 flex-1">
        <BuilderSidebar
          editor={editor}
          collapsed={collapsed}
          onCollapse={() => setCollapsed((value) => !value)}
        />
        <PreviewCanvas editor={editor} />
      </div>
      {dialog && (
        <BuilderDialog
          title={
            dialog.type === "unpublish"
              ? "Unpublish website?"
              : dialog.type === "publish"
                ? "Publish website?"
                : dialog.type === "leave"
                  ? "Leave without saving?"
                  : "Discard unsaved changes?"
          }
          confirmLabel={
            dialog.type === "unpublish"
              ? "Unpublish"
              : dialog.type === "publish"
                ? "Save and publish"
                : dialog.type === "leave"
                  ? "Discard and leave"
                  : "Discard changes"
          }
          dangerous={dialog.type !== "publish"}
          onConfirm={confirm}
          onCancel={() => setDialog(null)}
        >
          {dialog.type === "unpublish"
            ? "The public preview will become unavailable. Your saved draft and unsaved edits stay available, and you can publish again whenever you are ready."
            : dialog.type === "publish"
              ? "This saves your current changes and updates the published version of your website."
              : "Unsaved changes will be discarded. Your latest saved draft and published content will remain intact."}
        </BuilderDialog>
      )}
    </div>
  );
}
