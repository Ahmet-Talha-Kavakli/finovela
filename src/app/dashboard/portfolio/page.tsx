"use client";

/**
 * Finovela Portföy — canlı holdings + performans + dağılım + risk + emirler.
 * Tasarım dili: Didit (business.didit.me) — açık tema, kutusuz, border-t ayraçlı
 * bölümler, ızgara-ayraçlı metrik şeridi, ais-dt dense tablo, soft rozetler.
 */

import { Topbar } from "@/components/dashboard/topbar";
import { TickerBadge } from "@/components/dashboard/ui";
import { AreaChart, Sparkline } from "@/components/dashboard/area-chart";
import { ChartFrame } from "@/components/dashboard/chart-frame";
import { useLivePortfolio } from "@/lib/dashboard/use-portfolio";
import { useEquityCurve } from "@/lib/dashboard/use-equity-curve";
import { ConnectedExchangeCard } from "@/components/dashboard/connected-exchange-card";
import { getUniverseEntry } from "@/lib/market/universe";
import { fmtUsd, fmtMoney } from "@/lib/dashboard/data";
import { AnimatedNumber } from "@/components/dashboard/animated-number";
import {
  Cpu,
  ShoppingCart,
  ShieldCheck,
  Landmark,
  HeartPulse,
  Factory,
  Layers,
  Bitcoin,
  Zap,
  Circle,
  type LucideIcon,
} from "lucide-react";

// Didit açık-tema renkleri — beyaz zeminde okunur (koyu yeşil/kırmızı).
const UP = "var(--ais-green)";
const DOWN = "#d93025";
const ACCENT = "var(--ais-accent)";

// Sektör → ikon + renk eşlemesi (Didit sade: renkli ikon + aynı renkte bar).
const SECTOR_META: Record<string, { icon: LucideIcon; color: string }> = {
  Technology: { icon: Cpu, color: "#2567ff" },
  "Consumer Cyclical": { icon: ShoppingCart, color: "#7c5cff" },
  "Consumer Defensive": { icon: ShieldCheck, color: "#0f7d4a" },
  "Financial Services": { icon: Landmark, color: "#1e40af" },
  Healthcare: { icon: HeartPulse, color: "#d6336c" },
  Industrials: { icon: Factory, color: "#475569" },
  ETF: { icon: Layers, color: "#0891b2" },
  Crypto: { icon: Bitcoin, color: "#f59e0b" },
  Energy: { icon: Zap, color: "#d97706" },
};
function sectorMeta(sector: string): { icon: LucideIcon; color: string } {
  return SECTOR_META[sector] ?? { icon: Circle, color: "var(--ais-fg-muted)" };
}

