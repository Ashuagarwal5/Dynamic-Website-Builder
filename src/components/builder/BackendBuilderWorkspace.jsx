"use client";
import Link from "next/link";
import { useCallback } from "react";
import { useSession } from "../auth/SessionProvider";
import useBackendWebsiteEditor from "../../hooks/useBackendWebsiteEditor";
import { MediaUploadProvider, uploadImage } from "./fields/MediaUploadContext";
import { Workspace } from "./BuilderWorkspace";

// The full-screen builder for backend websites. Same UI as the local builder;
// content is read from and saved to the backend, and images are uploaded to
// the branch's media storage.
export default function BackendBuilderWorkspace({ siteId, tenantId, partialSetup = false }) {
  const allowed = useSession().activeBranch?.id === tenantId;
  const editor = useBackendWebsiteEditor({
    tenantId,
    siteId,
    enabled: allowed,
    initialStatus: partialSetup ? "Some template content could not be added automatically. Add sections yourself or reload, then save." : "",
  });
  const upload = useCallback((file) => uploadImage(tenantId, file), [tenantId]);
  if (!allowed)
    return (
      <main className="min-h-screen bg-[#F5FAFF] p-8 text-[#06325E]">
        <p role="status" className="rounded-xl border border-slate-200 bg-white p-6">This website belongs to a different branch. Switch to that branch, or return to My Websites.</p>
        <Link href="/dashboard/websites" className="mt-4 inline-block font-semibold text-blue-600">Back to My Websites</Link>
      </main>
    );
  return (
    <MediaUploadProvider value={upload}>
      <Workspace editor={editor} />
    </MediaUploadProvider>
  );
}
