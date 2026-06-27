"use client";

// Sohbet içi sentiment kartı — get_sentiment tool sonucu.
// Boğa/ayı ölçer + alt bileşenler (sosyal/haber/analist) + analist konsensüsü.

import { fmtUsd } from "@/lib/dashboard/data";

const UP = "#3ecf8e";
const DOWN = "#ff5c5c";
const NEUTRAL = "#8ab4f8";

type SentimentScore = {
  symbol: string;
  score: number; // -100..100
  label: "Bullish" | "Neutral" | "Bearish";
  social: number;
  news: number;
  analyst: number;
};
type AnalystConsensus = {
  symbol: string;
  buy: number;
  hold: number;
  sell: number;
  total: number;
  rating: "Strong Buy" | "Buy" | "Hold" | "Sell";
  target: number;
  upsidePct: number;
};

export type SentimentData = {
  symbol: string;
  sentiment: SentimentScore;
  analyst: AnalystConsensus;
};

const LABEL_TR: Record<SentimentScore["label"], string> = {
  Bullish: "Boğa",
  Neutral: "Nötr",
  Bearish: "Ayı",
};

function sentColor(score: number): string {
  if (score >= 20) return UP;
  if (score <= -20) return DOWN;
  return NEUTRAL;
}

function SubBar({ label, value }: { label: string; value: number }) {
  const c = value >= 60 ? UP : value >= 45 ? NEUTRAL : DOWN;
  return (
    <div>
      <div className="flex items-center justify-between text-[12px]">
        <span className="text-white/55">{label}</span>
        <span className="font-semibold tabular-nums" style={{ color: c }}>{value}</span>
      </div>
      <div className="relative mt-1 h-1.5 rounded-full bg-white/10">
        <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${value}%`, background: c }} />
      </div>
    </div>
  );
}

export function SentimentCard({ s }: { s: SentimentData }) {
  const { sentiment: se, analyst: a } = s;
  const color = sentColor(se.score);
  // -100..100 → 0..100 ölçer konumu
  const meterPos = Math.max(0, Math.min(100, (se.score + 100) / 2));
  const total = Math.max(1, a.total);

  return (
    <div className="max-w-md rounded-3xl border border-white/[0.1] bg-white/[0.04] p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide text-white/40">Piyasa duyarlılığı · {s.symbol}</p>
        <span className="text-sm font-semibold" style={{ color }}>{LABEL_TR[se.label]}</span>
      </div>

      {/* Ayı ↔ Boğa ölçer */}
      <div className="mt-3">
        <div className="relative h-2 overflow-hidden rounded-full" style={{ background: "linear-gradient(90deg,#ff5c5c33,#8ab4f833,#3ecf8e33)" }}>
          <div
            className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-[#0a0a0a]"
            style={{ left: `${meterPos}%`, background: color }}
          />
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-white/35">
          <span>Ayı</span>
          <span>Nötr</span>
          <span>Boğa</span>
        </div>
      </div>

      {/* Alt bileşenler */}
      <div className="mt-3 space-y-2">
        <SubBar label="Sosyal" value={se.social} />
        <SubBar label="Haber tonu" value={se.news} />
        <SubBar label="Analist" value={se.analyst} />
      </div>

      {/* Analist konsensüsü */}
      <div className="mt-3 rounded-xl bg-white/[0.04] px-3 py-2.5">
        <div className="flex items-center justify-between text-[12px]">
          <span className="text-white/55">Analist konsensüsü · {a.total} analist</span>
          <span className="font-semibold text-white">{a.rating}</span>
        </div>
        <div className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-white/10">
          <div style={{ width: `${(a.buy / total) * 100}%`, background: UP }} />
          <div style={{ width: `${(a.hold / total) * 100}%`, background: NEUTRAL }} />
          <div style={{ width: `${(a.sell / total) * 100}%`, background: DOWN }} />
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px]">
          <span className="tabular-nums" style={{ color: UP }}>Al {a.buy}</span>
          <span className="tabular-nums text-white/45">Tut {a.hold}</span>
          <span className="tabular-nums" style={{ color: DOWN }}>Sat {a.sell}</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-[12px]">
          <span className="text-white/45">Hedef fiyat</span>
          <span className="font-semibold text-white tabular-nums">
            {fmtUsd(a.target)}{" "}
            <span style={{ color: a.upsidePct >= 0 ? UP : DOWN }}>
              ({a.upsidePct >= 0 ? "+" : ""}{a.upsidePct}%)
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
