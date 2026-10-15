"use client";
import { useSyncExternalStore } from "react";
import WebsiteTemplate from "../WebsiteTemplate";
import { createDefaultContent } from "../../lib/site-service";
const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;
export default function TemplatePreview() {
  const ready = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
  if (!ready)
    return (
      <p role="status" className="p-6 text-sm text-slate-500">
        Loading template preview...
      </p>
    );
  return (
    <WebsiteTemplate
      content={createDefaultContent("Your Business")}
      editorSection="template-preview"
    />
  );
}
