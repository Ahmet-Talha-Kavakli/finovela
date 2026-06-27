"use client";

/* ============================================================
   CopyTrackRecord — yatırımcı şeffaf geçmiş performansı.
   AI Studio SİYAH tema (.ais / ais-kit). Aylık getiri bar grafiği
   (pozitif yeşil / negatif kırmızı) + tam varlık dökümü.
   Veri tamamen deterministik (handle hash) — CopyTraderProfile ile uyumlu.
   ============================================================ */

import { useState } from "react";
import { SectionCard, Metric, AIS_UP, AIS_DOWN } from "@/components/dashboard/ais-kit";
import { TickerBadge } from "@/components/dashboard/ticker-badge";
import { fmtNum, type Trader } from "@/lib/dashboard/data";
import { UNIVERSE } from "@/lib/market/universe";

/** Deterministik hash — handle → sayı */
function hash(seed: string): number {
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) % 1_000_000;
  return h;
}

/** Tam holding listesi (CopyTraderProfile.pickHoldings ile uyumlu, daha derin). */
function fullHoldings(handle: string) {
  const seed = hash(handle);
  const count = 5 + (seed % 2);
  const start = seed % UNIVERSE.length;
  const picks = [];
  for (let i = 0; i < count; i++) picks.push(UNIVERSE[(start + i * 3) % UNIVERSE.length]);
  const raw = picks.map((_, i) => count - i + (hash(handle + i) % 3));
  const sum = raw.reduce((a, b) => a + b, 0);
  return picks.map((u, i) => ({
    symbol: u.symbol,
    name: u.name,
    sector: u.sector,
    pct: +((raw[i] / sum) * 100).toFixed(1),
  }));
}

const MONTHS = ["Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara", "Oca", "Şub", "Mar", "Nis", "May", "Haz"];

/** 12 aylık deterministik aylık getiriler — yıllık toplam ≈ return1y. */
function monthlyReturns(handle: string, return1y: number) {
  const avg = return1y / 12;
  return MONTHS.map((m, i) => {
    const wobble = (((hash(handle + ":m" + i) % 100) / 100) - 0.42) * Math.abs(avg) * 2.4;
    return { month: m, ret: +(avg + wobble).toFixed(1) };
  });
}

/** Yönetilen sermaye (AUC) — copier × riskten türeyen bant (profil ile uyumlu). */
function auc(copiers: number, risk: number): { label: string; raw: number } {
  const raw = copiers * (180 + risk * 40);
  const label = raw >= 1_000_000 ? `$${(raw / 1_000_000).toFixed(1)}M` : `$${Math.round(raw / 1000)}K`;
  return { label, raw };
}

