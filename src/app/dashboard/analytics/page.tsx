"use client";

import { useEffect, useMemo, useState } from "react";
import { Topbar } from "@/components/dashboard/topbar";
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
import {
  SectionCard,
  Metric,
  IconChip,
  AIS_ACCENT,
  AIS_UP,
} from "@/components/dashboard/ais-kit";
import { ChartPieSlice, GridFour, CurrencyDollar, Stack } from "@phosphor-icons/react";

// Sektör → temettü getirisi (yıllık %, deterministik tahmin). Crypto/teknoloji düşük,
// defansif/finans yüksek; income hub projeksiyonu için.
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

// Sembol bazlı override (gerçekçi temettü ödeyenler).
const SYMBOL_YIELD: Record<string, number> = {
  KO: 3.0, JPM: 2.2, V: 0.8, WFC: 2.5, UNH: 1.6, GE: 0.4, SPY: 1.3, QQQ: 0.6, VTI: 1.3,
};

/** Korelasyon hücresi rengi — yeşil (pozitif) / kırmızı (negatif), belirgin opaklık. */
function corrColor(v: number): string {
  const a = Math.min(0.92, 0.18 + Math.abs(v) * 0.74);
  if (v >= 0) return `rgba(129,201,149,${a})`;
  return `rgba(242,139,130,${a})`;
}
/** Hücre metni okunurluğu — koyu zeminde açık, dolu hücrede koyu. */
function corrText(v: number): string {
  return Math.abs(v) > 0.55 ? "#0b0b0e" : "var(--ais-fg)";
}

