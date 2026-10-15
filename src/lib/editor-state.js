import { normalizeContent } from "./site-validation";
export const cloneContent = (value) => JSON.parse(JSON.stringify(value));
export function setContentValue(content, path, value) {
  const keys = path.split(".");
  if (
    keys.some((key) => ["__proto__", "prototype", "constructor"].includes(key))
  )
    throw new Error("Invalid content field");
  const next = cloneContent(content);
  let target = next;
  keys.slice(0, -1).forEach((key) => {
    target[key] ??= {};
    target = target[key];
  });
  target[keys.at(-1)] = value;
  return next;
}
export function editorHistory(state, action) {
  if (action.type === "LOAD") {
    const draft = normalizeContent(action.content);
    return { draft, saved: cloneContent(draft), past: [], future: [] };
  }
  if (!state.draft) return state;
  if (action.type === "CHANGE") {
    const next = setContentValue(state.draft, action.path, action.value);
    if (JSON.stringify(next) === JSON.stringify(state.draft)) return state;
    // Group continuous typing in the same field; item removals always form a new step.
    const group =
      action.group &&
      action.group === state.group &&
      action.at - state.at < 800;
    return {
      ...state,
      draft: next,
      past: group ? state.past : [...state.past.slice(-19), state.draft],
      future: [],
      group: action.group,
      at: action.at,
    };
  }
  if (action.type === "UNDO" && state.past.length)
    return {
      ...state,
      draft: state.past.at(-1),
      past: state.past.slice(0, -1),
      future: [state.draft, ...state.future],
      group: null,
    };
  if (action.type === "REDO" && state.future.length)
    return {
      ...state,
      draft: state.future[0],
      past: [...state.past, state.draft],
      future: state.future.slice(1),
      group: null,
    };
  if (action.type === "SAVED")
    return { ...state, saved: normalizeContent(action.content), group: null };
  if (action.type === "DISCARD")
    return {
      ...state,
      draft: cloneContent(state.saved),
      past: [],
      future: [],
      group: null,
    };
  return state;
}
