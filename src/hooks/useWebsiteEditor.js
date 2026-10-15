"use client";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import {
  getSite,
  saveDraft,
  publishSite,
  unpublishSite,
} from "../lib/site-service";
import { editorHistory } from "../lib/editor-state";
import { validateContent } from "../lib/site-validation";
import { useSession } from "../components/auth/SessionProvider";
export default function useWebsiteEditor(slug) {
  const scope = useSession()?.websiteScope;
  const [site, setSite] = useState(undefined),
    [error, setError] = useState(null),
    [reload, setReload] = useState(0);
  const [state, dispatch] = useReducer(editorHistory, {
    draft: null,
    saved: null,
    past: [],
    future: [],
  });
  const [section, setSection] = useState("hero"),
    [viewport, setViewport] = useState("desktop"),
    [busy, setBusy] = useState(false),
    [status, setStatus] = useState("");
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
    let active = true;
    getSite(slug, scope)
      .then((record) => {
        if (!active) return;
        setSite(record);
        if (record) {
          dispatch({ type: "LOAD", content: record.draft });
          setSection(record.draft.sections?.[0]?.id || "hero");
        }
      })
      .catch((problem) => {
        if (active) setError(problem);
      });
    return () => {
      active = false;
    };
  }, [slug, reload, scope]);
  const dirty =
    !!state.draft &&
    JSON.stringify(state.draft) !== JSON.stringify(state.saved);
  useEffect(() => {
    if (!dirty && !mediaPending) return;
    const warn = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, mediaPending]);
  const change = useCallback((path, value, group = path) => {
    if (lock.current) return;
    dispatch({ type: "CHANGE", path, value, group, at: Date.now() });
    setStatus("");
  }, []);
  const validation = state.draft ? validateContent(state.draft) : {};
  async function persist(publish = false) {
    if (lock.current || mediaPending) return false;
    if (Object.keys(validation).length) {
      setStatus("Correct the validation errors before saving or publishing.");
      return false;
    }
    lock.current = true;
    setBusy(true);
    setStatus("");
    try {
      const saved = await saveDraft(slug, state.draft, scope);
      dispatch({ type: "SAVED", content: saved.draft });
      setSite(saved);
      if (publish) {
        const published = await publishSite(slug, scope);
        setSite(published);
        setStatus("Website published successfully.");
      } else
        setStatus(
          "Draft saved. Publish when you are ready to update your website.",
        );
      return true;
    } catch (problem) {
      setStatus(problem.message);
      return false;
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function unpublish() {
    if (lock.current || mediaPending) return false;
    lock.current = true;
    setBusy(true);
    setStatus("");
    try {
      setSite(await unpublishSite(slug, scope));
      setStatus(
        "Website unpublished. Your draft and unsaved edits are preserved.",
      );
      return true;
    } catch (problem) {
      setStatus(problem.message);
      return false;
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return {
    ...state,
    site,
    error,
    retry: () => {
      setError(null);
      setReload((value) => value + 1);
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
      setStatus("Restored the latest saved draft.");
    },
  };
}
