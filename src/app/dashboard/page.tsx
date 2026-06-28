"use client";

/**
 * Finovela Genel Bakış (dashboard ana sayfası) — portföy özeti + grafik + dağılım.
 * Tasarım dili: Didit (business.didit.me) — açık tema, kutusuz border-t bölümler,
 * ızgara-ayraçlı metrik şeridi, token renkleri (beyaz-sabit YOK), Lucide ikon.
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { Topbar } from "@/components/dashboard/topbar";
import { TickerBadge } from "@/components/dashboard/ui";
import { Sparkline } from "@/components/dashboard/area-chart";
import { useSparklines } from "@/lib/dashboard/use-sparklines";
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
import { TrendingUp, ArrowUpRight, ChevronRight } from "lucide-react";

const ACCENT = "var(--ais-accent)";
const UP = "var(--ais-green)";
const DOWN = "#d93025";

const TIMEFRAMES: { label: string; range: string }[] = [
  { label: "1A", range: "1A" },
  { label: "3A", range: "3A" },
  { label: "6A", range: "6A" },
  { label: "1Y", range: "1Y" },
];

export default function OverviewPage() {
  const { positions, summary } = useLivePortfolio();
  const [tf, setTf] = useState(3);
  const { curve, benchmark } = useEquityCurve(TIMEFRAMES[tf].range);
  const sorted = [...positions].sort((a, b) => b.value - a.value);
  // Gösterilen pozisyonlar için gerçek sparkline serisi.
  const series = useSparklines(positions.map((p) => p.symbol));
  const up = summary.totalPl >= 0;
  const dayUp = summary.dayPl >= 0;

  const bySector = new Map<string, number>();
  for (const p of positions) bySector.set(p.sector, (bySector.get(p.sector) ?? 0) + p.value);
  const totalVal = [...bySector.values()].reduce((a, b) => a + b, 0) || 1;
  const allocation = [...bySector.entries()]
    .map(([sector, value]) => ({ sector, pct: +((value / totalVal) * 100).toFixed(1) }))
    .sort((a, b) => b.pct - a.pct);

  return (
    <>
      <Topbar title="Genel Bakış" />
      <div className="ais ais-light min-h-[calc(100vh-64px)]">
        <div className="mx-auto max-w-5xl px-8 py-10">
          {/* ───────── Karşılama ───────── */}
          <h1 className="d-title">
            <Greeting />
          </h1>

          {/* ───────── Portföy değeri + grafik ───────── */}
          <div className="mt-8 grid gap-6 lg:grid-cols-[1.85fr_1fr]">
            <div
              className="overflow-hidden rounded-xl border"
              style={{ borderColor: "var(--ais-line)", background: "var(--ais-surface)" }}
            >
              <div className="flex flex-wrap items-start justify-between gap-4 px-6 pt-6">
                <div>
                  <p className="text-[12px] text-[var(--ais-fg-faint)]">Toplam portföy değeri</p>
                  <p className="num mt-2 text-[40px] font-medium leading-none tracking-tight text-[var(--ais-fg)]">
                    <AnimatedNumber value={summary.total} format={(n) => fmtUsd(n)} />
                  </p>
                  <div className="mt-3 flex items-center gap-3 text-[13px]">
                    <span
                      className="num inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-medium"
                      style={{
                        background: dayUp ? "var(--ais-green-bg)" : "rgba(217,48,37,0.10)",
                        color: dayUp ? UP : DOWN,
                      }}
                    >
                      <ArrowUpRight size={12} className={dayUp ? "" : "rotate-90"} />
                      {Math.abs(summary.dayPlPct).toFixed(2)}%
                    </span>
                    <span className="num text-[var(--ais-fg-muted)]">
                      {dayUp ? "+" : ""}
                      {fmtUsd(summary.dayPl)} bugün
                    </span>
                  </div>
                </div>

                <Toggle
                  value={TIMEFRAMES[tf].label}
                  onChange={(label) => setTf(TIMEFRAMES.findIndex((r) => r.label === label))}
                  options={TIMEFRAMES.map((r) => ({ value: r.label, label: r.label }))}
                />
              </div>

              <div className="mt-4 w-full px-6 pb-1">
                <ChartFrame
                  light
                  title="Portföy performansı"
                  render={(big) => (
                    <div style={{ height: big ? 460 : 268 }}>
                      <LiveAreaChart
                        key={`${tf}-${big ? "lg" : "sm"}`}
                        data={curve}
                        benchmark={benchmark}
                        positive={up}
                        height={big ? 432 : 240}
                      />
                    </div>
                  )}
                />
              </div>

              <div
                className="mt-2 grid grid-cols-3 border-t"
                style={{ borderColor: "var(--ais-line)" }}
              >
                <HeroStat label="Yatırılan" animate={summary.invested} format={(n) => fmtUsd(n)} />
                <HeroStat
                  label="Nakit"
                  animate={summary.cash}
                  format={(n) => fmtUsd(n)}
                  divider
                />
                <HeroStat
                  label="Toplam getiri"
                  animate={summary.totalPl}
                  format={(n) => `${up ? "+" : ""}${fmtUsd(n)}`}
                  sub={`${summary.totalPlPct}%`}
                  tone={up ? UP : DOWN}
                  divider
                />
              </div>
            </div>

            <DailyBrief />
          </div>

          {/* ───────── Erken uyarı radarı ───────── */}
          <div className="mt-6">
            <EarlyWarning />
          </div>

          {/* ───────── Varlıklar + Dağılım ───────── */}
          <section className="mt-10 border-t pt-8" style={{ borderColor: "var(--ais-line)" }}>
            <div className="grid gap-8 lg:grid-cols-[1.7fr_1fr]">
              <div>
                <div className="mb-4 flex items-end justify-between gap-3">
                  <h2 className="d-section">Varlıkların</h2>
                  <Link
                    href="/dashboard/portfolio"
                    className="flex items-center gap-1 text-[12.5px] text-[var(--ais-fg-faint)] transition hover:text-[var(--ais-fg)]"
                  >
                    Tümünü gör <ChevronRight size={13} />
                  </Link>
                </div>
                <div
                  className="overflow-hidden rounded-xl border"
                  style={{ borderColor: "var(--ais-line)" }}
                >
                  {sorted.slice(0, 6).map((p, i) => (
                    <Link
                      key={p.symbol}
                      href={`/dashboard/stock/${p.symbol}`}
                      className="flex items-center gap-4 px-4 py-3 transition hover:bg-[var(--ais-surface-2)]"
                      style={{ borderTop: i === 0 ? "none" : "1px solid var(--ais-line)" }}
                    >
                      <TickerBadge symbol={p.symbol} />
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-medium text-[var(--ais-fg)]">{p.symbol}</p>
                        <p className="truncate text-[12px] text-[var(--ais-fg-muted)]">{p.name}</p>
                      </div>
                      <Sparkline seed={p.symbol} up={p.changePct >= 0} data={series[p.symbol.toUpperCase()]} />
                      <div className="w-24 text-right">
                        <p className="num text-[13px] font-medium text-[var(--ais-fg)]">
                          <LiveValue value={p.price} format={(n) => fmtUsd(n)} jitter={0.0009} />
                        </p>
                        <p className="num text-[12px]" style={{ color: p.changePct >= 0 ? UP : DOWN }}>
                          {p.changePct >= 0 ? "+" : ""}
                          {p.changePct}%
                        </p>
                      </div>
                      <div className="hidden w-28 text-right sm:block">
                        <p className="num text-[13px] font-medium text-[var(--ais-fg)]">{fmtUsd(p.value)}</p>
                        <p className="num text-[12px]" style={{ color: p.pl >= 0 ? UP : DOWN }}>
                          {p.pl >= 0 ? "+" : ""}
                          {fmtUsd(p.pl)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="d-section mb-4">Dağılım</h2>
                <div
                  className="rounded-xl border p-5"
                  style={{ borderColor: "var(--ais-line)", background: "var(--ais-surface)" }}
                >
                  {allocation.length === 0 ? (
                    <p className="py-6 text-center text-[12.5px] text-[var(--ais-fg-faint)]">
                      Henüz varlık yok. İlk işlemini yapınca dağılım burada görünür.
                    </p>
                  ) : (
                  <div className="space-y-3.5">
                    {allocation.map((a, i) => (
                      <div key={a.sector}>
                        <div className="flex items-center justify-between text-[12.5px]">
                          <span className="text-[var(--ais-fg-muted)]">{a.sector}</span>
                          <span className="num font-medium text-[var(--ais-fg)]">{a.pct}%</span>
                        </div>
                        <div
                          className="mt-1.5 h-1.5 overflow-hidden rounded-full"
                          style={{ background: "var(--ais-surface-2)" }}
                        >
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${a.pct}%`, background: ACCENT, opacity: [1, 0.78, 0.6, 0.46, 0.34, 0.24][i % 6] }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* ───────── İzleme + Hareketliler ───────── */}
          <section className="mt-10 border-t pt-8" style={{ borderColor: "var(--ais-line)" }}>
            <div className="grid gap-8 lg:grid-cols-2">
              <WatchlistCard />
              <div>
                <div className="mb-4 flex items-center gap-2">
                  <h2 className="d-section">Günün hareketlileri</h2>
                  <TrendingUp size={15} className="text-[var(--ais-fg-muted)]" />
                </div>
                <div
                  className="rounded-xl border p-3"
                  style={{ borderColor: "var(--ais-line)", background: "var(--ais-surface)" }}
                >
                  <Movers />
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

/* ── Didit segment toggle ── */
function Toggle({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div
      className="inline-flex gap-1 rounded-full border p-1"
      style={{ borderColor: "var(--ais-line)", background: "var(--ais-surface)" }}
    >
      {options.map((o) => {
        const on = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className="rounded-full px-3 py-1 text-[12px] font-medium transition-colors"
            style={{
              background: on ? "var(--ais-accent-bg)" : "transparent",
              color: on ? ACCENT : "var(--ais-fg-muted)",
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function HeroStat({
  label,
  value,
  animate,
  format,
  sub,
  tone,
  divider,
}: {
  label: string;
  value?: string;
  animate?: number;
  format?: (n: number) => string;
  sub?: string;
  tone?: string;
  divider?: boolean;
}) {
  return (
    <div
      className="px-6 py-4"
      style={divider ? { borderLeft: "1px solid var(--ais-line)" } : undefined}
    >
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
      className="flex items-center justify-between rounded-lg px-2 py-2 transition hover:bg-[var(--ais-surface-2)]"
    >
      <span className="text-[13px] font-medium text-[var(--ais-fg)]">{m.symbol}</span>
      <div className="text-right">
        <span className="num mr-3 text-[12.5px] text-[var(--ais-fg-muted)]">{fmtUsd(m.price)}</span>
        <span className="num text-[12px]" style={{ color: m.changePct >= 0 ? UP : DOWN }}>
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
