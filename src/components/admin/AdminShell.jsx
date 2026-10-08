"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Bell,
  ChevronRight,
  Layers,
  Menu,
  Search,
  UserRound,
  X,
} from "lucide-react";
import { navigation, pageLabel } from "./navigation";
export default function AdminShell({ children }) {
  const pathname = usePathname(),
    router = useRouter();
  const [open, setOpen] = useState(false),
    [query, setQuery] = useState("");
  const dialog = useRef(null),
    toggle = useRef(null);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    const trigger = toggle.current;
    document.body.style.overflow = "hidden";
    dialog.current?.querySelector("button")?.focus();
    function keydown(event) {
      if (event.key === "Escape") setOpen(false);
      if (event.key === "Tab") {
        const controls = dialog.current.querySelectorAll(
          "a[href], button:not([disabled])",
        );
        const first = controls[0],
          last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        }
        if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }
    const media = window.matchMedia("(min-width: 1024px)");
    const resize = () => {
      if (media.matches) setOpen(false);
    };
    media.addEventListener("change", resize);
    document.addEventListener("keydown", keydown);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", keydown);
      media.removeEventListener("change", resize);
      trigger?.focus();
    };
  }, [open]);
  const sidebar = (mobile = false) => (
    <>
      <div className="flex h-24 items-center gap-3 px-5">
        <span className="rounded-xl bg-[#0987F5] p-2 text-white">
          <Layers size={24} aria-hidden="true" />
        </span>
        <div>
          <p className="text-lg font-bold">Site Studio</p>
          <p className="text-xs text-slate-500">Dynamic Website Builder</p>
        </div>
        {mobile && (
          <button
            className="admin-icon ml-auto"
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        )}
      </div>
      <p className="px-6 pb-3 pt-6 text-[11px] font-bold tracking-[0.18em] text-slate-400">
        WORKSPACE
      </p>
      <nav aria-label="Admin navigation" className="space-y-2 px-3">
        {navigation.map(({ label, href, icon: Icon }) => {
          const active =
            href === pathname ||
            (href === "/dashboard/websites" &&
              (pathname.startsWith("/dashboard/sites/") ||
                pathname.startsWith("/dashboard/websites/")));
          const content = (
            <>
              <Icon size={19} aria-hidden="true" />
              <span>{label}</span>
              {!href && (
                <span className="ml-auto text-[10px] font-normal">
                  Coming soon
                </span>
              )}
            </>
          );
          return href ? (
            <Link
              key={label}
              href={href}
              onClick={() => setOpen(false)}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold ${active ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"}`}
            >
              {content}
            </Link>
          ) : (
            <div
              key={label}
              aria-disabled="true"
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-400"
            >
              {content}
            </div>
          );
        })}
      </nav>
      <div className="mx-5 mt-auto mb-6 rounded-xl border border-blue-100 bg-[#F5FAFF] p-4">
        <p className="text-sm font-semibold">Your workspace, simplified.</p>
        <p className="mt-2 text-xs leading-5 text-slate-500">
          Manage your content and keep your websites up to date.
        </p>
        <p className="mt-3 text-[11px] text-slate-500">
          Mock data · Browser storage
        </p>
      </div>
    </>
  );
  return (
    <div className="admin-shell min-h-screen bg-[#F5FAFF] text-[#06325E]">
      <a
        href="#admin-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:bg-white focus:p-3"
      >
        Skip to content
      </a>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">
        {sidebar()}
      </aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-[#06325E]/40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <aside
            ref={dialog}
            role="dialog"
            aria-modal="true"
            aria-label="Workspace navigation"
            className="absolute inset-y-0 left-0 flex w-[min(20rem,90vw)] flex-col overflow-y-auto bg-white shadow-xl"
          >
            {sidebar(true)}
          </aside>
        </div>
      )}
      <div className="lg:pl-64" inert={open ? true : undefined}>
        <header className="flex min-h-20 flex-wrap items-center gap-4 border-b border-slate-200 bg-white px-4 py-4 sm:px-8">
          <button
            ref={toggle}
            className="admin-icon lg:hidden"
            aria-label="Open navigation"
            aria-expanded={open}
            onClick={() => setOpen(true)}
          >
            <Menu size={22} />
          </button>
          <nav
            aria-label="Breadcrumb"
            className="flex min-w-0 flex-wrap items-center gap-2 text-sm"
          >
            <Link href="/dashboard" className="text-slate-500">
              Workspace
            </Link>
            <ChevronRight size={14} aria-hidden="true" />
            {(pathname.startsWith("/dashboard/sites/") ||
              pathname.startsWith("/dashboard/websites/")) && (
              <>
                <Link href="/dashboard/websites" className="text-slate-500">
                  My Websites
                </Link>
                <ChevronRight size={14} aria-hidden="true" />
              </>
            )}
            <span className="truncate font-semibold" aria-current="page">
              {pageLabel(pathname)}
            </span>
          </nav>
          <form
            role="search"
            className="order-last flex w-full items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 sm:order-none sm:ml-auto sm:w-60"
            onSubmit={(event) => {
              event.preventDefault();
              router.push(
                `/dashboard/websites?q=${encodeURIComponent(query.trim())}`,
              );
            }}
          >
            <Search
              size={17}
              className="shrink-0 text-slate-400"
              aria-hidden="true"
            />
            <input
              aria-label="Search websites"
              placeholder="Search websites…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="min-w-0 flex-1 bg-transparent py-2 text-sm text-slate-700 ring-0 outline-none placeholder:text-slate-400 focus:ring-0"
            />
            <button className="text-xs font-semibold text-blue-600">Go</button>
          </form>
          <div className="ml-auto flex items-center gap-3 sm:ml-0">
            <span
              className="admin-icon text-slate-400"
              title="Notifications coming soon"
              aria-label="Notifications coming soon"
            >
              <Bell size={19} />
            </span>
            <span
              className="flex size-9 items-center justify-center rounded-full bg-blue-50"
              title="User profile placeholder"
              aria-label="User profile placeholder"
            >
              <UserRound size={18} />
            </span>
          </div>
        </header>
        <div
          id="admin-content"
          tabIndex={-1}
          className="mx-auto max-w-[1440px] p-4 sm:p-8 lg:p-10"
        >
          {children}
        </div>
      </div>
    </div>
  );
}