export default function AnalyticsPage() {
  const paper = usePaper();
  const [quotes, setQuotes] = useState<Record<string, number>>({});
  const [histories, setHistories] = useState<Record<string, number[]>>({});

  const symbols = useMemo(() => paper.holdings.map((h) => h.symbol), [paper.holdings]);
  const symbolsKey = symbols.join(",");

  // Canlı fiyatlar
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

  // Korelasyon için günlük mumlar
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

  // Pozisyon listesi (değer + sektör)
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

  return (
    <>
      <Topbar title="Analizler" />
      <div className="ais min-h-[calc(100vh-64px)]">
        <div className="max-w-7xl px-8 py-10">
          <h1 className="text-[22px] font-normal tracking-tight text-[var(--ais-fg)]">Analizler</h1>

          {/* ───────── Konsantrasyon özeti ───────── */}
          <SectionCard
            label="Genel bakış"
            className="mt-10"
            bodyClassName="grid grid-cols-2 gap-3 lg:grid-cols-4"
          >
            <Metric
              label="En büyük pozisyon"
              animate={conc.topWeight}
              format={(n) => `${Math.round(n)}%`}
              sub={conc.topSymbol ?? "—"}
            />
            <Metric
              label="Yoğunlaşma (HHI)"
              animate={conc.hhi}
              format={(n) => `${Math.round(n)}`}
              sub={conc.hhi < 1500 ? "Çeşitlendirilmiş" : conc.hhi < 2500 ? "Orta" : "Yoğunlaşmış"}
            />
            <Metric
              label="Etkin varlık sayısı"
              animate={conc.effectiveHoldings}
              format={(n) => `${Math.round(n)}`}
              sub={`/ ${positions.length} pozisyon`}
            />
            <Metric
              label="Tahmini yıllık gelir"
              animate={income.annual}
              format={(n) => fmtUsd(n, 0)}
              sub={`%${income.portfolioYield} portföy getirisi`}
              color={AIS_UP}
            />
          </SectionCard>

          {/* ───────── Korelasyon + ısı haritası ───────── */}
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            {/* korelasyon matrisi */}
            <SectionCard
              label="Korelasyon matrisi"
              action={<IconChip icon={GridFour} size={28} />}
            >
              {corr.symbols.length >= 2 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-separate border-spacing-1 text-center text-[11px]">
                    <thead>
                      <tr>
                        <th className="w-10" />
                        {corr.symbols.map((s) => (
                          <th key={s} className="px-1 py-1 font-medium text-[var(--ais-fg-faint)]">{s}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {corr.symbols.map((s, i) => (
                        <tr key={s}>
                          <td className="pr-1 text-right font-medium text-[var(--ais-fg-faint)]">{s}</td>
                          {corr.matrix[i].map((v, j) => (
                            <td
                              key={j}
                              className="num rounded-md px-1.5 py-2.5 font-semibold"
                              style={{
                                background: i === j ? "rgba(255,255,255,0.08)" : corrColor(v),
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
                    <span className="inline-flex items-center gap-1">
                      <span className="h-2.5 w-2.5 rounded" style={{ background: corrColor(0.9) }} /> Birlikte hareket
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="h-2.5 w-2.5 rounded" style={{ background: corrColor(-0.9) }} /> Ters hareket
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-[13px] text-[var(--ais-fg-muted)]">Korelasyon için fiyat geçmişi yükleniyor…</p>
              )}
            </SectionCard>

            {/* treemap */}
            <SectionCard
              label="Varlık ısı haritası"
              action={<IconChip icon={Stack} size={28} />}
            >
              {treemap.length ? (
                (() => {
                  const maxPct = Math.max(...treemap.map((r) => r.pct), 1);
                  return (
                    <div className="relative h-[300px] w-full overflow-hidden rounded-xl">
                      {treemap.map((r) => {
                        // Ağırlık yoğunluğuna göre mavi tonu — büyük pay = daha dolu/parlak.
                        const t = r.pct / maxPct; // 0..1
                        const alpha = 0.16 + t * 0.62;
                        const big = r.w > 0.16 && r.h > 0.14;
                        const bright = t > 0.55;
                        return (
                          <div
                            key={r.symbol}
                            className="group absolute flex flex-col justify-between overflow-hidden rounded-lg p-2.5 transition-transform"
                            style={{
                              left: `calc(${r.x * 100}% + 2px)`,
                              top: `calc(${r.y * 100}% + 2px)`,
                              width: `calc(${r.w * 100}% - 4px)`,
                              height: `calc(${r.h * 100}% - 4px)`,
                              background: `rgba(138,180,248,${alpha})`,
                              boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)",
                            }}
                            title={`${r.symbol} · ${r.pct}% · ${fmtUsd(r.value, 0)}`}
                          >
                            <p
                              className="truncate text-[13px] font-semibold leading-none"
                              style={{ color: bright ? "#0b0b0e" : "var(--ais-fg)" }}
                            >
                              {r.symbol}
                            </p>
                            {big && (
                              <div className="space-y-0.5">
                                <p
                                  className="num text-[15px] font-semibold leading-none"
                                  style={{ color: bright ? "#0b0b0e" : "var(--ais-fg)" }}
                                >
                                  {r.pct}%
                                </p>
                                <p
                                  className="num text-[11px] leading-none"
                                  style={{ color: bright ? "rgba(11,11,14,0.65)" : "var(--ais-fg-muted)" }}
                                >
                                  {fmtUsd(r.value, 0)}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()
              ) : (
                <p className="text-[13px] text-[var(--ais-fg-muted)]">Gösterilecek varlık yok.</p>
              )}
            </SectionCard>
          </div>

          {/* ───────── Sektör + gelir ───────── */}
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            {/* sektör dağılımı */}
            <SectionCard
              label="Sektör dağılımı"
              action={<IconChip icon={ChartPieSlice} size={28} />}
            >
              <div className="space-y-3.5">
                {conc.sectors.map((s, i) => (
                  <div key={s.sector}>
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="text-[var(--ais-fg-muted)]">{s.sector}</span>
                      <span className="num text-[var(--ais-fg-muted)]">{s.pct}% · {fmtUsd(s.value, 0)}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${s.pct}%`, background: AIS_ACCENT, opacity: 1 - i * 0.12 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* income hub */}
            <SectionCard
              label="Gelir Merkezi · tahmini temettüler"
              action={<IconChip icon={CurrencyDollar} size={28} />}
            >
              <div className="flex items-baseline gap-3">
                <p className="num text-[22px] font-normal tracking-tight text-[var(--ais-fg)]">{fmtUsd(income.monthly, 0)}</p>
                <span className="num text-[12px] text-[var(--ais-fg-faint)]">/ aylık ort. · {fmtUsd(income.annual, 0)} / yıl</span>
              </div>
              <div className="mt-4 flex h-28 items-end gap-1.5">
                {income.monthlySchedule.map((m) => {
                  const peak = m.income >= maxIncome * 0.9; // çeyrek ayları vurgula
                  return (
                    <div key={m.month} className="group flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                      <div
                        className="w-full rounded-t-md transition-all group-hover:brightness-125"
                        style={{
                          height: `${Math.max(5, (m.income / maxIncome) * 100)}%`,
                          background: AIS_ACCENT,
                          opacity: peak ? 1 : 0.4,
                        }}
                        title={`${m.month}: ${fmtUsd(m.income, 0)}`}
                      />
                      <span className="text-[9px] text-[var(--ais-fg-faint)]">{m.month[0]}</span>
                    </div>
                  );
                })}
              </div>
              {income.byHolding.length > 0 && (
                <div className="mt-4 space-y-1.5 border-t border-[var(--ais-line)] pt-4">
                  {income.byHolding.slice(0, 5).map((h) => (
                    <div key={h.symbol} className="flex items-center justify-between text-[13px]">
                      <span className="text-[var(--ais-fg-muted)]">
                        {h.symbol} <span className="text-[var(--ais-fg-faint)]">· {h.yield}%</span>
                      </span>
                      <span className="num font-medium text-[var(--ais-fg)]">{fmtUsd(h.income, 0)}/yıl</span>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>
        </div>
      </div>
    </>
  );
}
