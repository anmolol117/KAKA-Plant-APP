export function VitalCard({ title, value, unit, status, onClick }) {
  const statusClass =
    status === "GOOD"
      ? "bg-emerald-100 text-emerald-800"
      : status === "LOW"
        ? "bg-amber-100 text-amber-800"
        : "bg-rose-100 text-rose-800";

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-[1.5rem] border border-white/10 bg-slate-950/30 p-5 text-left shadow-card backdrop-blur-xl transition hover:-translate-y-1"
    >
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/55">{title}</p>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass}`}>{status}</span>
      </div>
      <div className="text-4xl font-display text-white">
        {value}
        <span className="ml-1 text-lg font-body text-white/55">{unit}</span>
      </div>
      <p className="mt-3 text-sm text-white/60">Tap to view the last 24 hours with threshold guidance.</p>
    </button>
  );
}
