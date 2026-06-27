"use client";

import { useEffect, useRef, useState } from "react";
import {
  createChart,
  AreaSeries,
  CandlestickSeries,
  type IChartApi,
  type Time,
} from "lightweight-charts";

type Candle = { time: number; open: number; high: number; low: number; close: number };

const AIS_ACCENT = "#8ab4f8";
const AIS_UP = "#81c995";
const AIS_DOWN = "#f28b82";

/**
 * Gerçek fiyat grafiği (lightweight-charts v5) — AI Studio siyah dili.
 * Area ↔ Candlestick geçişi + zaman aralığı. /api/market/candles'tan besler.
 */
// Anlamlı zaman pencereleri — her biri kaç günlük + hangi mum çözünürlüğü.
// Kısa aralık günlük mum, uzun aralık haftalık → grafik hep dolu ve doğru.
type RangeKey = "1A" | "3A" | "6A" | "1Y";
const RANGES: Record<RangeKey, { days: number; res: "D" | "W"; label: string }> = {
  "1A": { days: 30, res: "D", label: "1A" },
  "3A": { days: 90, res: "D", label: "3A" },
  "6A": { days: 180, res: "D", label: "6A" },
  "1Y": { days: 365, res: "W", label: "1Y" },
};

export function PriceChart({
  symbol,
  height = 320,
  fill = false,
}: {
  symbol: string;
  height?: number;
  /** true → kapsayıcı alanı tamamen doldurur (fullscreen için). */
  fill?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [mode, setMode] = useState<"area" | "candles">("area");
  const [range, setRange] = useState<RangeKey>("1A");
  const [data, setData] = useState<Candle[]>([]);

  // veri çek — seçili pencereye göre GERÇEK from/to + doğru çözünürlük
  useEffect(() => {
    let off = false;
    const cfg = RANGES[range];
    const to = Math.floor(Date.now() / 1000);
    const from = to - cfg.days * 86400;
    fetch(`/api/market/candles?symbol=${symbol}&resolution=${cfg.res}&from=${from}&to=${to}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: { candles?: Candle[] }) => {
        if (!off && d.candles) setData(d.candles);
      })
      .catch(() => {});
    return () => {
      off = true;
    };
  }, [symbol, range]);

  // grafik kur
  useEffect(() => {
    if (!ref.current || !data.length) return;
    const chart = createChart(ref.current, {
      layout: {
        background: { color: "transparent" },
        textColor: "rgba(154,154,160,0.9)",
        attributionLogo: false,
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.035)" },
        horzLines: { color: "rgba(255,255,255,0.05)" },
      },
      rightPriceScale: {
        borderColor: "rgba(255,255,255,0.08)",
        // üst/alt boşluk → mumlar kenara yapışmaz, eksen dengeli
        scaleMargins: { top: 0.12, bottom: 0.12 },
      },
      timeScale: {
        borderColor: "rgba(255,255,255,0.08)",
        timeVisible: false,
        secondsVisible: false,
        fixLeftEdge: true,
        fixRightEdge: true,
      },
      crosshair: { mode: 1 },
      autoSize: true,
    });
    chartRef.current = chart;

    if (mode === "area") {
      const s = chart.addSeries(AreaSeries, {
        lineColor: AIS_ACCENT,
        topColor: "rgba(138,180,248,0.18)",
        bottomColor: "rgba(138,180,248,0)",
        lineWidth: 2,
      });
      s.setData(data.map((c) => ({ time: c.time as Time, value: c.close })));
    } else {
      const s = chart.addSeries(CandlestickSeries, {
        upColor: AIS_UP,
        downColor: AIS_DOWN,
        wickUpColor: AIS_UP,
        wickDownColor: AIS_DOWN,
        borderVisible: false,
      });
      s.setData(
        data.map((c) => ({
          time: c.time as Time,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        })),
      );
    }
    chart.timeScale().fitContent();

    return () => chart.remove();
  }, [data, mode, range]);

  return (
    <div className={fill ? "flex h-full flex-col" : ""}>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex gap-1 rounded-full border border-[var(--ais-line)] bg-[var(--ais-surface)] p-1 text-[12px]">
          {(Object.keys(RANGES) as RangeKey[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={
                range === r
                  ? "rounded-full bg-[var(--ais-surface-2)] px-3 py-1 font-medium text-[var(--ais-fg)]"
                  : "rounded-full px-3 py-1 text-[var(--ais-fg-muted)] hover:text-[var(--ais-fg)]"
              }
            >
              {RANGES[r].label}
            </button>
          ))}
        </div>
        <div className="flex gap-1 rounded-full border border-[var(--ais-line)] bg-[var(--ais-surface)] p-1 text-[12px]">
          {(["area", "candles"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={
                mode === m
                  ? "rounded-full bg-[var(--ais-surface-2)] px-3 py-1 font-medium text-[var(--ais-fg)]"
                  : "rounded-full px-3 py-1 text-[var(--ais-fg-muted)] hover:text-[var(--ais-fg)]"
              }
            >
              {m === "area" ? "Çizgi" : "Mum"}
            </button>
          ))}
        </div>
      </div>
      <div ref={ref} className={fill ? "w-full flex-1" : "w-full"} style={fill ? undefined : { height }} />
    </div>
  );
}