export default function PortfolioPage() {
  const { positions, summary, orders, risk } = useLivePortfolio();
  const { curve, benchmark } = useEquityCurve("1Y");
  const sorted = [...positions].sort((a, b) => b.value - a.value);

  const bySector = new Map<string, number>();
  for (const p of positions) bySector.set(p.sector, (bySector.get(p.sector) ?? 0) + p.value);
  const totalVal = [...bySector.values()].reduce((a, b) => a + b, 0) || 1;
  const allocation = [...bySector.entries()]
    .map(([sector, value]) => ({ sector, pct: +((value / totalVal) * 100).toFixed(1) }))
    .sort((a, b) => b.pct - a.pct);

  const dayUp = summary.dayPl >= 0;
  const totalUp = summary.totalPl >= 0;

  // Risk skoru rengi (1–10): düşük=yeşil, orta=mavi, yüksek=kırmızı.
  const riskColor = risk.score <= 3 ? UP : risk.score >= 8 ? DOWN : ACCENT;

  return (
    <>
      <Topbar title="Portföy" />
      <div className="ais ais-light min-h-[calc(100vh-64px)]">
        <div className="mx-auto max-w-5xl px-8 py-10">
          {/* ───────── Başlık ───────── */}
          <div>
            <h1 className="d-title">Portföy</h1>
            <p className="d-subtitle mt-2 max-w-2xl leading-relaxed">
              Tüm pozisyonların, performansın ve riskin tek bakışta — canlı piyasa fiyatıyla.
            </p>
          </div>

          {/* ───────── Bağlı borsa (varsa) ───────── */}
          <div className="mt-6">
            <ConnectedExchangeCard />
          </div>

          {/* ───────── Genel bakış (kutusuz ızgara-ayraçlı şerit) ───────── */}
          <div
            className="mt-9 grid grid-cols-2 gap-px overflow-hidden rounded-xl border lg:grid-cols-4"
            style={{ borderColor: "var(--ais-line)", background: "var(--ais-line)" }}
          >
            <Stat label="Toplam değer" animate={summary.total} format={(n) => fmtUsd(n)} />
            <Stat
              label="Bugün"
              animate={summary.dayPl}
              format={(n) => `${dayUp ? "+" : ""}${fmtUsd(n)}`}
              sub={`${dayUp ? "+" : ""}${summary.dayPlPct}%`}
              color={dayUp ? UP : DOWN}
            />
            <Stat
              label="Toplam getiri"
              animate={summary.totalPl}
              format={(n) => `${totalUp ? "+" : ""}${fmtUsd(n)}`}
              sub={`${totalUp ? "+" : ""}${summary.totalPlPct}%`}
              color={totalUp ? UP : DOWN}
            />
            <Stat label="Kullanılabilir nakit" animate={summary.cash} format={(n) => fmtUsd(n)} />
          </div>

          {/* ───────── Performans + dağılım ───────── */}
          <div className="mt-10 grid gap-8 border-t pt-8 lg:grid-cols-3" style={{ borderColor: "var(--ais-line)" }}>
            <div className="lg:col-span-2">
              <h2 className="d-section mb-4">Performans</h2>
              <div
                className="rounded-xl border p-4"
                style={{ borderColor: "var(--ais-line)", background: "var(--ais-surface)" }}
              >
                <ChartFrame
                  title="Performans"
                  render={(big) => (
                    <div style={{ height: big ? 440 : 280 }}>
                      <AreaChart data={curve} benchmark={benchmark} positive={summary.totalPl >= 0} />
                    </div>
                  )}
                />
              </div>
            </div>

            <div>
              <h2 className="d-section mb-1">Sektöre göre dağılım</h2>
              <p className="mb-4 text-[12.5px] text-[var(--ais-fg-muted)]">
                Değerin sektörlere göre payı.
              </p>
              <div
                className="rounded-xl border p-5"
                style={{ borderColor: "var(--ais-line)", background: "var(--ais-surface)" }}
              >
                {allocation.length === 0 ? (
                  <p className="py-6 text-center text-[12.5px] text-[var(--ais-fg-muted)]">
                    Henüz pozisyon yok.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {allocation.map((a) => {
                      const meta = sectorMeta(a.sector);
                      const Icon = meta.icon;
                      return (
                        <div key={a.sector} className="flex items-center gap-3">
                          <span
                            className="grid h-7 w-7 shrink-0 place-items-center rounded-lg"
                            style={{ background: "var(--ais-surface-2)", color: "var(--ais-fg-muted)" }}
                          >
                            <Icon size={14} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between text-[12.5px]">
                              <span className="truncate text-[var(--ais-fg-muted)]">{a.sector}</span>
                              <span className="num font-medium text-[var(--ais-fg)]">{a.pct}%</span>
                            </div>
                            <div
                              className="mt-1.5 h-1.5 overflow-hidden rounded-full"
                              style={{ background: "var(--ais-surface-2)" }}
                            >
                              <div
                                className="h-full rounded-full transition-all duration-700"
                                style={{ width: `${a.pct}%`, background: meta.color }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ───────── Portföy riski ───────── */}
          <section className="mt-10 border-t pt-8" style={{ borderColor: "var(--ais-line)" }}>
            <div className="mb-5">
              <h2 className="d-section">Portföy riski</h2>
              <p className="mt-1 text-[12.5px] text-[var(--ais-fg-muted)]">
                Yoğunlaşma, tek varlık ağırlığı ve kripto maruziyetine göre 1–10 puan.
              </p>
            </div>

            <div
              className="flex flex-col gap-6 rounded-xl border p-6 sm:flex-row sm:items-center"
              style={{ borderColor: "var(--ais-line)", background: "var(--ais-surface)" }}
            >
              {/* Skor — Didit tarzı temiz sayı + segment bar (radial yerine) */}
              <div className="shrink-0 sm:w-44">
                <div className="flex items-baseline gap-1.5">
                  <span className="num text-[40px] font-semibold leading-none" style={{ color: riskColor }}>
                    {risk.score}
                  </span>
                  <span className="text-[15px] text-[var(--ais-fg-faint)]">/ 10</span>
                </div>
                <p className="mt-2 text-[13px] font-medium text-[var(--ais-fg)]">{risk.label}</p>
                {/* 10 segmentli bar */}
                <div className="mt-3 flex gap-1">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <span
                      key={i}
                      className="h-1.5 flex-1 rounded-full"
                      style={{
                        background: i < risk.score ? riskColor : "var(--ais-surface-2)",
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[13px] leading-relaxed text-[var(--ais-fg-muted)]">
                  Finovela portföyünüzü yoğunlaşma, tek varlık ağırlığı ve kripto maruziyetine göre
                  puanlar. Düşük puan daha istikrarlı, yüksek puan daha büyük dalgalanma anlamına gelir.
                </p>
                <div
                  className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-lg border sm:max-w-sm"
                  style={{ borderColor: "var(--ais-line)", background: "var(--ais-line)" }}
                >
                  <MiniStat label="En büyük pozisyon" value={`${risk.topWeight}%`} />
                  <MiniStat label="Kripto maruziyeti" value={`${risk.cryptoWeight}%`} />
                </div>
              </div>
            </div>
          </section>

          {/* ───────── Tüm varlıklar (Didit ais-dt tablo) ───────── */}
          <section className="mt-10 border-t pt-8" style={{ borderColor: "var(--ais-line)" }}>
            <div className="mb-5 flex items-end justify-between gap-3">
              <h2 className="d-section">Tüm varlıklar</h2>
              <span className="text-[12px] text-[var(--ais-fg-faint)]">{sorted.length} varlık</span>
            </div>

            {sorted.length === 0 ? (
              <div
                className="rounded-xl border border-dashed px-6 py-14 text-center"
                style={{ borderColor: "var(--ais-line-strong)" }}
              >
                <p className="text-[13px] text-[var(--ais-fg-muted)]">
                  Henüz pozisyon yok. İlk işlemini Finovela ile yapabilirsin.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "var(--ais-line)" }}>
                <table className="ais-dt min-w-[760px]">
                  <thead>
                    <tr>
                      <th>VARLIK</th>
                      <th className="!text-right">FİYAT</th>
                      <th className="!text-right">BUGÜN</th>
                      <th className="!text-right">ADET</th>
                      <th className="!text-right">ORT. MALİYET</th>
                      <th className="!text-right">DEĞER</th>
                      <th className="!text-right">TOPLAM K/Z</th>
                      <th>7G</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((p) => (
                      <tr key={p.symbol}>
                        <td>
                          <div className="flex items-center gap-3">
                            <TickerBadge symbol={p.symbol} size={30} />
                            <div className="min-w-0">
                              <p className="text-[13px] font-medium text-[var(--ais-fg)]">{p.symbol}</p>
                              <p className="truncate text-[12px] text-[var(--ais-fg-muted)]">{p.name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="num !text-right font-medium">
                          {fmtMoney(p.price, getUniverseEntry(p.symbol).currency ?? "USD")}
                        </td>
                        <td className="num !text-right" style={{ color: p.changePct >= 0 ? UP : DOWN }}>
                          {p.changePct >= 0 ? "+" : ""}
                          {p.changePct}%
                        </td>
                        <td className="num !text-right text-[var(--ais-fg-muted)]">
                          {p.shares < 1 ? p.shares.toFixed(4) : p.shares}
                        </td>
                        <td className="num !text-right text-[var(--ais-fg-muted)]">{fmtUsd(p.avgCost)}</td>
                        <td className="num !text-right font-medium">{fmtUsd(p.value)}</td>
                        <td className="num !text-right" style={{ color: p.pl >= 0 ? UP : DOWN }}>
                          {p.pl >= 0 ? "+" : ""}
                          {fmtUsd(p.pl)}
                          <span className="ml-1 text-[11px] opacity-70">({p.plPct}%)</span>
                        </td>
                        <td>
                          <Sparkline seed={p.symbol} up={p.plPct >= 0} width={70} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* ───────── Son emirler ───────── */}
          {orders.length > 0 && (
            <section className="mt-10 border-t pt-8" style={{ borderColor: "var(--ais-line)" }}>
              <h2 className="d-section mb-5">Son emirler</h2>
              <div className="overflow-hidden rounded-xl border" style={{ borderColor: "var(--ais-line)" }}>
                {orders.slice(0, 8).map((o, i) => (
                  <div
                    key={o.id}
                    className="flex items-center gap-3 px-4 py-3 transition hover:bg-[var(--ais-surface-2)]"
                    style={{ borderTop: i === 0 ? "none" : "1px solid var(--ais-line)" }}
                  >
                    <span
                      className="badge-soft"
                      style={{
                        background: o.side === "BUY" ? "var(--ais-green-bg)" : "rgba(217,48,37,0.10)",
                        color: o.side === "BUY" ? UP : DOWN,
                      }}
                    >
                      {o.side === "BUY" ? "AL" : "SAT"}
                    </span>
                    <span className="text-[13px] font-medium text-[var(--ais-fg)]">{o.symbol}</span>
                    <span className="num text-[12.5px] text-[var(--ais-fg-muted)]">
                      {o.shares < 1 ? o.shares.toFixed(4) : o.shares} @ {fmtUsd(o.price)}
                    </span>
                    <span className="num ml-auto text-[13px] font-medium text-[var(--ais-fg)]">
                      {fmtUsd(o.shares * o.price)}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
}

/* ── Üst metrik (kutusuz ızgara şeridi — Didit Usage) ── */
function Stat({
  label,
  animate,
  format,
  sub,
  color,
}: {
  label: string;
  animate: number;
  format: (n: number) => string;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="bg-[var(--ais-surface)] px-5 py-4">
      <p className="text-[11.5px] text-[var(--ais-fg-faint)]">{label}</p>
      <p className="num mt-2 text-[19px] font-medium tracking-tight" style={{ color: color ?? "var(--ais-fg)" }}>
        <AnimatedNumber value={animate} format={format} />
      </p>
      {sub && (
        <p className="num mt-0.5 text-[12px]" style={{ color: color ?? "var(--ais-fg-muted)" }}>
          {sub}
        </p>
      )}
    </div>
  );
}

/* ── Risk mini metrik ── */
function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[var(--ais-surface)] px-4 py-3">
      <p className="text-[11px] text-[var(--ais-fg-faint)]">{label}</p>
      <p className="num mt-1 text-[15px] font-medium text-[var(--ais-fg)]">{value}</p>
    </div>
  );
}
