"use client";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { editorHistory } from "../lib/editor-state";
import { parseSiteList } from "../lib/site-list";
import { parsePageList } from "../lib/page-list";
import { parseSectionList } from "../lib/section-list";
import { parseSiteTheme, validateThemeInput } from "../lib/site-theme";
import { defaultTheme, fromBackendSection, isSettingsSection, settingsToConfig, themeFromContent, toBackendConfig, toEditorContent, validateEditorContent } from "../lib/section-config";

const base = (tenantId, siteId) => `/api/tenants/${encodeURIComponent(tenantId)}/sites/${encodeURIComponent(siteId)}`;

async function request(url, method = "GET", body) {
  const response = await fetch(url, {
    method,
    headers: { Accept: "application/json", ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    ...(method === "GET" ? { cache: "no-store" } : {}),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "The request failed.");
  return data;
}

// Same interface as useWebsiteEditor, but the draft is loaded from and saved to
// the backend (sections, theme, publishing) instead of browser storage.
export default function useBackendWebsiteEditor({ tenantId, siteId, enabled = true, initialStatus = "" }) {
  const [site, setSite] = useState(undefined);
  const [meta, setMeta] = useState({ page: null, themeSaved: false, settingsId: null });
  const [error, setError] = useState(null);
  const [reload, setReload] = useState(0);
  const [state, dispatch] = useReducer(editorHistory, { draft: null, saved: null, past: [], future: [] });
  const [section, setSection] = useState(""),
    [viewport, setViewport] = useState("desktop"),
    [busy, setBusy] = useState(false),
    [status, setStatus] = useState(initialStatus);
  const lock = useRef(false);
  const [mediaPending, setMediaPending] = useState(0);
  const beginMedia = useCallback(() => {
    let active = true;
    setMediaPending((count) => count + 1);
    return () => {
      if (active) {
        active = false;
        setMediaPending((count) => Math.max(0, count - 1));
      }
    };
  }, []);

  useEffect(() => {
    if (!enabled || !tenantId || !siteId) return;
    let active = true;
    async function load() {
      try {
        const root = base(tenantId, siteId);
        const [sites, pages, themeData] = await Promise.all([
          request(`/api/tenants/${encodeURIComponent(tenantId)}/sites`),
          request(`${root}/pages`),
          request(`${root}/theme`),
        ]);
        const record = parseSiteList(sites, tenantId).find((item) => item.id === siteId);
        if (!record) {
          if (active) setSite(null);
          return;
        }
        const pageList = parsePageList(pages, siteId);
        const page = pageList.find((item) => item.slug === "home") || pageList[0] || null;
        const rawSections = page ? parseSectionList(await request(`${root}/pages/${encodeURIComponent(page.id)}/sections`), page.id) : [];
        // Header, footer and SEO live in one hidden settings section.
        const settingsSection = rawSections.find(isSettingsSection) || null;
        const backendSections = rawSections.filter((item) => !isSettingsSection(item)).map(fromBackendSection);
        const savedTheme = parseSiteTheme(themeData, siteId);
        if (!active) return;
        const content = toEditorContent({ name: record.name, theme: savedTheme || defaultTheme, sections: backendSections, settings: settingsSection?.config || null });
        setSite({ ...record, published: record.status === "PUBLISHED" });
        setMeta({ page, themeSaved: Boolean(savedTheme), settingsId: settingsSection?.id || null });
        dispatch({ type: "LOAD", content });
        setSection((current) => (content.sections.some((item) => item.id === current) || current === "theme" ? current : content.sections[0]?.id || "theme"));
      } catch (problem) {
        if (active) setError(problem);
      }
    }
    load();
    return () => { active = false; };
  }, [tenantId, siteId, reload, enabled]);

  const dirty = !!state.draft && JSON.stringify(state.draft) !== JSON.stringify(state.saved);
  useEffect(() => {
    if (!dirty && !mediaPending) return;
    const warn = (event) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, mediaPending]);

  const change = useCallback((path, value, group = path) => {
    if (lock.current) return;
    dispatch({ type: "CHANGE", path, value, group, at: Date.now() });
    setStatus("");
  }, []);
  const validation = state.draft ? validateEditorContent(state.draft, validateThemeInput) : {};
  const refresh = () => setReload((value) => value + 1);

  // Saves deletions, ordered section writes and the theme in one request.
  async function saveContent() {
    const before = state.saved.sections;
    const previous = new Map(before.map((item, index) => [item.backendId, { item, index }]));
    // The settings section goes last so section positions stay 0..n-1.
    const settingsConfig = settingsToConfig(state.draft);
    const settingsChanged = !meta.settingsId || JSON.stringify(settingsToConfig(state.saved)) !== JSON.stringify(settingsConfig) || before.length !== state.draft.sections.length;
    const body = {
      sections: [
        ...state.draft.sections.map((item, index) => {
          const old = item.backendId ? previous.get(item.backendId) : null;
          const unchanged = old && old.index === index && JSON.stringify(old.item) === JSON.stringify(item);
          return { backendId: item.backendId, type: item.type, isActive: item.enabled, config: toBackendConfig(item), dirty: !unchanged };
        }),
        { backendId: meta.settingsId || undefined, type: "TEXT", isActive: true, config: settingsConfig, dirty: settingsChanged },
      ],
      deleted: before.filter((item) => !state.draft.sections.some((next) => next.backendId === item.backendId)).map((item) => item.backendId),
      theme: !meta.themeSaved || JSON.stringify(state.saved.theme) !== JSON.stringify(state.draft.theme) ? themeFromContent(state.draft.theme) : undefined,
    };
    await request(`${base(tenantId, siteId)}/pages/${encodeURIComponent(meta.page.id)}/content`, "POST", body);
  }

  async function persist(publish = false) {
    if (lock.current || mediaPending || !meta.page) return false;
    if (Object.keys(validation).length) {
      setStatus("Correct the validation errors before saving or publishing.");
      return false;
    }
    lock.current = true;
    setBusy(true);
    setStatus("");
    let result = false;
    try {
      if (dirty) await saveContent();
      if (publish && !site.published) {
        const root = base(tenantId, siteId);
        if (meta.page.status !== "PUBLISHED") await request(`${root}/pages/${encodeURIComponent(meta.page.id)}/publish`, "POST");
        await request(`${root}/publish`, "POST");
        setStatus("Website published successfully.");
      } else setStatus(publish ? "Changes saved. Your website is live." : "Draft saved. Publish when you are ready to update your website.");
      result = true;
    } catch (problem) {
      setStatus(problem.message);
    } finally {
      lock.current = false;
      setBusy(false);
      refresh();
    }
    return result;
  }

  async function unpublish() {
    if (lock.current || mediaPending) return false;
    lock.current = true;
    setBusy(true);
    setStatus("");
    let result = false;
    try {
      await request(`${base(tenantId, siteId)}/unpublish`, "POST");
      setStatus("Website unpublished. Your content and unsaved edits are preserved.");
      result = true;
    } catch (problem) {
      setStatus(problem.message);
    } finally {
      lock.current = false;
      setBusy(false);
      refresh();
    }
    return result;
  }

  const enriched = site
    ? {
        ...site,
      }
    : site;
  return {
    ...state,
    site: enriched,
    backend: true,
    displayPath: site ? `/sites/${site.subdomain || site.slug}` : "",
    settingsUrl: `/dashboard/websites/${encodeURIComponent(siteId)}/settings?tenantId=${encodeURIComponent(tenantId)}`,
    // Only a published website has a public page to open.
    liveUrl: site?.published && site.subdomain ? `/sites/${encodeURIComponent(site.subdomain)}` : null,
    error,
    retry: () => {
      setError(null);
      refresh();
    },
    dirty,
    mediaPending,
    beginMedia,
    section,
    setSection,
    viewport,
    setViewport,
    busy,
    status,
    validation,
    change,
    save: () => persist(false),
    publish: () => persist(true),
    unpublish,
    undo: () => dispatch({ type: "UNDO" }),
    redo: () => dispatch({ type: "REDO" }),
    discard: () => {
      dispatch({ type: "DISCARD" });
      setStatus("Restored the latest saved content.");
    },
  };
}
