const STATS = [
  { value: "500K+", label: "Investors modeled" },
  { value: "3,000+", label: "AI strategies" },
  { value: "24/7", label: "AI research" },
  { value: "$0", label: "We never hold your money" },
];

export function Stats() {
  return (
    <section className="bg-[#0a1838] px-5 py-12">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 rounded-3xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur-sm md:grid-cols-4">
        {STATS.map((s) => (
          <div key={s.label} className="text-center">
            <div className="font-display text-4xl font-bold text-gradient sm:text-5xl">
              {s.value}
            </div>
            <div className="mt-1.5 text-sm text-white/55">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
