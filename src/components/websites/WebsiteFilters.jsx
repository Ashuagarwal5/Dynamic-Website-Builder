import { LayoutGrid, List, Search } from "lucide-react";
import Dropdown from "../ui/Dropdown";
import { X } from "lucide-react";
export default function WebsiteFilters({
  query,
  onQuery,
  filter,
  onFilter,
  sort,
  onSort,
  layout,
  onLayout,
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm shadow-slate-900/[0.02] lg:flex-row lg:items-center lg:gap-4 lg:p-4">
      <div className="group flex h-11 min-w-0 items-center gap-3 rounded-xl border border-slate-200/70 bg-slate-50 px-3.5 transition focus-within:border-slate-400 focus-within:bg-white lg:flex-1">
        <Search
          size={18}
          className="shrink-0 text-slate-400 transition group-focus-within:text-slate-600"
          aria-hidden="true"
        />
        <input
          aria-label="Search website name or slug"
          value={query}
          onChange={(event) => onQuery(event.target.value)}
          placeholder="Search websites..."
          type="text"
          autoComplete="off"
          className="h-full min-w-0 w-full border-0 bg-transparent! text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:ring-0 focus:bg-transparent!"
        />
        {query && (
          <button
            type="button"
            onClick={() => onQuery("")}
            aria-label="Clear website search"
            className="flex size-6 shrink-0 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-200/60 hover:text-slate-700 focus-visible:outline-none! focus-visible:bg-slate-200"
          >
            <X size={14} aria-hidden="true" />
          </button>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2.5 lg:shrink-0">
        <Dropdown
          aria-label="Filter by status"
          value={filter}
          onChange={onFilter}
          className="h-11 min-w-32 flex-1 lg:w-36 lg:flex-none"
          options={[
            { value: "all", label: "All statuses" },
            { value: "published", label: "Published" },
            { value: "draft", label: "Draft" },
          ]}
        />
        <Dropdown
          aria-label="Sort websites"
          value={sort}
          onChange={onSort}
          className="h-11 min-w-44 flex-1 lg:w-48 lg:flex-none"
          options={[
            { value: "recent", label: "Recently updated" },
            { value: "oldest", label: "Oldest updated" },
            { value: "alphabetical", label: "Alphabetically" },
          ]}
        />
        <div
          role="group"
          aria-label="Website view"
          className="flex h-11 shrink-0 items-center gap-1 rounded-xl border border-slate-200/70 bg-slate-50 p-1"
        >
          {[
            { key: "grid", icon: LayoutGrid },
            { key: "list", icon: List },
          ].map(({ key, icon: Icon }) => (
            <button
              type="button"
              key={key}
              aria-label={`${key} view`}
              aria-pressed={layout === key}
              onClick={() => onLayout(key)}
              title={`${key === "grid" ? "Grid" : "List"} view`}
              className={`flex size-9 shrink-0 items-center justify-center rounded-lg transition focus-visible:outline-none! focus-visible:bg-slate-200 ${layout === key ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:bg-white/70 hover:text-slate-600"}`}
            >
              <Icon size={17} aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
