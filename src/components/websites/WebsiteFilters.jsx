import { LayoutGrid, List, Search } from "lucide-react";
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
    <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
      <label className="flex min-w-40 flex-1 items-center gap-2 px-2">
        <Search
          size={18}
          className="shrink-0 text-slate-400"
          aria-hidden="true"
        />
        <input
          aria-label="Search website name, business name or slug"
          value={query}
          onChange={(event) => onQuery(event.target.value)}
          placeholder="Search websites..."
          className="min-w-0 w-full py-2 text-sm"
        />
      </label>
      <select
        aria-label="Filter by status"
        value={filter}
        onChange={(event) => onFilter(event.target.value)}
        className="rounded-lg border border-slate-200 bg-white p-2 text-sm"
      >
        <option value="all">All statuses</option>
        <option value="published">Published</option>
        <option value="draft">Draft</option>
      </select>
      <select
        aria-label="Sort websites"
        value={sort}
        onChange={(event) => onSort(event.target.value)}
        className="rounded-lg border border-slate-200 bg-white p-2 text-sm"
      >
        <option value="recent">Recently updated</option>
        <option value="oldest">Oldest updated</option>
        <option value="alphabetical">Alphabetically</option>
      </select>
      <div className="flex gap-1 border-l border-slate-200 pl-3">
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
            className={`admin-icon ${layout === key ? "bg-blue-50 text-blue-600" : "text-slate-500"}`}
          >
            <Icon size={18} />
          </button>
        ))}
      </div>
    </div>
  );
}
