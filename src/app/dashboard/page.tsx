"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Topbar } from "@/components/dashboard/topbar";
import { TickerBadge } from "@/components/dashboard/ui";
import { Sparkline } from "@/components/dashboard/area-chart";
import { LiveAreaChart } from "@/components/dashboard/live-area-chart";
import { ChartFrame } from "@/components/dashboard/chart-frame";
import { LiveValue } from "@/components/dashboard/living";
import { AnimatedNumber } from "@/components/dashboard/animated-number";
import { Greeting } from "@/components/dashboard/greeting";
import { useLivePortfolio } from "@/lib/dashboard/use-portfolio";
import { WatchlistCard } from "@/components/dashboard/watchlist-card";
import { DailyBrief } from "@/components/dashboard/daily-brief";
import { EarlyWarning } from "@/components/dashboard/early-warning";
import { fmtUsd } from "@/lib/dashboard/data";
import { UNIVERSE } from "@/lib/market/universe";
import { useEquityCurve } from "@/lib/dashboard/use-equity-curve";
import {
  SectionCard,
  Segmented,
  AIS_ACCENT,
  AIS_UP,
  AIS_DOWN,
} from "@/components/dashboard/ais-kit";
import { TrendUp, ArrowUpRight, CaretRight } from "@phosphor-icons/react";

const TIMEFRAMES: { label: string; range: string }[] = [
  { label: "1A", range: "1A" },
  { label: "3A", range: "3A" },
  { label: "6A", range: "6A" },
  { label: "1Y", range: "1Y" },
];

