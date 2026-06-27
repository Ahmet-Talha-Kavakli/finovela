import { ChatCircleDots, Strategy, Robot } from "@phosphor-icons/react/dist/ssr";

const STEPS = [
  {
    icon: ChatCircleDots,
    step: "01",
    title: "Tell Finovela your goal",
    text: "Just talk. “Grow $5k aggressively in tech” or “a safe income portfolio.” Finovela understands plain English and asks the right questions.",
  },
  {
    icon: Strategy,
    step: "02",
    title: "Finovela builds the strategy",
    text: "It designs a diversified, backtested strategy — picks the assets, sets the rules, and shows you exactly why, with the numbers to back it.",
  },
  {
    icon: Robot,
    step: "03",
    title: "It runs on autopilot",
    text: "Approve it once. Finovela executes every trade, rebalances automatically, harvests tax losses, and reports back. You stay in control.",
  },
];

export function HowItWorks() {
  return (
    <section className="relative overflow-hidden bg-lilac-fade py-24">
      <div className="relative mx-auto max-w-7xl px-5">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold text-[#7fb0ff]">How it works</p>
          <h2 className="font-display mt-3 text-4xl font-bold text-white sm:text-5xl">
            From a sentence to a strategy{" "}
            <span className="text-gradient">that runs itself</span>
          </h2>
          <p className="mt-4 text-lg text-white/60">
            No spreadsheets. No jargon. No staring at charts. Three steps to a
            portfolio that manages itself.
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {STEPS.map((s) => (
            <div
              key={s.step}
              className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.05] p-8 backdrop-blur-sm transition hover:border-brand/50 hover:bg-white/[0.08]"
            >
              <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-brand/20 blur-2xl transition group-hover:bg-brand/40" />
              <div className="relative flex items-center justify-between">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-[#5b8cff] to-[#2b5cf0] text-white shadow-[0_8px_24px_rgba(59,109,255,0.5)]">
                  <s.icon size={24} weight="duotone" />
                </span>
                <span className="font-display text-5xl font-bold text-white/10">
                  {s.step}
                </span>
              </div>
              <h3 className="font-display relative mt-6 text-xl font-bold text-white">
                {s.title}
              </h3>
              <p className="relative mt-3 text-white/60">{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
