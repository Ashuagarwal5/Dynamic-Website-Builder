"use client";
import { createContext, useContext } from "react";

// Provides `async (file) => url` when images can be uploaded to the backend.
// Without a provider, image pickers keep using local data URLs.
const MediaUploadContext = createContext(null);
export const MediaUploadProvider = MediaUploadContext.Provider;
export const useMediaUpload = () => useContext(MediaUploadContext);

export async function uploadImage(tenantId, file) {
  const form = new FormData();
  form.append("file", file);
  const response = await fetch(`/api/tenants/${encodeURIComponent(tenantId)}/media`, { method: "POST", body: form, headers: { Accept: "application/json" } });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Unable to upload the image.");
  return data.url;
}