export default function OverviewPage() {
  const { positions, summary, risk } = useLivePortfolio();
  const [tf, setTf] = useState(3);
  const { curve, benchmark } = useEquityCurve(TIMEFRAMES[tf].range);
  const sorted = [...positions].sort((a, b) => b.value - a.value);
  const up = summary.totalPl >= 0;

  const bySector = new Map<string, number>();
  for (const p of positions) bySector.set(p.sector, (bySector.get(p.sector) ?? 0) + p.value);
  const totalVal = [...bySector.values()].reduce((a, b) => a + b, 0) || 1;
  const allocation = [...bySector.entries()]
    .map(([sector, value]) => ({ sector, pct: +((value / totalVal) * 100).toFixed(1) }))
    .sort((a, b) => b.pct - a.pct);

  return (
    <>
      <Topbar title="Genel Bakış" />
      <div className="ais min-h-[calc(100vh-64px)]">
        <div className="max-w-7xl px-8 py-10">
          {/* ───────── Karşılama ───────── */}
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-[22px] font-normal tracking-tight text-[var(--ais-fg)]">
              <Greeting />
            </h1>
          </div>

          {/* ───────── Toplam değer + grafik ───────── */}
          <div className="mt-10 grid gap-3 lg:grid-cols-[1.85fr_1fr]">
            <SectionCard label="Portföy" bodyClassName="p-0">
              <div className="flex flex-wrap items-start justify-between gap-4 px-6 pt-6">
                <div>
                  <p className="text-[12px] text-[var(--ais-fg-faint)]">Toplam portföy değeri</p>
                  <p className="num mt-2 text-[40px] font-normal leading-none tracking-tight text-[var(--ais-fg)]">
                    <AnimatedNumber value={summary.total} format={(n) => fmtUsd(n)} />
                  </p>
                  <div className="mt-3 flex items-center gap-3 text-[13px]">
                    <span
                      className="num inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-medium"
                      style={{ background: `${up ? AIS_UP : AIS_DOWN}1f`, color: up ? AIS_UP : AIS_DOWN }}
                    >
                      <ArrowUpRight size={12} weight="regular" className={up ? "" : "rotate-90"} />
                      {Math.abs(summary.dayPlPct).toFixed(2)}%
                    </span>
                    <span className="num text-[var(--ais-fg-muted)]">
                      {summary.dayPl >= 0 ? "+" : ""}
                      {fmtUsd(summary.dayPl)} bugün
                    </span>
                  </div>
                </div>

                <Segmented
                  value={TIMEFRAMES[tf].label}
                  onChange={(label) => setTf(TIMEFRAMES.findIndex((r) => r.label === label))}
                  options={TIMEFRAMES.map((r) => ({ value: r.label, label: r.label }))}
                />
              </div>

              <div className="mt-4 w-full px-6 pb-1">
                <ChartFrame
                  title="Portföy performansı"
                  render={(big) => (
                    <div style={{ height: big ? 460 : 268 }}>
                      <LiveAreaChart key={`${tf}-${big ? "lg" : "sm"}`} data={curve} benchmark={benchmark} positive={up} height={big ? 432 : 240} />
                    </div>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 divide-x divide-[var(--ais-line)] border-t border-[var(--ais-line)]">
                <HeroStat label="Yatırılan" animate={summary.invested} format={(n) => fmtUsd(n)} />
                <HeroStat label="Nakit" animate={summary.cash} format={(n) => fmtUsd(n)} />
                <HeroStat
                  label="Toplam getiri"
                  animate={summary.totalPl}
                  format={(n) => `${up ? "+" : ""}${fmtUsd(n)}`}
                  sub={`${summary.totalPlPct}%`}
                  tone={up ? AIS_UP : AIS_DOWN}
                />
              </div>
            </SectionCard>

            <DailyBrief />
          </div>

          {/* ───────── Erken uyarı radarı ───────── */}
          <div className="mt-3">
            <EarlyWarning />
          </div>

          {/* ───────── Varlıklar + Dağılım ───────── */}
          <div className="mt-3 grid gap-3 lg:grid-cols-[1.7fr_1fr]">
            <SectionCard
              label="Varlıkların"
              action={
                <Link
                  href="/dashboard/portfolio"
                  className="flex items-center gap-1 text-[12.5px] text-[var(--ais-fg-faint)] transition hover:text-[var(--ais-fg)]"
                >
                  Tümünü gör <CaretRight size={12} />
                </Link>
              }
            >
              <div className="space-y-0.5">
                {sorted.slice(0, 6).map((p) => (
                  <Link
                    key={p.symbol}
                    href={`/dashboard/stock/${p.symbol}`}
                    className="ais-row flex items-center gap-4 rounded-xl px-2 py-2.5"
                  >
                    <TickerBadge symbol={p.symbol} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-[var(--ais-fg)]">{p.symbol}</p>
                      <p className="truncate text-[12px] text-[var(--ais-fg-muted)]">{p.name}</p>
                    </div>
                    <Sparkline seed={p.symbol} up={p.changePct >= 0} />
                    <div className="w-24 text-right">
                      <p className="num text-[13px] font-medium text-[var(--ais-fg)]">
                        <LiveValue value={p.price} format={(n) => fmtUsd(n)} jitter={0.0009} />
                      </p>
                      <p
                        className="num text-[12px]"
                        style={{ color: p.changePct >= 0 ? AIS_UP : AIS_DOWN }}
                      >
                        {p.changePct >= 0 ? "+" : ""}
                        {p.changePct}%
                      </p>
                    </div>
                    <div className="hidden w-28 text-right sm:block">
                      <p className="num text-[13px] font-medium text-[var(--ais-fg)]">{fmtUsd(p.value)}</p>
                      <p className="num text-[12px]" style={{ color: p.pl >= 0 ? AIS_UP : AIS_DOWN }}>
                        {p.pl >= 0 ? "+" : ""}
                        {fmtUsd(p.pl)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </SectionCard>

            <SectionCard label="Dağılım">
              <div className="space-y-3">
                {allocation.map((a, i) => (
                  <div key={a.sector}>
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="text-[var(--ais-fg-muted)]">{a.sector}</span>
                      <span className="num font-medium text-[var(--ais-fg)]">{a.pct}%</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${a.pct}%`,
                          background: AIS_ACCENT,
                          opacity: [1, 0.78, 0.6, 0.46, 0.34, 0.24][i % 6],
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>

          {/* ───────── İzleme + Hareketliler ───────── */}
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            <WatchlistCard />
            <SectionCard
              label="Günün hareketlileri"
              action={<TrendUp size={16} className="text-[var(--ais-fg-muted)]" />}
            >
              <Movers />
            </SectionCard>
          </div>
        </div>
      </div>
    </>
  );
}

function HeroStat({
  label,
  value,
  animate,
  format,
  sub,
  tone,
}: {
  label: string;
  value?: string;
  /** Sayısal değer verilirse count-up animasyonu uygulanır. */
  animate?: number;
  format?: (n: number) => string;
  sub?: string;
  tone?: string;
}) {
  return (
    <div className="px-6 py-4">
      <p className="text-[12px] text-[var(--ais-fg-faint)]">{label}</p>
      <p className="num mt-1.5 text-[15px] font-medium" style={{ color: tone ?? "var(--ais-fg)" }}>
        {typeof animate === "number" ? <AnimatedNumber value={animate} format={format} /> : value}
        {sub && <span className="ml-1.5 text-[13px] font-normal opacity-80">{sub}</span>}
      </p>
    </div>
  );
}

type MoverRow = { symbol: string; price: number; changePct: number };

function Movers() {
  // CANLI hareketliler — markets sayfasıyla AYNI kaynak (/api/market/quote).
  // Eski getMovers() sembolden hash'lenen sahte % veriyordu, canlı verilerle çelişiyordu.
  const [rows, setRows] = useState<MoverRow[]>([]);
  useEffect(() => {
    let off = false;
    const symbols = [...new Set(UNIVERSE.map((u) => u.symbol))].slice(0, 40).join(",");
    fetch(`/api/market/quote?symbols=${symbols}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: { quotes?: { symbol: string; price: number; changePct: number }[] }) => {
        if (off || !d.quotes) return;
        setRows(
          d.quotes
            .filter((q) => Number.isFinite(q.changePct))
            .map((q) => ({ symbol: q.symbol, price: q.price, changePct: q.changePct })),
        );
      })
      .catch(() => {});
    return () => {
      off = true;
    };
  }, []);

  const gainers = [...rows].sort((a, b) => b.changePct - a.changePct).slice(0, 5);
  const losers = [...rows].sort((a, b) => a.changePct - b.changePct).slice(0, 5);

  const Row = ({ m }: { m: MoverRow }) => (
    <Link
      href={`/dashboard/stock/${m.symbol}`}
      className="ais-row flex items-center justify-between rounded-lg px-2 py-2"
    >
      <span className="text-[13px] font-medium text-[var(--ais-fg)]">{m.symbol}</span>
      <div className="text-right">
        <span className="num mr-3 text-[12.5px] text-[var(--ais-fg-muted)]">{fmtUsd(m.price)}</span>
        <span className="num text-[12px]" style={{ color: m.changePct >= 0 ? AIS_UP : AIS_DOWN }}>
          {m.changePct >= 0 ? "+" : ""}
          {m.changePct.toFixed(2)}%
        </span>
      </div>
    </Link>
  );

  if (!rows.length) {
    return <p className="px-2 py-6 text-center text-[12.5px] text-[var(--ais-fg-faint)]">Yükleniyor…</p>;
  }
  return (
    <div className="grid grid-cols-2 gap-x-4">
      <div>
        <p className="mb-1.5 px-2 text-[11px] text-[var(--ais-fg-faint)]">Yükselenler</p>
        {gainers.map((m) => (
          <Row key={m.symbol} m={m} />
        ))}
      </div>
      <div>
        <p className="mb-1.5 px-2 text-[11px] text-[var(--ais-fg-faint)]">Düşenler</p>
        {losers.map((m) => (
          <Row key={m.symbol} m={m} />
        ))}
      </div>
    </div>
  );
}
