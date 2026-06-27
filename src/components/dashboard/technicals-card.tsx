"use client";

// Sohbet içi teknik-analiz kartı — get_technicals tool sonucu.
// Kompakt gösterge ızgarası: RSI (renkli bar), MACD, Bollinger konumu, ATR, EMA20/50.
// Sohbetin koyu temasına uyar (yeşil/kırmızı vurgular OrderCard ile aynı).

import { fmtUsd } from "@/lib/dashboard/data";

const UP = "#3ecf8e";
const DOWN = "#ff5c5c";
const NEUTRAL = "#8ab4f8";

export type TechnicalsData = {
  symbol: string;
  error?: string;
  price?: number;
  rsi?: number | null;
  macd?: { macd: number; signal: number; histogram: number } | null;
  bollinger?: { upper: number; middle: number; lower: number } | null;
  atr?: number | null;
  ema?: { ema20: number | null; ema50: number | null; ema200: number | null };
  sma?: { sma50: number | null; sma200: number | null };
  read?: string[];
};

function fmt(n: number | null | undefined, dp = 2): string {
  return n == null ? "—" : n.toLocaleString("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp });
}

export function TechnicalsCard({ t }: { t: TechnicalsData }) {
  if (t.error) {
    return (
      <div className="max-w-md rounded-3xl border border-white/[0.1] bg-white/[0.04] p-4">
        <p className="text-xs uppercase tracking-wide text-white/40">Teknik analiz · {t.symbol}</p>
        <p className="mt-2 text-sm text-white/55">{t.error}</p>
      </div>
    );
  }

  const rsi = t.rsi ?? null;
  const rsiColor = rsi == null ? NEUTRAL : rsi >= 70 ? DOWN : rsi <= 30 ? UP : NEUTRAL;
  const rsiLabel = rsi == null ? "" : rsi >= 70 ? "Aşırı alım" : rsi <= 30 ? "Aşırı satım" : "Nötr";
  const rsiPct = rsi == null ? 0 : Math.max(0, Math.min(100, rsi));

  const macdUp = t.macd ? t.macd.histogram > 0 : false;
  const price = t.price ?? null;
  const bb = t.bollinger ?? null;
  // Bollinger konumu — alt(0)..üst(100)
  let bbPos: number | null = null;
  if (bb && price != null && bb.upper > bb.lower) {
    bbPos = Math.max(0, Math.min(100, ((price - bb.lower) / (bb.upper - bb.lower)) * 100));
  }
  const ema20 = t.ema?.ema20 ?? null;
  const ema50 = t.ema?.ema50 ?? null;
  const trendUp = ema20 != null && ema50 != null ? ema20 > ema50 : null;

  return (
    <div className="max-w-md rounded-3xl border border-white/[0.1] bg-white/[0.04] p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide text-white/40">Teknik analiz · {t.symbol}</p>
        {price != null && <p className="text-sm font-semibold text-white tabular-nums">{fmtUsd(price)}</p>}
      </div>

      {/* RSI — renkli bar */}
      <div className="mt-3 rounded-xl bg-white/[0.04] px-3 py-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-white/50">RSI (14)</span>
          <span className="font-semibold tabular-nums" style={{ color: rsiColor }}>
            {fmt(rsi, 1)} {rsiLabel && <span className="font-normal text-white/40">· {rsiLabel}</span>}
          </span>
        </div>
        <div className="relative mt-2 h-1.5 rounded-full bg-white/10">
          <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${rsiPct}%`, background: rsiColor }} />
        </div>
      </div>

      {/* Gösterge ızgarası */}
      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-xl bg-white/[0.04] px-3 py-2.5">
          <p className="text-white/45">MACD</p>
          <p className="mt-1 font-semibold tabular-nums" style={{ color: macdUp ? UP : DOWN }}>
            {macdUp ? "▲" : "▼"} {fmt(t.macd?.histogram, 3)}
          </p>
          <p className="mt-0.5 text-[11px] text-white/35 tabular-nums">
            MACD {fmt(t.macd?.macd, 2)} · sinyal {fmt(t.macd?.signal, 2)}
          </p>
        </div>

        <div className="rounded-xl bg-white/[0.04] px-3 py-2.5">
          <p className="text-white/45">Bollinger</p>
          <p className="mt-1 font-semibold text-white tabular-nums">
            {bbPos == null ? "—" : bbPos >= 80 ? "Üst bant" : bbPos <= 20 ? "Alt bant" : "Orta"}
          </p>
          {bbPos != null && (
            <div className="relative mt-1.5 h-1 rounded-full bg-white/10">
              <div
                className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{ left: `${bbPos}%`, background: NEUTRAL }}
              />
            </div>
          )}
        </div>

        <div className="rounded-xl bg-white/[0.04] px-3 py-2.5">
          <p className="text-white/45">ATR (14)</p>
          <p className="mt-1 font-semibold text-white tabular-nums">{fmt(t.atr, 2)}</p>
          <p className="mt-0.5 text-[11px] text-white/35">Volatilite</p>
        </div>

        <div className="rounded-xl bg-white/[0.04] px-3 py-2.5">
          <p className="text-white/45">EMA 20 / 50</p>
          <p className="mt-1 font-semibold tabular-nums" style={{ color: trendUp == null ? "#fff" : trendUp ? UP : DOWN }}>
            {fmt(ema20)} / {fmt(ema50)}
          </p>
          <p className="mt-0.5 text-[11px] text-white/35">
            {trendUp == null ? "—" : trendUp ? "Yükseliş dizilimi" : "Düşüş dizilimi"}
          </p>
        </div>
      </div>

      {t.read && t.read.length > 0 && (
        <ul className="mt-3 space-y-1">
          {t.read.map((r, i) => (
            <li key={i} className="flex gap-2 text-[12px] text-white/55">
              <span className="text-white/30">•</span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
