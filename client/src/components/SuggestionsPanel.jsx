export function SuggestionsPanel({ suggestions, onOpenBooklet }) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-slate-950/30 p-6 shadow-card backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/55">Suggestions</p>
          <h2 className="font-display text-2xl text-white">Care prompt</h2>
        </div>
        <button
          type="button"
          onClick={onOpenBooklet}
          className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/10 text-xl text-white"
          aria-label="Open KAKA Care Booklet"
        >
          📖
        </button>
      </div>
      <div className="grid gap-3">
        {suggestions.map((suggestion) => (
          <article
            key={suggestion.id}
            className="flex items-start gap-3 rounded-[1.25rem] border border-white/10 bg-white/10 p-4"
          >
            <div className="text-2xl">{suggestion.icon}</div>
            <p className="text-sm leading-6 text-white/80">{suggestion.message}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
