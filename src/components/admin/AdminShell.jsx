"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Bell,
  ChevronRight,
  Layers,
  LogOut,
  Menu,
  Search,
  ArrowRight,
  X,
} from "lucide-react";
import { navigation, pageLabel } from "./navigation";
import ProfileDropdown from "../auth/ProfileDropdown";
import TenantSwitcher from "../tenants/TenantSwitcher";
import { logout } from "../../app/login/actions";
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
          "a[href], button:not([disabled]), select:not([disabled])",
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
            className="flex size-10 shrink-0 items-center justify-center rounded-lg ml-auto"
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        )}
      </div>
      <TenantSwitcher mobile={mobile} />
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
      <div className="mx-5 mt-auto mb-4 rounded-xl border border-blue-100 bg-[#F5FAFF] p-4">
        <p className="text-sm font-semibold">Your workspace, simplified.</p>
        <p className="mt-2 text-xs leading-5 text-slate-500">
          Manage your content and keep your websites up to date.
        </p>
        <p className="mt-3 text-[11px] text-slate-500">
          Manage your branches and websites
        </p>
      </div>
      <form action={logout} className="border-t border-slate-100 px-3 py-4">
        <button className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-red-50 hover:text-red-600">
          <LogOut size={19} aria-hidden="true" />
          Sign out
        </button>
      </form>
    </>
  );
  return (
    <div className="[&_:is(a,button):focus-visible]:outline-2 [&_:is(a,button):focus-visible]:outline-solid [&_:is(a,button):focus-visible]:outline-[#0987F5] [&_:is(a,button):focus-visible]:outline-offset-3 [&_button:disabled]:cursor-not-allowed [&_button:disabled]:opacity-50 min-h-screen bg-[#F5FAFF] text-[#06325E]">
      <a
        href="#admin-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:bg-white focus:p-3"
      >
        Skip to content
      </a>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col overflow-y-auto border-r border-slate-200 bg-white lg:flex">
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
        <header className="sticky top-0 z-20 flex min-h-20 flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-4 py-4 sm:gap-4 sm:px-6 lg:px-8">
          <button
            ref={toggle}
            className="flex size-10 shrink-0 items-center justify-center rounded-lg lg:hidden"
            aria-label="Open navigation"
            aria-expanded={open}
            onClick={() => setOpen(true)}
          >
            <Menu size={22} />
          </button>
          <nav
            aria-label="Breadcrumb"
            className="flex min-w-0 flex-1 flex-wrap items-center gap-2 text-xs sm:flex-none sm:text-sm"
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
            className="group order-last flex h-11 w-full items-center gap-2.5 rounded-xl border border-slate-200/80 bg-slate-50 pl-3.5 pr-1.5 transition focus-within:border-slate-400 focus-within:bg-white md:order-none md:ml-auto md:w-56 xl:w-72"
            onSubmit={(event) => {
              event.preventDefault();
              router.push(
                `/dashboard/websites?q=${encodeURIComponent(query.trim())}`,
              );
            }}
          >
            <Search
              size={17}
              className="shrink-0 text-slate-400 transition group-focus-within:text-slate-600"
              aria-hidden="true"
            />
            <input
              type="text"
              autoComplete="off"
              aria-label="Search websites"
              placeholder="Search websites…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="h-full min-w-0 flex-1 border-0 bg-transparent! text-sm text-slate-700 ring-0 outline-none placeholder:text-slate-400 focus:bg-transparent! focus:ring-0"
            />
            {query && (
              <button
                type="button"
                aria-label="Clear header search"
                onClick={() => setQuery("")}
                className="flex size-6 shrink-0 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-200/60 hover:text-slate-700 focus-visible:outline-none! focus-visible:bg-slate-200"
              >
                <X size={14} aria-hidden="true" />
              </button>
            )}
            <button
              type="submit"
              aria-label="Search websites"
              title="Search websites"
              className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white text-slate-500 shadow-sm transition hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none! focus-visible:bg-slate-200"
            >
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          </form>
          <div className="ml-auto flex shrink-0 items-center gap-1 md:ml-0 sm:gap-3">
            <span
              className="flex size-10 shrink-0 items-center justify-center rounded-lg text-slate-400"
              title="Notifications coming soon"
              aria-label="Notifications coming soon"
            >
              <Bell size={19} />
            </span>
            <ProfileDropdown />
          </div>
        </header>
        <div
          id="admin-content"
          tabIndex={-1}
          className="w-full min-w-0 p-4 sm:p-6 lg:p-8"
        >
          {children}
        </div>
      </div>
    </div>
  );
}
