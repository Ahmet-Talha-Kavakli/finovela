"use client";

/**
 * Finovela Analizler — konsantrasyon, korelasyon, ısı haritası, sektör, gelir.
 * Tasarım dili: Didit (business.didit.me) — açık tema, kutusuz, border-t ayraçlı
 * bölümler, ızgara-ayraçlı metrik şeridi, sade çubuk/bar grafikler, token renkleri.
 * Beyaz-sabit renk YOK — hepsi --ais-* token (açık temada okunur).
 */

import { useEffect, useMemo, useState } from "react";
import { Topbar } from "@/components/dashboard/topbar";
import { TickerBadge } from "@/components/dashboard/ticker-badge";
import { usePaper } from "@/lib/dashboard/use-portfolio";
import { getUniverseEntry } from "@/lib/market/universe";
import { fmtUsd } from "@/lib/dashboard/data";
import {
  correlationMatrix,
  concentration,
  incomeProjection,
  treemapData,
  type CorrelationMatrix,
  type Position,
} from "@/lib/dashboard/analytics";
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

const ACCENT = "var(--ais-accent)";
const UP = "var(--ais-green)";

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

// Sektör → temettü getirisi (yıllık %, deterministik tahmin).
const SECTOR_YIELD: Record<string, number> = {
  Technology: 0.6,
  "Consumer Cyclical": 0.9,
  "Consumer Defensive": 2.8,
  "Financial Services": 2.4,
  Healthcare: 1.8,
  Industrials: 1.2,
  ETF: 1.4,
  Crypto: 0,
  Unknown: 0.5,
};

const SYMBOL_YIELD: Record<string, number> = {
  KO: 3.0, JPM: 2.2, V: 0.8, WFC: 2.5, UNH: 1.6, GE: 0.4, SPY: 1.3, QQQ: 0.6, VTI: 1.3,
};

/** Korelasyon hücre rengi — Didit açık-tema: yeşil (birlikte) / kırmızı (ters). */
function corrColor(v: number): string {
  const a = Math.min(0.9, 0.12 + Math.abs(v) * 0.78);
  // Didit açık-tema tonları: yeşil #28c840, kırmızı #d93025.
  if (v >= 0) return `rgba(40,200,64,${a})`;
  return `rgba(217,48,37,${a})`;
}
/** Hücre metni — dolu (koyu zemin) hücrede beyaz, açık hücrede normal metin. */
function corrText(v: number): string {
  return Math.abs(v) > 0.5 ? "#ffffff" : "var(--ais-fg)";
}

