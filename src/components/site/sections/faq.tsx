"use client";

import { useState } from "react";
import { Plus } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const FAQS = [
  {
    q: "Does Vela trade with real money?",
    a: "Vela is a paper-trading, educational environment. It builds and runs strategies using simulated capital and live market data, so you can see exactly how an automated portfolio would behave — with zero real-money risk.",
  },
  {
    q: "How is this different from a normal robo-advisor?",
    a: "Traditional robo-advisors use a static questionnaire and a fixed model portfolio. Vela is conversational and agentic: you talk to it, it designs a custom strategy, explains the reasoning, and then automates the entire thing — including rebalancing and tax-loss harvesting.",
  },
  {
    q: "Do I need to know anything about investing?",
    a: "No. That's the point. You describe your goal in plain English and Vela handles the strategy, the math, and the execution. It always explains the “why” so you learn as you go.",
  },
  {
    q: "What can the AI actually do?",
    a: "Vela pulls live quotes, charts and news, compares securities, analyzes portfolio risk and overlap, designs and backtests strategies, and sets up automated rules — all from a single chat, with full memory of your conversation.",
  },
  {
    q: "Can I copy other investors?",
    a: "Yes. Vela includes copy trading — browse top strategies and investors, see their risk score and track record, and mirror them automatically into your simulated portfolio.",
  },
  {
    q: "Is there a free plan?",
    a: "Yes. You can start free with full access to the AI co-pilot, strategy builder, backtesting and paper trading. Premium unlocks advanced automation, deeper analytics and priority data.",
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="bg-lilac-fade py-24">
      <div className="mx-auto max-w-3xl px-5">
        <div className="text-center">
          <p className="text-sm font-semibold text-brand">FAQ</p>
          <h2 className="font-display mt-3 text-4xl font-bold text-fg sm:text-5xl">
            Questions, <span className="text-gradient">answered</span>
          </h2>
        </div>
        <div className="mt-12 divide-y divide-white/10 rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-sm">
          {FAQS.map((f, i) => (
            <div key={f.q} className="px-6">
              <button
                className="flex w-full items-center justify-between gap-4 py-6 text-left"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span className="font-display text-lg font-semibold text-white">{f.q}</span>
                <Plus
                  size={20}
                  weight="bold"
                  className={cn(
                    "shrink-0 text-white/50 transition-transform duration-300",
                    open === i && "rotate-45 text-brand",
                  )}
                />
              </button>
              <div
                className={cn(
                  "grid overflow-hidden transition-all duration-300",
                  open === i ? "grid-rows-[1fr] pb-6" : "grid-rows-[0fr]",
                )}
              >
                <p className="min-h-0 text-white/60">{f.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
