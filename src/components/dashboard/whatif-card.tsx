"use client";

// Sohbet içi What-If kartı — whatif_simulation tool sonucu (Monte Carlo).
// İyimser / baz / kötümser sonuçları stat döşemeleriyle + kâr/zarar olasılığı.

import { fmtUsd } from "@/lib/dashboard/data";

const UP = "#3ecf8e";
const DOWN = "#ff5c5c";
const NEUTRAL = "#8ab4f8";

type ScenarioBand = { label: string; endValue: number; returnPct: number; curve: number[] };

export type WhatIfData = {
  startValue: number;
  horizonDays: number;
  p5: number;
  p50: number;
  p95: number;
  mean: number;
  probGain: number;
  probLoss: number;
  scenarios: ScenarioBand[];
};

function bandColor(label: string): string {
  if (label === "İyimser") return UP;
  if (label === "Kötümser") return DOWN;
  return NEUTRAL;
}

export function WhatIfCard({ w }: { w: WhatIfData }) {
  const gain = Math.max(0, Math.min(100, w.probGain));
  return (
    <div className="max-w-md rounded-3xl border border-white/[0.1] bg-white/[0.04] p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide text-white/40">What-If senaryosu</p>
        <p className="text-[11px] text-white/40">{w.horizonDays} gün · {fmtUsd(w.startValue)}</p>
      </div>

      {/* Senaryo döşemeleri */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        {w.scenarios.map((sc) => {
          const c = bandColor(sc.label);
          const up = sc.returnPct >= 0;
          return (
            <div key={sc.label} className="rounded-xl bg-white/[0.04] px-3 py-2.5 text-center">
              <p className="text-[11px]" style={{ color: c }}>{sc.label}</p>
              <p className="mt-1 text-sm font-semibold text-white tabular-nums">{fmtUsd(sc.endValue)}</p>
              <p className="mt-0.5 text-[11px] font-medium tabular-nums" style={{ color: up ? UP : DOWN }}>
                {up ? "+" : ""}{sc.returnPct}%
              </p>
            </div>
          );
        })}
      </div>

      {/* Kâr olasılığı barı */}
      <div className="mt-3 rounded-xl bg-white/[0.04] px-3 py-2.5">
        <div className="flex items-center justify-between text-[12px]">
          <span className="font-medium" style={{ color: UP }}>Kâr %{w.probGain}</span>
          <span className="font-medium" style={{ color: DOWN }}>Zarar %{w.probLoss}</span>
        </div>
        <div className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-white/10">
          <div style={{ width: `${gain}%`, background: UP }} />
          <div style={{ width: `${100 - gain}%`, background: DOWN }} />
        </div>
        <p className="mt-2 text-[11px] text-white/40 tabular-nums">
          Medyan {fmtUsd(w.p50)} · ortalama {fmtUsd(w.mean)}
        </p>
      </div>
    </div>
  );
}
