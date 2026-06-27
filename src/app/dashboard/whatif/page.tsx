"use client";

/**
 * Finovela What-If Stüdyosu — Monte Carlo gelecek projeksiyonu.
 * Tasarım dili: Didit (business.didit.me) — açık tema, kutusuz, border-t ayraçlı
 * bölümler, ızgara-ayraçlı metrik şeridi, token renkleri (beyaz-sabit YOK).
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { Topbar } from "@/components/dashboard/topbar";
import { useLivePortfolio } from "@/lib/dashboard/use-portfolio";
import { ChartFrame } from "@/components/dashboard/chart-frame";
import { runMonteCarlo, type WhatIfResult } from "@/lib/dashboard/whatif";
import { TrendingUp, TrendingDown, Minus, FlaskConical, Check, ChevronRight } from "lucide-react";

// Didit açık-tema renkleri — beyaz zeminde okunur.
const ACCENT = "var(--ais-accent)";
const UP = "var(--ais-green)";
const DOWN = "#d93025";
// SVG gradient/stop için ham hex (CSS var SVG defs'te her tarayıcıda güvenli değil).
const UP_HEX = "#1f9d57";
const DOWN_HEX = "#d93025";
const ACCENT_HEX = "#2567ff";

const HORIZONS = [
  { label: "1 Ay", days: 30 },
  { label: "3 Ay", days: 90 },
  { label: "6 Ay", days: 180 },
  { label: "1 Yıl", days: 365 },
  { label: "3 Yıl", days: 365 * 3 },
];

// Her profil ayrı tona sahip (madde 7): Temkinli=yeşil, Dengeli=mavi, Agresif=kırmızı.
const PROFILES = [
  { label: "Temkinli", ret: 6, vol: 10, color: "var(--ais-green)", bg: "var(--ais-green-bg)" },
  { label: "Dengeli", ret: 9, vol: 18, color: "var(--ais-accent)", bg: "var(--ais-accent-bg)" },
  { label: "Agresif", ret: 16, vol: 32, color: "#d93025", bg: "rgba(217,48,37,0.10)" },
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
      <div className="ais ais-light min-h-[calc(100vh-64px)]">
        <div className="mx-auto max-w-5xl px-8 py-10">
          {/* ───────── Başlık ───────── */}
          <div>
            <h1 className="d-title">Karar vermeden önce geleceği oyna</h1>
            <p className="d-subtitle mt-2 max-w-2xl leading-relaxed">
              Binlerce olası senaryo simüle edilir — iyimser, baz ve kötümser sonuçları olasılıklarıyla
              gör. &quot;Bu parayı koyarsam bir yıl sonra nerede olurum?&quot;
            </p>
          </div>

          {/* ───────── Senaryo kur ───────── */}
          <section className="mt-9 border-t pt-8" style={{ borderColor: "var(--ais-line)" }}>
            <h2 className="d-section mb-5">Senaryo kur</h2>

            <div className="space-y-6">
              {/* başlangıç tutarı */}
              <div>
                <label className="mb-2 block text-[13px] text-[var(--ais-fg-muted)]">Başlangıç tutarı</label>
                <div
                  className="flex items-center gap-2 rounded-xl border px-3.5 transition focus-within:border-[var(--ais-accent)] focus-within:ring-2 focus-within:ring-[var(--ais-accent)]/15"
                  style={{ borderColor: "var(--ais-line-strong)", background: "var(--ais-surface)" }}
                >
                  <span className="text-[14px] text-[var(--ais-fg-faint)]">$</span>
                  <input
                    value={start}
                    onChange={(e) => setStart(e.target.value.replace(/[^0-9.]/g, ""))}
                    inputMode="decimal"
                    placeholder={String(Math.round(summary.total) || 10000)}
                    className="num h-11 w-full bg-transparent text-[15px] font-medium text-[var(--ais-fg)] placeholder:font-normal placeholder:text-[var(--ais-fg-faint)] focus:outline-none"
                  />
                  <button
                    onClick={() => setStart(String(Math.round(summary.total)))}
                    className="shrink-0 rounded-full border px-3 py-1 text-[11.5px] font-medium text-[var(--ais-fg-muted)] transition hover:text-[var(--ais-fg)]"
                    style={{ borderColor: "var(--ais-line-strong)" }}
                  >
                    Portföyüm
                  </button>
                </div>
              </div>

              {/* süre */}
              <div>
                <label className="mb-2 block text-[13px] text-[var(--ais-fg-muted)]">Süre</label>
                <Toggle
                  value={String(days)}
                  onChange={(v) => setDays(Number(v))}
                  options={HORIZONS.map((h) => ({ value: String(h.days), label: h.label }))}
                />
              </div>

              {/* risk profili */}
              <div>
                <label className="mb-2 block text-[13px] text-[var(--ais-fg-muted)]">
                  Risk profili <span className="text-[var(--ais-fg-faint)]">— beklenen getiri / oynaklık</span>
                </label>
                <div className="grid gap-2.5 sm:grid-cols-3">
                  {PROFILES.map((p, i) => {
                    const on = profileIdx === i;
                    return (
                      <button
                        key={p.label}
                        onClick={() => setProfileIdx(i)}
                        className="relative rounded-xl border p-4 text-left transition"
                        style={{
                          borderColor: on ? p.color : "var(--ais-line)",
                          background: on ? p.bg : "var(--ais-surface)",
                          boxShadow: on ? `0 0 0 1px ${p.color}` : "none",
                        }}
                      >
                        {on && (
                          <span
                            className="absolute right-3 top-3 grid h-5 w-5 place-items-center rounded-full"
                            style={{ background: p.color, color: "#fff" }}
                          >
                            <Check size={12} strokeWidth={2.5} />
                          </span>
                        )}
                        <p className="text-[13.5px] font-medium text-[var(--ais-fg)]">{p.label}</p>
                        <p className="num mt-1 text-[11.5px] text-[var(--ais-fg-muted)]">
                          ~%{p.ret}/yıl · oynaklık %{p.vol}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* ───────── Olası gelecekler ───────── */}
          <section className="mt-10 border-t pt-8" style={{ borderColor: "var(--ais-line)" }}>
            <h2 className="d-section mb-1">Olası gelecekler</h2>
            <p className="mb-5 text-[12.5px] text-[var(--ais-fg-muted)]">
              İyimser, baz ve kötümser yörüngeler — belirsizlik konisiyle.
            </p>

            <ChartFrame
              light
              title="Olası gelecekler"
              render={(big) => <ScenarioChart result={result} fullscreen={big} />}
            />

            <div className="mt-5 grid gap-2.5 sm:grid-cols-3">
              {result.scenarios.map((s) => {
                const tone = s.label === "İyimser" ? UP : s.label === "Kötümser" ? DOWN : ACCENT;
                const Icon = s.label === "İyimser" ? TrendingUp : s.label === "Kötümser" ? TrendingDown : Minus;
                return (
                  <div
                    key={s.label}
                    className="rounded-xl border p-4"
                    style={{ borderColor: "var(--ais-line)", background: "var(--ais-surface)" }}
                  >
                    <div className="flex items-center gap-1.5" style={{ color: tone }}>
                      <Icon size={15} />
                      <span className="text-[13px] font-medium">{s.label}</span>
                    </div>
                    <p className="num mt-2 text-[19px] font-semibold text-[var(--ais-fg)]">{usd(s.endValue)}</p>
                    <p className="num text-[13px]" style={{ color: tone }}>
                      {s.returnPct >= 0 ? "+" : ""}
                      {s.returnPct}%
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ───────── Olasılık dağılımı ───────── */}
          <section className="mt-10 border-t pt-8" style={{ borderColor: "var(--ais-line)" }}>
            <h2 className="d-section mb-5">Olasılık dağılımı</h2>

            {/* özet — kutusuz ızgara-ayraçlı şerit */}
            <div
              className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border lg:grid-cols-4"
              style={{ borderColor: "var(--ais-line)", background: "var(--ais-line)" }}
            >
              <Stat label="Kâr olasılığı" value={`%${result.probGain}`} color={UP} />
              <Stat label="Zarar olasılığı" value={`%${result.probLoss}`} color={DOWN} />
              <Stat label="Medyan sonuç" value={usd(result.p50)} />
              <Stat label="Ortalama sonuç" value={usd(result.mean)} />
            </div>

            {/* yüzdelik dağılım */}
            <div className="mt-6">
              <h3 className="d-label mb-3">Yüzdelik dağılım</h3>
              <div
                className="space-y-2.5 rounded-xl border p-5"
                style={{ borderColor: "var(--ais-line)", background: "var(--ais-surface)" }}
              >
                <PercentileBar label="En kötü %5" value={result.p5} start={startValue} />
                <PercentileBar label="Alt çeyrek (%25)" value={result.p25} start={startValue} />
                <PercentileBar label="Medyan (%50)" value={result.p50} start={startValue} />
                <PercentileBar label="Üst çeyrek (%75)" value={result.p75} start={startValue} />
                <PercentileBar label="En iyi %5" value={result.p95} start={startValue} />
              </div>
              <p className="num mt-3 text-[11px] text-[var(--ais-fg-faint)]">
                {result.paths.toLocaleString("en-US")} simüle edilmiş yol · geometrik Brownian hareketi.
                Varsayım tabanlı projeksiyon, garanti değildir.
              </p>
            </div>
          </section>

          {/* ───────── AI ile derinleştir (Didit soft mavi bant) ───────── */}
          <Link
            href="/dashboard/chat"
            className="mt-8 flex items-center justify-between gap-3 rounded-xl px-5 py-4 transition hover:brightness-[0.99]"
            style={{ background: "var(--ais-accent-bg)" }}
          >
            <div className="flex items-center gap-3">
              <span
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg"
                style={{ background: "rgba(37,103,255,0.14)", color: ACCENT }}
              >
                <FlaskConical size={17} />
              </span>
              <div>
                <p className="text-[13.5px] font-medium text-[var(--ais-fg)]">Finovela ile derinleştir</p>
                <p className="text-[12.5px] text-[var(--ais-fg-muted)]">
                  &quot;{usd(startValue)} ile {HORIZONS.find((h) => h.days === days)?.label ?? `${days} gün`} sonra ne
                  olur?&quot; diye sor — Finovela canlı veriyle simüle etsin.
                </p>
              </div>
            </div>
            <span className="flex shrink-0 items-center gap-1 text-[12.5px] font-medium" style={{ color: ACCENT }}>
              Sohbet&apos;e git <ChevronRight size={14} />
            </span>
          </Link>
        </div>
      </div>
    </>
  );
}

/* ── Didit segment toggle (seçili = mavi-soft) ── */
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
      className="flex w-full gap-1 rounded-full border p-1"
      style={{ borderColor: "var(--ais-line)", background: "var(--ais-surface)" }}
    >
      {options.map((o) => {
        const on = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className="flex-1 rounded-full px-3 py-1.5 text-[12.5px] font-medium transition-colors"
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

/* ── Üst metrik (kutusuz ızgara şeridi — Didit Usage) ── */
function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-[var(--ais-surface)] px-5 py-4">
      <p className="text-[11.5px] text-[var(--ais-fg-faint)]">{label}</p>
      <p className="num mt-2 text-[19px] font-medium tracking-tight" style={{ color: color ?? "var(--ais-fg)" }}>
        {value}
      </p>
    </div>
  );
}

/* ── Senaryo grafiği — Didit sadeliği: ince çizgi, ince yatay grid,
      LOG ölçek (milyar↔$10 farkı ezilmesin), hafif dolgu, glow yok. ── */
function ScenarioChart({ result, fullscreen }: { result: WhatIfResult; fullscreen?: boolean }) {
  const w = 800;
  const h = 280;
  const padT = 18;
  const padB = 30;
  const padX = 12;
  const plotH = h - padT - padB;
  const plotW = w - padX * 2;

  const curves = result.scenarios;
  const opt = curves.find((c) => c.label === "İyimser")?.curve ?? [];
  const base = curves.find((c) => c.label === "Baz")?.curve ?? [];

  // Lineer ölçek — organik path'ler artık kavisli (düz değil). Aralığı veriye göre
  // sıkıştır; küçük tabanda alt sınırı 0'a değil min değere yakın tut (kötümser de görünsün).
  const all = curves.flatMap((c) => c.curve).filter((v) => Number.isFinite(v));
  const dataMin = Math.min(...all);
  const dataMax = Math.max(...all);
  const span = dataMax - dataMin || 1;
  const min = dataMin - span * 0.08;
  const max = dataMax + span * 0.08;
  const range = max - min || 1;

  const n = base.length || opt.length || 1;
  const x = (i: number) => padX + (i / Math.max(1, n - 1)) * plotW;
  const y = (v: number) => padT + plotH - ((v - min) / range) * plotH;

  const colorFor = (label: string) =>
    label === "İyimser" ? UP_HEX : label === "Kötümser" ? DOWN_HEX : ACCENT_HEX;

  // Yumuşak (Catmull-Rom → bezier) eğri — Didit'in organik grafiği gibi.
  const smoothPath = (curve: number[]): string => {
    const pts = curve.map((v, i) => [x(i), y(v)] as [number, number]);
    if (pts.length < 2) return "";
    let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i === 0 ? 0 : i - 1];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2 < pts.length ? i + 2 : i + 1];
      const c1x = p1[0] + (p2[0] - p0[0]) / 6;
      const c1y = p1[1] + (p2[1] - p0[1]) / 6;
      const c2x = p2[0] - (p3[0] - p1[0]) / 6;
      const c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
    }
    return d;
  };
  const linePath = smoothPath;

  // İnce yatay grid (Didit Dashboard "Volume" gibi 5 çizgi).
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((t) => padT + plotH * t);

  const endPts = curves
    .map((c) => ({
      label: c.label,
      cx: x((c.curve.length || 1) - 1),
      cy: y(c.curve[c.curve.length - 1] ?? 1),
      color: colorFor(c.label),
    }))
    .filter((p) => Number.isFinite(p.cy));

  return (
    <div
      className="overflow-hidden rounded-xl border p-4"
      style={{ borderColor: "var(--ais-line)", background: "var(--ais-surface)" }}
    >
      <svg
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
        className={`${fullscreen ? "h-[460px]" : "h-64"} w-full overflow-visible`}
      >
        <defs>
          {/* hafif tek-renk dolgu — sadece baz çizgisinin altı (Didit: çok hafif) */}
          <linearGradient id="wf-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={ACCENT_HEX} stopOpacity="0.1" />
            <stop offset="100%" stopColor={ACCENT_HEX} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* İnce yatay grid çizgileri */}
        {gridLines.map((gy, i) => (
          <line
            key={i}
            x1={padX}
            y1={gy}
            x2={w - padX}
            y2={gy}
            stroke="var(--ais-line)"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        ))}

        {/* Baz çizgisinin altına çok hafif dolgu (tek vurgu) */}
        {base.length > 0 && (
          <path
            d={`${linePath(base)} L${x(base.length - 1).toFixed(1)},${(padT + plotH).toFixed(1)} L${x(0).toFixed(1)},${(padT + plotH).toFixed(1)} Z`}
            fill="url(#wf-fill)"
          />
        )}

        {/* Senaryo çizgileri — ince, glow yok, dolgu yok */}
        {curves.map((c) => (
          <path
            key={c.label}
            d={linePath(c.curve)}
            fill="none"
            stroke={colorFor(c.label)}
            strokeWidth={c.label === "Baz" ? 2 : 1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            opacity={c.label === "Baz" ? 1 : 0.85}
          />
        ))}

        {/* Uç noktalar — küçük, içi boş (Didit) */}
        {endPts.map((p) => (
          <circle
            key={p.label}
            cx={p.cx}
            cy={p.cy}
            r={3.5}
            fill="var(--ais-surface)"
            stroke={p.color}
            strokeWidth={2}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>

      {/* Lejant */}
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 px-1">
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

/* ── Yüzdelik bar — Didit açık tema (token zemin) ── */
function PercentileBar({ label, value, start }: { label: string; value: number; start: number }) {
  const change = ((value - start) / start) * 100;
  const positive = change >= 0;
  // -50%..+150% aralığını 0..100'e eşle.
  const pct = Math.max(4, Math.min(100, ((change + 50) / 200) * 100));
  return (
    <div className="flex items-center gap-3">
      <span className="w-32 shrink-0 text-[12px] text-[var(--ais-fg-muted)]">{label}</span>
      <div className="relative h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: "var(--ais-surface-2)" }}>
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: positive ? UP : DOWN }}
        />
      </div>
      <span className="num w-24 shrink-0 text-right text-[12px] text-[var(--ais-fg-muted)]">
        ${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}
      </span>
      <span
        className="num w-14 shrink-0 text-right text-[12px] font-medium"
        style={{ color: positive ? UP : DOWN }}
      >
        {positive ? "+" : ""}
        {change.toFixed(0)}%
      </span>
    </div>
  );
}
