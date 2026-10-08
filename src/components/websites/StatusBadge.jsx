export default function StatusBadge({ published }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${published ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"}`}
    >
      {published ? "Published" : "Draft"}
    </span>
  );
}
