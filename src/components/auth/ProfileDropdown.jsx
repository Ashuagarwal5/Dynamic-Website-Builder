"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut, Settings, UserRound } from "lucide-react";
import { useSession } from "./SessionProvider";
import { logout } from "../../app/login/actions";

export default function ProfileDropdown() {
  const session = useSession();
  const [open, setOpen] = useState(false);
  const container = useRef(null);
  const trigger = useRef(null);

  useEffect(() => {
    if (!open) return;
    function outside(event) {
      if (!container.current?.contains(event.target)) setOpen(false);
    }
    function keydown(event) {
      if (event.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    }
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", keydown);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", keydown);
    };
  }, [open]);

  return (
    <div
      ref={container}
      className="relative shrink-0"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <button
        ref={trigger}
        type="button"
        aria-label="Account options"
        aria-expanded={open}
        aria-controls="profile-dropdown"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-slate-50"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-50">
          <UserRound size={18} aria-hidden="true" />
        </span>
        <span className="hidden max-w-36 text-left text-xs md:block">
          <span className="block truncate font-semibold">
            {session?.user.name || session?.user.email}
          </span>
          <span className="block truncate text-slate-500">
            {session?.activeBranch?.name}
          </span>
        </span>
        <ChevronDown
          size={14}
          aria-hidden="true"
          className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div
          id="profile-dropdown"
          className="absolute right-0 top-full z-40 mt-2 w-64 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
        >
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="truncate text-sm font-semibold">
              {session?.user.name || "Your account"}
            </p>
            <p className="mt-1 break-all text-xs text-slate-500">
              {session?.user.email}
            </p>
          </div>
          <nav aria-label="Account" className="p-1.5">
            <Link
              href="/dashboard/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-slate-50"
            >
              <UserRound size={17} aria-hidden="true" />
              View profile
            </Link>
            <Link
              href="/dashboard/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-slate-50"
            >
              <Settings size={17} aria-hidden="true" />
              Settings
            </Link>
          </nav>
          <form action={logout} className="border-t border-slate-100 p-1.5">
            <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-600 hover:bg-red-50">
              <LogOut size={17} aria-hidden="true" />
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