export function CopyTrackRecord({ trader }: { trader: Trader }) {
  const holdings = fullHoldings(trader.handle);
  const months = monthlyReturns(trader.handle, trader.return1y);
  const auc12 = auc(trader.copiers, trader.risk);
  const positiveMonths = months.filter((m) => m.ret >= 0).length;
  const bestMonth = months.reduce((a, b) => (b.ret > a.ret ? b : a));
  const worstMonth = months.reduce((a, b) => (b.ret < a.ret ? b : a));
  const maxPct = Math.max(...holdings.map((h) => h.pct), 1);

  return (
    <div className="space-y-3">
      {/* ───────── Şeffaf geçmiş performans ───────── */}
      <SectionCard
        label="Şeffaf geçmiş performans"
        desc="Her ay doğrulanır — kazançlar da, kayıplar da açıkça gösterilir."
        action={
          <span className="rounded-full border border-[var(--ais-line-strong)] px-2.5 py-0.5 text-[11px] text-[var(--ais-fg-muted)]">
            Doğrulanmış · demo
          </span>
        }
      >
        {/* özet metrikler — count-up */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric label="Kopyalayan" animate={trader.copiers} format={(n) => fmtNum(Math.round(n))} />
          <Metric label="Kopya altındaki varlık" value={auc12.label} />
          <Metric
            label="Kazanma oranı"
            animate={trader.win}
            format={(n) => `${Math.round(n)}%`}
            color={AIS_UP}
          />
          <Metric label="Kârlı aylar" value={`${positiveMonths}/12`} />
        </div>

        {/* aylık getiri bar grafiği */}
        <div className="mt-6 border-t border-[var(--ais-line)] pt-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[12px] uppercase tracking-wide text-[var(--ais-fg-muted)]">
              Aylık getiriler · son 12 ay
            </span>
            <span className="num flex items-center gap-3 text-[12px]">
              <span className="flex items-center gap-1.5 text-[var(--ais-fg-muted)]">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: AIS_UP }} />
                En iyi <span style={{ color: AIS_UP }}>+{bestMonth.ret}%</span>
              </span>
              <span className="flex items-center gap-1.5 text-[var(--ais-fg-muted)]">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: AIS_DOWN }} />
                En kötü <span style={{ color: AIS_DOWN }}>{worstMonth.ret}%</span>
              </span>
            </span>
          </div>
          <MonthlyBars months={months} />
        </div>
      </SectionCard>

      {/* ───────── Tam varlık açıklaması ───────── */}
      <SectionCard
        label="Tam varlık açıklaması"
        desc="Varlıklar, ağırlıklar ve aylık getiriler eksiksiz — her yansıtılan işlemde güncellenir."
        className="mt-3"
      >
        <div className="space-y-2.5">
          {holdings.map((h, i) => (
            <div
              key={h.symbol}
              className="ais-row flex items-center gap-3 px-2.5 py-2.5"
              style={{ animation: `ais-rise .5s cubic-bezier(.16,1,.3,1) both`, animationDelay: `${i * 0.04}s` }}
            >
              <TickerBadge symbol={h.symbol} size={34} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2 text-[13px]">
                  <span className="flex min-w-0 items-baseline gap-2">
                    <span className="shrink-0 font-medium text-[var(--ais-fg)]">{h.symbol}</span>
                    <span className="truncate text-[12px] text-[var(--ais-fg-muted)]">
                      {h.name} · {h.sector}
                    </span>
                  </span>
                  <span className="num shrink-0 font-medium text-[var(--ais-fg)]">{h.pct}%</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/[0.05]">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(h.pct / maxPct) * 100}%`,
                      background: `linear-gradient(90deg, var(--ais-accent), rgba(138,180,248,0.45))`,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

/** Aylık getiri bar grafiği — eksen (0 çizgisi) etrafında pozitif yukarı / negatif aşağı. */
function MonthlyBars({ months }: { months: { month: string; ret: number }[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const maxAbs = Math.max(1, ...months.map((m) => Math.abs(m.ret)));
  // Üst/alt yarı yükseklik (px). 0 çizgisi ortada.
  const half = 56;

  return (
    <div className="relative">
      <div className="flex items-stretch gap-1.5">
        {months.map((m, i) => {
          const up = m.ret >= 0;
          const mag = (Math.abs(m.ret) / maxAbs) * half;
          const active = hover === i;
          const color = up ? AIS_UP : AIS_DOWN;
          return (
            <div
              key={m.month}
              className="group flex flex-1 cursor-default flex-col items-center"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            >
              {/* üst yarı (pozitif) */}
              <div className="flex w-full items-end justify-center" style={{ height: half }}>
                {up && (
                  <div
                    className="w-full rounded-t-[5px] transition-all duration-200"
                    style={{
                      height: Math.max(3, mag),
                      background: `linear-gradient(180deg, ${color}, ${color}80)`,
                      opacity: active ? 1 : 0.92,
                      boxShadow: active ? `0 0 12px ${color}66` : "none",
                    }}
                  />
                )}
              </div>
              {/* 0 çizgisi + değer */}
              <div className="relative w-full">
                <div className="h-px w-full bg-[var(--ais-line-strong)]" />
                {active && (
                  <span
                    className="num absolute left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border border-[var(--ais-line-strong)] bg-[var(--ais-surface-2)] px-1.5 py-0.5 text-[10.5px] font-medium"
                    style={{ top: up ? -half - 18 : half + 4, color }}
                  >
                    {up ? "+" : ""}
                    {m.ret}%
                  </span>
                )}
              </div>
              {/* alt yarı (negatif) */}
              <div className="flex w-full items-start justify-center" style={{ height: half }}>
                {!up && (
                  <div
                    className="w-full rounded-b-[5px] transition-all duration-200"
                    style={{
                      height: Math.max(3, mag),
                      background: `linear-gradient(0deg, ${color}, ${color}80)`,
                      opacity: active ? 1 : 0.92,
                      boxShadow: active ? `0 0 12px ${color}66` : "none",
                    }}
                  />
                )}
              </div>
              <span
                className={`mt-1.5 text-[10px] transition-colors ${
                  active ? "text-[var(--ais-fg)]" : "text-[var(--ais-fg-faint)]"
                }`}
              >
                {m.month}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