export default function AnalyticsPage() {
  const paper = usePaper();
  const [quotes, setQuotes] = useState<Record<string, number>>({});
  const [histories, setHistories] = useState<Record<string, number[]>>({});

  const symbols = useMemo(() => paper.holdings.map((h) => h.symbol), [paper.holdings]);
  const symbolsKey = symbols.join(",");

  useEffect(() => {
    if (!symbolsKey) return;
    let cancelled = false;
    fetch(`/api/market/quote?symbols=${symbolsKey}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: { quotes?: { symbol: string; price: number }[] }) => {
        if (cancelled || !d.quotes) return;
        const m: Record<string, number> = {};
        for (const q of d.quotes) m[q.symbol] = q.price;
        setQuotes(m);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [symbolsKey]);

  useEffect(() => {
    if (!symbols.length) return;
    let cancelled = false;
    Promise.all(
      symbols.map((s) =>
        fetch(`/api/market/candles?symbol=${s}&resolution=D`)
          .then((r) => (r.ok ? r.json() : { candles: [] }))
          .then((d: { candles?: { close: number }[] }) => [s, (d.candles ?? []).map((c) => c.close)] as const)
          .catch(() => [s, [] as number[]] as const),
      ),
    ).then((pairs) => {
      if (cancelled) return;
      const m: Record<string, number[]> = {};
      for (const [s, closes] of pairs) m[s] = closes;
      setHistories(m);
    });
    return () => { cancelled = true; };
  }, [symbolsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const positions: Position[] = useMemo(
    () =>
      paper.holdings.map((h) => {
        const u = getUniverseEntry(h.symbol);
        const price = quotes[h.symbol] ?? u.basePrice;
        return { symbol: h.symbol, value: +(price * h.shares).toFixed(2), sector: u.sector };
      }),
    [paper.holdings, quotes],
  );

  const conc = useMemo(() => concentration(positions), [positions]);
  const treemap = useMemo(() => treemapData(positions), [positions]);
  const corr: CorrelationMatrix = useMemo(() => correlationMatrix(histories), [histories]);

  const income = useMemo(() => {
    const yields: Record<string, number> = {};
    for (const p of positions) {
      yields[p.symbol] = SYMBOL_YIELD[p.symbol] ?? SECTOR_YIELD[p.sector] ?? 0.5;
    }
    return incomeProjection(positions, yields);
  }, [positions]);

  const maxIncome = Math.max(1, ...income.monthlySchedule.map((m) => m.income));
  const empty = positions.length === 0;

  return (
    <>
      <Topbar title="Analizler" />
      <div className="ais ais-light min-h-[calc(100vh-64px)]">
        <div className="mx-auto max-w-5xl px-8 py-10">
          {/* ───────── Başlık ───────── */}
          <div>
            <h1 className="d-title">Analizler</h1>
            <p className="d-subtitle mt-2 max-w-2xl leading-relaxed">
              Portföyünün yoğunlaşması, korelasyonu ve tahmini geliri — derinlemesine.
            </p>
          </div>

          {empty ? (
            <div
              className="mt-9 rounded-xl border border-dashed px-6 py-16 text-center"
              style={{ borderColor: "var(--ais-line-strong)" }}
            >
              <p className="text-[14px] font-medium text-[var(--ais-fg)]">Henüz analiz edilecek veri yok</p>
              <p className="mx-auto mt-1 max-w-sm text-[12.5px] text-[var(--ais-fg-muted)]">
                Portföyüne ilk pozisyonu ekledikten sonra konsantrasyon, korelasyon ve gelir
                analizlerin burada belirir.
              </p>
            </div>
          ) : (
            <>
              {/* ───────── Genel bakış (kutusuz ızgara-ayraçlı şerit) ───────── */}
              <div
                className="mt-9 grid grid-cols-2 gap-px overflow-hidden rounded-xl border lg:grid-cols-4"
                style={{ borderColor: "var(--ais-line)", background: "var(--ais-line)" }}
              >
                <Stat label="En büyük pozisyon" animate={conc.topWeight} format={(n) => `${Math.round(n)}%`} sub={conc.topSymbol ?? "—"} />
                <Stat
                  label="Yoğunlaşma (HHI)"
                  animate={conc.hhi}
                  format={(n) => `${Math.round(n)}`}
                  sub={conc.hhi < 1500 ? "Çeşitlendirilmiş" : conc.hhi < 2500 ? "Orta" : "Yoğunlaşmış"}
                />
                <Stat label="Etkin varlık sayısı" animate={conc.effectiveHoldings} format={(n) => `${Math.round(n)}`} sub={`/ ${positions.length} pozisyon`} />
                <Stat label="Tahmini yıllık gelir" animate={income.annual} format={(n) => fmtUsd(n, 0)} sub={`%${income.portfolioYield} getiri`} color={UP} />
              </div>

              {/* ───────── Korelasyon + ısı haritası ───────── */}
              <div className="mt-10 grid gap-8 border-t pt-8 lg:grid-cols-2" style={{ borderColor: "var(--ais-line)" }}>
                {/* korelasyon matrisi */}
                <div>
                  <h2 className="d-section mb-1">Korelasyon matrisi</h2>
                  <p className="mb-4 text-[12.5px] text-[var(--ais-fg-muted)]">
                    Varlıkların birlikte mi ters mi hareket ettiği.
                  </p>
                  <Panel>
                    {corr.symbols.length >= 2 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full border-separate border-spacing-1 text-center text-[11px]">
                          <thead>
                            <tr>
                              <th className="w-12" />
                              {corr.symbols.map((s) => (
                                <th key={s} className="min-w-[42px] px-1 py-1 font-medium text-[var(--ais-fg-faint)]">{s}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {corr.symbols.map((s, i) => (
                              <tr key={s}>
                                <td className="whitespace-nowrap pr-2 text-right font-medium text-[var(--ais-fg-faint)]">{s}</td>
                                {corr.matrix[i].map((v, j) => (
                                  <td
                                    key={j}
                                    className="num min-w-[42px] rounded-md px-1.5 py-2.5 font-semibold"
                                    style={{
                                      background: i === j ? "var(--ais-surface-2)" : corrColor(v),
                                      color: i === j ? "var(--ais-fg-faint)" : corrText(v),
                                    }}
                                    title={`${corr.symbols[i]} / ${corr.symbols[j]}: ${v}`}
                                  >
                                    {v.toFixed(2)}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div className="mt-3 flex items-center gap-3 text-[11px] text-[var(--ais-fg-muted)]">
                          <span className="inline-flex items-center gap-1.5">
                            <span className="h-2.5 w-2.5 rounded" style={{ background: corrColor(0.9) }} /> Birlikte hareket
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <span className="h-2.5 w-2.5 rounded" style={{ background: corrColor(-0.9) }} /> Ters hareket
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="py-6 text-center text-[12.5px] text-[var(--ais-fg-muted)]">
                        Korelasyon için fiyat geçmişi yükleniyor…
                      </p>
                    )}
                  </Panel>
                </div>

                {/* varlık ağırlıkları — Didit country-breakdown deseni (logo + bar + %/değer) */}
                <div>
                  <h2 className="d-section mb-1">Varlık ağırlıkları</h2>
                  <p className="mb-4 text-[12.5px] text-[var(--ais-fg-muted)]">
                    Pozisyon büyüklüklerinin oransal dağılımı.
                  </p>
                  <Panel>
                    {treemap.length ? (
                      (() => {
                        const maxPct = Math.max(...treemap.map((r) => r.pct), 1);
                        return (
                          <div className="space-y-3.5">
                            {treemap.map((r) => (
                              <div key={r.symbol} className="flex items-center gap-3">
                                <TickerBadge symbol={r.symbol} size={28} />
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between gap-2 text-[12.5px]">
                                    <span className="truncate font-medium text-[var(--ais-fg)]">{r.symbol}</span>
                                    <span className="num shrink-0 text-[var(--ais-fg-muted)]">
                                      {r.pct}%
                                      <span className="ml-2 text-[var(--ais-fg-faint)]">{fmtUsd(r.value, 0)}</span>
                                    </span>
                                  </div>
                                  <div
                                    className="mt-1.5 h-1.5 overflow-hidden rounded-full"
                                    style={{ background: "var(--ais-surface-2)" }}
                                  >
                                    <div
                                      className="h-full rounded-full transition-all duration-700"
                                      style={{
                                        width: `${Math.max(r.pct, 0.5)}%`,
                                        background: ACCENT,
                                        opacity: Math.max(0.35, 0.4 + (r.pct / maxPct) * 0.6),
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })()
                    ) : (
                      <p className="py-6 text-center text-[12.5px] text-[var(--ais-fg-muted)]">Gösterilecek varlık yok.</p>
                    )}
                  </Panel>
                </div>
              </div>

              {/* ───────── Sektör + gelir ───────── */}
              <div className="mt-10 grid gap-8 border-t pt-8 lg:grid-cols-2" style={{ borderColor: "var(--ais-line)" }}>
                {/* sektör dağılımı */}
                <div>
                  <h2 className="d-section mb-1">Sektör dağılımı</h2>
                  <p className="mb-4 text-[12.5px] text-[var(--ais-fg-muted)]">Değerin sektörlere göre payı.</p>
                  <Panel>
                    <div className="space-y-4">
                      {conc.sectors.map((s) => {
                        const meta = sectorMeta(s.sector);
                        const Icon = meta.icon;
                        return (
                          <div key={s.sector} className="flex items-center gap-3">
                            <span
                              className="grid h-7 w-7 shrink-0 place-items-center rounded-lg"
                              style={{ background: "var(--ais-surface-2)", color: "var(--ais-fg-muted)" }}
                            >
                              <Icon size={14} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-3 text-[12.5px]">
                                <span className="min-w-0 flex-1 truncate text-[var(--ais-fg-muted)]">{s.sector}</span>
                                <span className="num w-12 shrink-0 text-right text-[var(--ais-fg-muted)]">{s.pct}%</span>
                                <span className="num w-20 shrink-0 text-right font-medium text-[var(--ais-fg)]">
                                  {fmtUsd(s.value, 0)}
                                </span>
                              </div>
                              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full" style={{ background: "var(--ais-surface-2)" }}>
                                <div
                                  className="h-full rounded-full transition-all duration-700"
                                  style={{ width: `${Math.max(s.pct, 0.5)}%`, background: meta.color }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Panel>
                </div>

                {/* gelir merkezi */}
                <div>
                  <h2 className="d-section mb-1">Gelir Merkezi</h2>
                  <p className="mb-4 text-[12.5px] text-[var(--ais-fg-muted)]">Tahmini temettü geliri.</p>
                  <Panel>
                    <div className="flex items-baseline gap-2">
                      <p className="num text-[22px] font-semibold tracking-tight text-[var(--ais-fg)]">
                        {fmtUsd(income.monthly, 0)}
                      </p>
                      <span className="num text-[12px] text-[var(--ais-fg-faint)]">
                        / aylık ort. · {fmtUsd(income.annual, 0)} / yıl
                      </span>
                    </div>
                    {/* aylık çubuklar — Didit tek-renk tutarlı; yükseklik orana göre */}
                    <div className="mt-5 flex h-28 items-end gap-2">
                      {income.monthlySchedule.map((m) => (
                        <div key={m.month} className="group flex h-full flex-1 flex-col items-center justify-end gap-2">
                          <div className="flex w-full flex-1 items-end">
                            <div
                              className="w-full rounded-t-[5px] transition-all duration-500 group-hover:opacity-80"
                              style={{
                                height: `${Math.max(4, (m.income / maxIncome) * 100)}%`,
                                background: ACCENT,
                              }}
                              title={`${m.month}: ${fmtUsd(m.income, 0)}`}
                            />
                          </div>
                          <span className="text-[9px] text-[var(--ais-fg-faint)]">{m.month[0]}</span>
                        </div>
                      ))}
                    </div>
                    {income.byHolding.length > 0 && (
                      <div className="mt-4 space-y-2 border-t pt-4" style={{ borderColor: "var(--ais-line)" }}>
                        {income.byHolding.slice(0, 5).map((h) => (
                          <div key={h.symbol} className="flex items-center justify-between text-[12.5px]">
                            <span className="text-[var(--ais-fg-muted)]">
                              {h.symbol} <span className="text-[var(--ais-fg-faint)]">· {h.yield}%</span>
                            </span>
                            <span className="num font-medium text-[var(--ais-fg)]">{fmtUsd(h.income, 0)}/yıl</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </Panel>
                </div>
              </div>
            </>
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
      {sub && <p className="mt-0.5 text-[11.5px] text-[var(--ais-fg-muted)]">{sub}</p>}
    </div>
  );
}

/* ── İnce-kenarlı beyaz panel (Didit kart materyali) ── */
function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-xl border p-5 ${className}`}
      style={{ borderColor: "var(--ais-line)", background: "var(--ais-surface)" }}
    >
      {children}
    </div>
  );
}
