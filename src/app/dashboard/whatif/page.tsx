"use client";

import { useMemo, useState } from "react";
import { Topbar } from "@/components/dashboard/topbar";
import {
  PageTitle,
  SectionCard,
  Card,
  Metric,
  Btn,
  IconChip,
  Segmented,
  AIS_ACCENT,
  AIS_UP,
  AIS_DOWN,
} from "@/components/dashboard/ais-kit";
import { useLivePortfolio } from "@/lib/dashboard/use-portfolio";
import { ChartFrame } from "@/components/dashboard/chart-frame";
import { runMonteCarlo, type WhatIfResult } from "@/lib/dashboard/whatif";
import { Flask, TrendUp, TrendDown, Minus, ChatCircleDots } from "@phosphor-icons/react";

const HORIZONS = [
  { label: "1 Ay", days: 30 },
  { label: "3 Ay", days: 90 },
  { label: "6 Ay", days: 180 },
  { label: "1 Yıl", days: 365 },
  { label: "3 Yıl", days: 365 * 3 },
];

const PROFILES = [
  { label: "Temkinli", ret: 6, vol: 10 },
  { label: "Dengeli", ret: 9, vol: 18 },
  { label: "Agresif", ret: 16, vol: 32 },
];

function usd(n: number) {
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export default function WhatIfPage() {
  const { summary } = useLivePortfolio();
  const [start, setStart] = useState("");
  const [days, setDays] = useState(365);
  const [profileIdx, setProfileIdx] = useState(1);

  const startValue = Number(start) || Math.round(summary.total) || 10000;
  const profile = PROFILES[profileIdx];

  const result: WhatIfResult = useMemo(
    () =>
      runMonteCarlo({
        startValue,
        horizonDays: days,
        annualReturn: profile.ret / 100,
        annualVol: profile.vol / 100,
        paths: 2000,
      }),
    [startValue, days, profile.ret, profile.vol],
  );

  return (
    <>
      <Topbar title="What-If Stüdyosu" />
      <div className="ais min-h-[calc(100vh-64px)]">
        <div className="max-w-7xl px-8 py-10">
          <PageTitle
            title="Karar vermeden önce geleceği oyna"
            desc="Binlerce olası senaryo simüle edilir — iyimser, baz ve kötümser sonuçları olasılıklarıyla gör. &quot;Bu parayı koyarsam 1 yıl sonra nerede olurum?&quot;"
          />

          {/* Girdiler */}
          <SectionCard label="Senaryo kur" className="mt-10">
            <div className="space-y-5">
              <div>
                <label className="mb-1.5 block text-[12px] font-medium text-[var(--ais-fg-muted)]">
                  Başlangıç tutarı
                </label>
                <div className="ais-input flex items-center gap-1">
                  <span className="text-[13px] text-[var(--ais-fg-faint)]">$</span>
                  <input
                    value={start}
                    onChange={(e) => setStart(e.target.value.replace(/[^0-9.]/g, ""))}
                    inputMode="decimal"
                    placeholder={String(Math.round(summary.total) || 10000)}
                    className="num w-full bg-transparent text-[13px] text-[var(--ais-fg)] placeholder:text-[var(--ais-fg-faint)] focus:outline-none"
                  />
                  <button
                    onClick={() => setStart(String(Math.round(summary.total)))}
                    className="shrink-0 rounded-md border border-[var(--ais-line-strong)] px-2.5 py-1 text-[11px] text-[var(--ais-fg-muted)] transition hover:text-[var(--ais-fg)]"
                  >
                    Portföyüm
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[12px] font-medium text-[var(--ais-fg-muted)]">Süre</label>
                <Segmented
                  full
                  value={String(days)}
                  onChange={(v) => setDays(Number(v))}
                  options={HORIZONS.map((h) => ({ value: String(h.days), label: h.label }))}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[12px] font-medium text-[var(--ais-fg-muted)]">
                  Risk profili (beklenen getiri / oynaklık)
                </label>
                <div className="flex gap-2">
                  {PROFILES.map((p, i) => {
                    const on = profileIdx === i;
                    return (
                      <button
                        key={p.label}
                        onClick={() => setProfileIdx(i)}
                        className={`flex-1 rounded-lg border p-3 text-left transition ${
                          on
                            ? "!border-[var(--ais-accent)]/50"
                            : "border-[var(--ais-line)] hover:border-[var(--ais-line-strong)]"
                        } ais-card`}
                      >
                        <p className="text-[13px] font-medium text-[var(--ais-fg)]">{p.label}</p>
                        <p className="num mt-0.5 text-[11px] text-[var(--ais-fg-muted)]">
                          ~%{p.ret}/yıl · oynaklık %{p.vol}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Senaryo grafiği */}
          <SectionCard label="Olası gelecekler" className="mt-3">
            <ChartFrame
              title="Olası gelecekler"
              render={(big) => <ScenarioChart result={result} fullscreen={big} />}
            />
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {result.scenarios.map((s) => {
                const tone = s.label === "İyimser" ? AIS_UP : s.label === "Kötümser" ? AIS_DOWN : AIS_ACCENT;
                const Icon = s.label === "İyimser" ? TrendUp : s.label === "Kötümser" ? TrendDown : Minus;
                return (
                  <div key={s.label} className="ais-card p-4">
                    <div className="flex items-center gap-2" style={{ color: tone }}>
                      <Icon size={15} weight="regular" />
                      <span className="text-[13px] font-medium">{s.label}</span>
                    </div>
                    <p className="num mt-2 text-[19px] font-medium text-[var(--ais-fg)]">
                      {usd(s.endValue)}
                    </p>
                    <p className="num text-[13px]" style={{ color: tone }}>
                      {s.returnPct >= 0 ? "+" : ""}
                      {s.returnPct}%
                    </p>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          {/* Olasılık özeti */}
          <SectionCard
            label="Olasılık dağılımı"
            className="mt-3"
            bodyClassName="grid grid-cols-2 gap-3 lg:grid-cols-4"
          >
            <Metric label="Kâr olasılığı" value={`%${result.probGain}`} color={AIS_UP} />
            <Metric label="Zarar olasılığı" value={`%${result.probLoss}`} color={AIS_DOWN} />
            <Metric label="Medyan sonuç" value={usd(result.p50)} />
            <Metric label="Ortalama sonuç" value={usd(result.mean)} />
          </SectionCard>
          <SectionCard label="Yüzdelik dağılım" className="mt-3">
            <div className="space-y-2">
              <PercentileBar label="En kötü %5" value={result.p5} start={startValue} />
              <PercentileBar label="Alt çeyrek (%25)" value={result.p25} start={startValue} />
              <PercentileBar label="Medyan (%50)" value={result.p50} start={startValue} />
              <PercentileBar label="Üst çeyrek (%75)" value={result.p75} start={startValue} />
              <PercentileBar label="En iyi %5" value={result.p95} start={startValue} />
            </div>
            <p className="num mt-3 text-[11px] text-[var(--ais-fg-faint)]">
              {result.paths.toLocaleString("en-US")} simüle edilmiş yol · geometrik Brownian hareketi.
              Geçmiş/varsayım tabanlı projeksiyon, garanti değildir.
            </p>
          </SectionCard>

          {/* AI ile derinleştir */}
          <Card className="mt-3 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <IconChip icon={Flask} color={AIS_ACCENT} size={36} />
              <div>
                <p className="text-[13.5px] font-medium text-[var(--ais-fg)]">Finovela ile derinleştir</p>
                <p className="text-[12.5px] text-[var(--ais-fg-muted)]">
                  &quot;{usd(startValue)} ile {HORIZONS.find((h) => h.days === days)?.label ?? `${days} gün`} sonra
                  ne olur?&quot; diye sor — Finovela canlı veriyle simüle etsin.
                </p>
              </div>
            </div>
            <Btn href="/dashboard/chat">
              <ChatCircleDots size={15} weight="regular" />
              Finovela Sohbet
            </Btn>
          </Card>
        </div>
      </div>
    </>
  );
}

function ScenarioChart({ result, fullscreen }: { result: WhatIfResult; fullscreen?: boolean }) {
  const w = 800;
  const h = 280;
  const padT = 16;
  const padB = 28;
  const padL = 8;
  const padR = 8;
  const plotH = h - padT - padB;
  const plotW = w - padL - padR;

  const curves = result.scenarios;
  const opt = curves.find((c) => c.label === "İyimser")?.curve ?? [];
  const base = curves.find((c) => c.label === "Baz")?.curve ?? [];
  const pes = curves.find((c) => c.label === "Kötümser")?.curve ?? [];

  const all = curves.flatMap((c) => c.curve);
  // Sıfır çizgisini de görünür kıl: alt sınırı başlangıç tutarına yakın tut.
  const dataMin = Math.min(...all);
  const dataMax = Math.max(...all);
  const pad = (dataMax - dataMin) * 0.08 || 1;
  const min = dataMin - pad;
  const max = dataMax + pad;
  const range = max - min || 1;

  const n = base.length || opt.length || 1;
  const x = (i: number) => padL + (i / Math.max(1, n - 1)) * plotW;
  const y = (v: number) => padT + plotH - ((v - min) / range) * plotH;

  const colorFor = (label: string) =>
    label === "İyimser" ? AIS_UP : label === "Kötümser" ? AIS_DOWN : AIS_ACCENT;

  const linePath = (curve: number[]) =>
    curve.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");

  // İki eğri arasını dolduran kapalı alan (fan/koni dilimi).
  const bandBetween = (upper: number[], lower: number[]) => {
    if (!upper.length || !lower.length) return "";
    const up = upper.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
    const down = lower
      .map((_, k) => {
        const i = lower.length - 1 - k;
        return `L${x(i).toFixed(1)},${y(lower[i]).toFixed(1)}`;
      })
      .join(" ");
    return `${up} ${down} Z`;
  };

  // Üst yarı: baz↔iyimser (yeşilimsi), alt yarı: kötümser↔baz (kırmızımsı).
  const upperBand = bandBetween(opt, base);
  const lowerBand = bandBetween(base, pes);

  // Yatay ızgara çizgileri (4 dilim).
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((t) => padT + plotH * t);

  // Son noktalar — uç değer işaretçileri.
  const endPts = curves
    .map((c) => ({
      label: c.label,
      cx: x((c.curve.length || 1) - 1),
      cy: y(c.curve[c.curve.length - 1] ?? min),
      color: colorFor(c.label),
    }))
    .filter((p) => Number.isFinite(p.cy));

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--ais-line)] bg-[var(--ais-surface-2)]/30 p-3">
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className={`${fullscreen ? "h-[460px]" : "h-64"} w-full overflow-visible`}>
        <defs>
          <linearGradient id="wf-up" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={AIS_UP} stopOpacity="0.28" />
            <stop offset="100%" stopColor={AIS_UP} stopOpacity="0.04" />
          </linearGradient>
          <linearGradient id="wf-down" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={AIS_DOWN} stopOpacity="0.05" />
            <stop offset="100%" stopColor={AIS_DOWN} stopOpacity="0.26" />
          </linearGradient>
        </defs>

        {/* Izgara */}
        {gridLines.map((gy, i) => (
          <line
            key={i}
            x1={padL}
            y1={gy}
            x2={w - padR}
            y2={gy}
            stroke="var(--ais-line)"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        ))}

        {/* Belirsizlik konisi: gölgeli alanlar */}
        {upperBand && <path d={upperBand} fill="url(#wf-up)" />}
        {lowerBand && <path d={lowerBand} fill="url(#wf-down)" />}

        {/* Senaryo çizgileri */}
        {curves.map((c) => (
          <path
            key={c.label}
            d={linePath(c.curve)}
            fill="none"
            stroke={colorFor(c.label)}
            strokeWidth={c.label === "Baz" ? 2.5 : 2}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={c.label === "Baz" ? "0" : "0"}
            vectorEffect="non-scaling-stroke"
            opacity={c.label === "Baz" ? 1 : 0.95}
          />
        ))}

        {/* Uç değer noktaları */}
        {endPts.map((p) => (
          <g key={p.label}>
            <circle cx={p.cx} cy={p.cy} r={4} fill="var(--ais-bg)" stroke={p.color} strokeWidth={2} vectorEffect="non-scaling-stroke" />
          </g>
        ))}
      </svg>

      {/* Lejant */}
      <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 px-1">
        {curves.map((c) => {
          const color = colorFor(c.label);
          return (
            <span key={c.label} className="flex items-center gap-1.5 text-[12px] text-[var(--ais-fg-muted)]">
              <span className="h-2 w-2 rounded-full" style={{ background: color }} />
              {c.label}
              <span className="num font-medium" style={{ color }}>
                {usd(c.endValue)}
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

function PercentileBar({
  label,
  value,
  start,
}: {
  label: string;
  value: number;
  start: number;
}) {
  const change = ((value - start) / start) * 100;
  const positive = change >= 0;
  // Bar genişliği: -50%..+150% aralığını 0..100'e eşle.
  const pct = Math.max(4, Math.min(100, ((change + 50) / 200) * 100));
  return (
    <div className="flex items-center gap-3">
      <span className="w-32 shrink-0 text-[12px] text-[var(--ais-fg-muted)]">{label}</span>
      <div className="relative h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${pct}%`, background: positive ? AIS_UP : AIS_DOWN }}
        />
      </div>
      <span className="num w-24 shrink-0 text-right text-[12px] text-[var(--ais-fg-muted)]">
        ${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}
      </span>
      <span
        className="num w-14 shrink-0 text-right text-[12px] font-medium"
        style={{ color: positive ? AIS_UP : AIS_DOWN }}
      >
        {positive ? "+" : ""}
        {change.toFixed(0)}%
      </span>
    </div>
  );
}
