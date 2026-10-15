"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";

export default function Dropdown({
  id,
  name,
  value,
  onChange,
  options,
  placeholder = "Select an option",
  disabled = false,
  className = "",
  ...props
}) {
  const generatedId = useId();
  const controlId = id || generatedId;
  const listId = `${controlId}-options`;
  const trigger = useRef(null);
  const menu = useRef(null);
  const search = useRef({ text: "", time: 0 });
  const [position, setPosition] = useState(null);
  const [active, setActive] = useState(0);
  const selected = options.findIndex((option) => option.value === value);
  const open = !!position && !disabled;

  function show(index = selected >= 0 ? selected : 0) {
    if (disabled || !options.length) return;
    const rect = trigger.current.getBoundingClientRect();
    const width = Math.min(Math.max(rect.width, 240), window.innerWidth - 24);
    const below = window.innerHeight - rect.bottom - 16;
    const above = rect.top - 16;
    const upwards = below < 220 && above > below;
    setPosition({
      left: Math.max(12, Math.min(rect.left, window.innerWidth - width - 12)),
      width,
      maxHeight: Math.min(320, upwards ? above : below),
      ...(upwards
        ? { bottom: window.innerHeight - rect.top + 6 }
        : { top: rect.bottom + 6 }),
    });
    setActive(index);
    search.current = { text: "", time: 0 };
  }

  function choose(index) {
    setPosition(null);
    if (options[index] && options[index].value !== value)
      onChange(options[index].value);
  }

  useEffect(() => {
    if (!open) return;
    function dismiss(event) {
      if (
        !trigger.current?.contains(event.target) &&
        !menu.current?.contains(event.target)
      )
        setPosition(null);
    }
    function close() {
      setPosition(null);
    }
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("scroll", dismiss, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      document.removeEventListener("scroll", dismiss, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  useEffect(() => {
    if (open)
      menu.current
        ?.querySelector(`[data-index="${active}"]`)
        ?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  function keyDown(event) {
    const { key } = event;
    if (["ArrowDown", "ArrowUp", "Home", "End", "Enter", " "].includes(key)) {
      event.preventDefault();
      if (!open)
        show(
          key === "End" ? options.length - 1 : key === "Home" ? 0 : undefined,
        );
      else if (key === "Enter" || key === " ") choose(active);
      else
        setActive(
          key === "Home"
            ? 0
            : key === "End"
              ? options.length - 1
              : (active + (key === "ArrowDown" ? 1 : -1) + options.length) %
                options.length,
        );
    } else if (key === "Escape") {
      if (open) {
        event.preventDefault();
        event.stopPropagation();
        setPosition(null);
      }
    } else if (key === "Tab") setPosition(null);
    else if (
      key.length === 1 &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey
    ) {
      event.preventDefault();
      const now = Date.now();
      const text =
        (now - search.current.time < 600 ? search.current.text : "") +
        key.toLowerCase();
      search.current = { text, time: now };
      const match = options.findIndex((option) =>
        option.label.toLowerCase().startsWith(text),
      );
      if (match >= 0) {
        if (!open) show(match);
        else setActive(match);
      }
    }
  }

  return (
    <>
      {name && (
        <input
          type="hidden"
          name={name}
          value={value ?? ""}
          disabled={disabled}
        />
      )}
      <button
        {...props}
        ref={trigger}
        id={controlId}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open ? `${listId}-${active}` : undefined}
        disabled={disabled}
        onClick={() => (open ? setPosition(null) : show())}
        onKeyDown={keyDown}
        onBlur={() => setPosition(null)}
        className={`flex min-w-0 items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left text-sm text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none! focus-visible:border-slate-500 disabled:cursor-wait disabled:opacity-60 ${open ? "border-slate-300 bg-slate-50" : ""} ${className}`}
      >
        <span className={`truncate ${selected < 0 ? "text-slate-400" : ""}`}>
          {options[selected]?.label || placeholder}
        </span>
        <ChevronDown
          size={16}
          aria-hidden="true"
          className={`shrink-0 text-slate-400 transition-transform ${open ? "rotate-180 text-blue-500" : ""}`}
        />
      </button>
      {open &&
        createPortal(
          <div
            ref={menu}
            id={listId}
            role="listbox"
            aria-label={props["aria-label"] || "Options"}
            aria-labelledby={props["aria-labelledby"]}
            style={position}
            className="fixed z-[100] overflow-y-auto overscroll-contain rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10"
            onMouseDown={(event) => event.preventDefault()}
          >
            {options.map((option, index) => (
              <div key={option.value}>
                {option.group && option.group !== options[index - 1]?.group && (
                  <div
                    role="presentation"
                    className="px-3 pb-1.5 pt-3 text-[10px] font-bold uppercase tracking-wider text-slate-400"
                  >
                    {option.group}
                  </div>
                )}
                <div
                  id={`${listId}-${index}`}
                  role="option"
                  aria-selected={option.value === value}
                  data-index={index}
                  onPointerMove={() => setActive(index)}
                  onClick={() => choose(index)}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${index === active ? "bg-blue-50 text-blue-700" : "text-slate-600"} ${option.value === value ? "font-semibold text-blue-700" : ""}`}
                >
                  <span className="min-w-0 flex-1 break-words">
                    {option.label}
                    {option.description && (
                      <span className="mt-0.5 block text-xs font-normal text-slate-400">
                        {option.description}
                      </span>
                    )}
                  </span>
                  {option.value === value && (
                    <Check
                      size={16}
                      aria-hidden="true"
                      className="shrink-0 text-blue-500"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
}
