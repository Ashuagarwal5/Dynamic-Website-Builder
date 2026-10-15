import { Suspense } from "react";
import PreviewDocument from "../../../components/builder/PreviewDocument";
export const metadata = {
  title: "Builder preview",
  robots: { index: false, follow: false, nocache: true },
};
export default function BuilderPreviewPage() {
  return (
    <Suspense
      fallback={
        <p className="p-8 text-sm text-slate-500">Connecting preview...</p>
      }
    >
      <PreviewDocument />
    </Suspense>
  );
}
