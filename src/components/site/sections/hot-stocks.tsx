"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ArrowRight, TrendUp, TrendDown } from "@phosphor-icons/react";
import { cn, fmtUSD, fmtPct } from "@/lib/utils";
import type { Quote } from "@/lib/market";

const TABS = ["Hot", "Most traded", "Top gainers", "Top losers"] as const;
const SYMBOLS = "NVDA,AAPL,MSFT,GOOGL,AMZN,META,TSLA,AMD,JPM,UNH,KO,GE";

export function HotStocks() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Hot");

  useEffect(() => {
    fetch(`/api/market/quote?symbols=${SYMBOLS}`)
      .then((r) => r.json())
      .then((d) => setQuotes(d.quotes ?? []))
      .catch(() => {});
  }, []);

  const sorted = [...quotes].sort((a, b) => {
    if (tab === "Top gainers") return b.changePct - a.changePct;
    if (tab === "Top losers") return a.changePct - b.changePct;
    if (tab === "Most traded") return b.volume - a.volume;
    return (b.marketCap ?? 0) - (a.marketCap ?? 0);
  });

  const left = sorted.slice(0, 6);
  const right = sorted.slice(6, 12);

  return (
    <section className="relative overflow-hidden bg-deep-violet py-24">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(139,92,255,0.25),transparent_70%)]" />
      <div className="relative mx-auto max-w-7xl px-5">
        <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto]">
          <div>
            <h2 className="font-display text-5xl font-bold text-white sm:text-6xl">
              Hot <span className="text-gradient">Stocks</span>
            </h2>
            <p className="mt-4 max-w-md text-lg text-white/60">
              Live market movers, ranked and explained. Tap any name and Vela
              breaks down the “why” in seconds.
            </p>
          </div>
          {/* unicorn / bar-chart görseli */}
          <div className="relative hidden lg:block">
            <div className="absolute inset-0 -z-10 scale-110 bg-[radial-gradient(circle,rgba(139,92,255,0.4),transparent_65%)] blur-2xl" />
            <Image
              src="/gen/portfolio-bars.png"
              alt=""
              width={420}
              height={236}
              className="w-[360px] drop-shadow-[0_20px_40px_rgba(124,58,237,0.4)]"
            />
          </div>
        </div>

        {/* sekmeler */}
        <div className="mt-8 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition",
                tab === t
                  ? "bg-white text-[#1a0b2e]"
                  : "bg-white/8 text-white/70 hover:bg-white/15 hover:text-white",
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {/* iki kolonlu liste */}
        <div className="mt-6 grid gap-3 lg:grid-cols-2">
          {[left, right].map((col, ci) => (
            <div key={ci} className="space-y-2">
              {col.map((q) => (
                <StockRow key={q.symbol} q={q} />
              ))}
              {col.length === 0 &&
                Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-[68px] animate-pulse rounded-2xl bg-white/5"
                  />
                ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function StockRow({ q }: { q: Quote }) {
  const up = q.changePct >= 0;
  return (
    <div className="group flex items-center gap-4 rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3 transition hover:border-brand/40 hover:bg-white/[0.07]">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#a855f7]/30 to-[#7c3aed]/30 text-sm font-bold text-white">
        {q.symbol.slice(0, 2)}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-white">{q.name}</div>
        <div className="text-xs text-white/40">{q.symbol}</div>
      </div>
      <div className="text-right">
        <div className="text-sm font-semibold text-white">{fmtUSD(q.price)}</div>
        <div
          className={cn(
            "flex items-center justify-end gap-1 text-xs font-medium",
            up ? "text-[#4ade80]" : "text-[#f87171]",
          )}
        >
          {up ? <TrendUp size={12} weight="bold" /> : <TrendDown size={12} weight="bold" />}
          {fmtPct(q.changePct)}
        </div>
      </div>
      <button className="hidden items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white opacity-0 transition group-hover:opacity-100 sm:flex">
        Analysis
        <ArrowRight size={12} weight="bold" />
      </button>
    </div>
  );
}
