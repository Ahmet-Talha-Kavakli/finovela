"use client";

/**
 * Finovela Strateji Oluşturucu — doğal dil → gerçek backtest → canlı devreye al.
 * "Backtest" butonu strateji metnindeki ima edilen holding'ler için candles
 * çekip GERÇEK backtest çalıştırır. "Deploy" kalıcı otomasyon oluşturur.
 * Tasarım dili: Didit (business.didit.me) — açık tema, kutusuz, border-t ayraçlı
 * bölümler, token renkleri (beyaz-sabit YOK). İşlevsellik AYNEN korunur.
 */

import { useState } from "react";
import { Topbar } from "@/components/dashboard/topbar";
import { ChartFrame } from "@/components/dashboard/chart-frame";
import { STRATEGY_TEMPLATES, getEquityCurve } from "@/lib/dashboard/data";
import {
  buildPortfolio,
  type BuildResult,
} from "@/lib/dashboard/generated-assets";
import {
  runBacktest,
  type BacktestResult,
  type EquityPoint,
  type PriceHistories,
} from "@/lib/dashboard/backtest";
import { useAutomations } from "@/lib/dashboard/use-automations";
import { notifStore } from "@/lib/dashboard/use-notifications";
import { decisionStore } from "@/lib/dashboard/use-decisions";
import { brainStore } from "@/lib/dashboard/use-brain";
import { PlanGate } from "@/components/dashboard/plan-gate";
import { Sparkles, Play, Layers, Check } from "lucide-react";

// Didit açık-tema renkleri — beyaz zeminde okunur.
const ACCENT = "var(--ais-accent)";
const UP = "var(--ais-green)";
const DOWN = "#d93025";
// SVG defs/stroke için ham hex (CSS var SVG defs'te her tarayıcıda güvenli değil).
const ACCENT_HEX = "#2567ff";
const DOWN_HEX = "#d93025";

type Candle = { time: number; close: number };

const PLACEHOLDER_CURVE = getEquityCurve(80);

async function fetchCloses(symbol: string): Promise<number[]> {
  const to = Math.floor(Date.now() / 1000);
  const from = to - 60 * 60 * 24 * 365;
  try {
    const res = await fetch(
      `/api/market/candles?symbol=${encodeURIComponent(symbol)}&resolution=D&from=${from}&to=${to}`,
    );
    const data = (await res.json()) as { candles?: Candle[] };
    return (data.candles ?? []).map((c) => c.close).filter((n) => Number.isFinite(n));
  } catch {
    return [];
  }
}

export default function StrategyPage() {
  const automations = useAutomations();
  const [rule, setRule] = useState(
    "En güçlü momentum sektörlerini tut, aylık rotasyon yap, en fazla 8 pozisyon",
  );
  const [running, setRunning] = useState(false);
  const [built, setBuilt] = useState<BuildResult | null>(null);
  const [backtest, setBacktest] = useState<BacktestResult | null>(null);
  const [deployed, setDeployed] = useState(false);

  async function handleBacktest(text: string) {
    const t = text.trim();
    if (!t) return;
    setRunning(true);
    setDeployed(false);

    // Strateji metnindeki ima edilen holding'leri çıkar.
    const portfolio = buildPortfolio(t);
    setBuilt(portfolio);

    const syms = Object.keys(portfolio.weights);
    const [closesArr, spyCloses] = await Promise.all([
      Promise.all(syms.map((s) => fetchCloses(s))),
      fetchCloses("SPY"),
    ]);
    const histories: PriceHistories = {};
    syms.forEach((s, i) => {
      histories[s] = closesArr[i];
    });

    setBacktest(runBacktest(portfolio.weights, histories, spyCloses));
    setRunning(false);
  }

  function handleDeploy() {
    const name = built?.name ? `${built.name} stratejisi` : "Özel strateji";
    automations.create(rule, name);
    setDeployed(true);
    notifStore.push("info", `Strateji canlı olarak devreye alındı: ${name}`);
    // Karar defterine işle (Brain şeffaflık).
    decisionStore.log({
      kind: "insight",
      action: `Strateji otomasyona alındı: ${name}`,
      rationale: m
        ? `Backtest: CAGR %${m.cagr.toFixed(1)}, maks. düşüş %${m.maxDrawdown.toFixed(1)}, Sharpe ${m.sharpe.toFixed(2)} (SPY: %${m.benchTotalReturn.toFixed(1)}). Kural: "${rule}"`
        : `Kural: "${rule}"`,
      authority: brainStore.get().authority,
      executed: true,
      snapshot: m ? { metrics: m } : undefined,
    });
  }

  const m = backtest?.metrics;

  // Sonuç metrikleri — gerçek backtest varsa onu, yoksa şablon değerlerini göster.
  const results: [string, string, string][] = m
    ? [
        ["Yıllıklandırılmış getiri", `${m.cagr >= 0 ? "+" : ""}${m.cagr.toFixed(1)}%`, m.cagr >= 0 ? UP : DOWN],
        ["Maks. düşüş", `${m.maxDrawdown.toFixed(1)}%`, DOWN],
        ["Sharpe oranı", m.sharpe.toFixed(2), "var(--ais-fg)"],
        ["Kazanma oranı", `${m.winRate.toFixed(0)}%`, "var(--ais-fg)"],
        ["Volatilite", `${m.volatility.toFixed(1)}%`, "var(--ais-fg)"],
      ]
    : [
        ["Yıllıklandırılmış getiri", "+24.1%", UP],
        ["Maks. düşüş", "-18.4%", DOWN],
        ["Sharpe oranı", "1.32", "var(--ais-fg)"],
        ["Kazanma oranı", "63%", "var(--ais-fg)"],
        ["Volatilite", "16.2%", "var(--ais-fg)"],
      ];

  return (
    <>
      <Topbar title="Strateji Oluşturucu" />
      <PlanGate feature="strategyBuilder">
      <div className="ais ais-light min-h-[calc(100vh-64px)]">
        <div className="mx-auto max-w-5xl px-8 py-10">
          {/* ───────── Başlık ───────── */}
          <div>
            <h1 className="d-title">Strateji Oluşturucu</h1>
            <p className="d-subtitle mt-2 max-w-2xl leading-relaxed">
              Doğal dille bir strateji tanımla, gerçek verilerle geriye dönük test et, beğenirsen
              canlı devreye al.
            </p>
          </div>

          {/* ───────── Bir strateji tanımlayın ───────── */}
          <section className="mt-9 border-t pt-8" style={{ borderColor: "var(--ais-line)" }}>
            <div className="mb-5">
              <h2 className="d-section">Bir strateji tanımlayın</h2>
              <p className="mt-1 text-[12.5px] text-[var(--ais-fg-muted)]">
                Ne yapmasını istersin? Sade bir cümleyle anlat — Finovela varlıkları çıkarsın.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg"
                style={{ background: "var(--ais-accent-bg)", color: ACCENT }}
              >
                <Sparkles size={16} />
              </span>
              <input
                value={rule}
                onChange={(e) => setRule(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleBacktest(rule)}
                className="ais-input flex-1"
              />
              <button
                onClick={() => handleBacktest(rule)}
                disabled={running}
                className="flex h-11 shrink-0 items-center gap-1.5 rounded-full px-5 text-[13px] font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-50"
                style={{ background: ACCENT }}
              >
                <Play size={14} />
                {running ? "Çalışıyor…" : "Geriye dönük test"}
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {["Momentum", "Ortalamaya dönüş", "Temettü büyümesi", "Sektör rotasyonu", "Maliyet ortalaması"].map((c) => (
                <button
                  key={c}
                  onClick={() => setRule(c)}
                  className="rounded-full border px-3 py-1 text-[12px] text-[var(--ais-fg-muted)] transition hover:text-[var(--ais-fg)]"
                  style={{ borderColor: "var(--ais-line-strong)" }}
                >
                  {c}
                </button>
              ))}
            </div>
          </section>

          {/* ───────── Geriye dönük test ───────── */}
          <section className="mt-10 border-t pt-8" style={{ borderColor: "var(--ais-line)" }}>
            <div className="mb-5">
              <h2 className="d-section">Geriye dönük test</h2>
              <p className="mt-1 text-[12.5px] text-[var(--ais-fg-muted)]">
                Stratejinin geçmiş verideki performansı.
              </p>
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
              {/* sermaye eğrisi */}
              <div
                className="rounded-xl border p-5 lg:col-span-2"
                style={{ borderColor: "var(--ais-line)", background: "var(--ais-surface)" }}
              >
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="d-label">Sermaye eğrisi</h3>
                  <span className="text-[12px] text-[var(--ais-fg-faint)]">
                    {m ? `${m.days} işlem günü · SPY'ye karşı` : "Geriye dönük test çalıştırın"}
                  </span>
                </div>
                <ChartFrame
                  light
                  title="Sermaye eğrisi"
                  render={(big) =>
                    running ? (
                      <div
                        className="grid place-items-center text-[13px] text-[var(--ais-fg-muted)]"
                        style={{ height: big ? 440 : 260 }}
                      >
                        Geriye dönük test çalışıyor…
                      </div>
                    ) : backtest ? (
                      <EquityChart curve={backtest.curve} height={big ? 440 : 260} />
                    ) : (
                      <PlaceholderChart data={PLACEHOLDER_CURVE} height={big ? 440 : 260} />
                    )
                  }
                />
                {built && (
                  <p className="mt-4 text-[12px] text-[var(--ais-fg-muted)]">
                    İma edilen varlıklar: {Object.keys(built.weights).join(", ")}
                  </p>
                )}
              </div>

              {/* sonuçlar */}
              <div
                className="flex flex-col rounded-xl border p-5"
                style={{ borderColor: "var(--ais-line)", background: "var(--ais-surface)" }}
              >
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="d-label">Sonuçlar</h3>
                  <span className="text-[11px] text-[var(--ais-fg-faint)]">
                    {m ? "Gerçek backtest" : "Örnek değerler"}
                  </span>
                </div>

                {/* Öne çıkan iki metrik — kutusuz ızgara-ayraçlı şerit (Didit) */}
                <div
                  className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border"
                  style={{ borderColor: "var(--ais-line)", background: "var(--ais-line)" }}
                >
                  {results.slice(0, 2).map(([l, v, c]) => (
                    <div key={l} className="flex flex-col px-4 py-3.5" style={{ background: "var(--ais-surface)" }}>
                      {/* label 2 satıra kadar yer kaplar → iki kutudaki değerler aynı hizada başlar */}
                      <p className="min-h-[2.4em] text-[11.5px] leading-[1.2] text-[var(--ais-fg-faint)]">{l}</p>
                      <p
                        className="num mt-auto pt-1.5 text-[24px] font-medium leading-none tracking-tight"
                        style={{ color: c }}
                      >
                        {v}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Kalan metrikler — hizalı ayraçlı liste */}
                <div className="mt-4">
                  {results.slice(2).map(([l, v, c], i) => (
                    <div
                      key={l}
                      className="flex items-center justify-between py-2.5"
                      style={{ borderTop: i === 0 ? "none" : "1px solid var(--ais-line)" }}
                    >
                      <span className="text-[13px] text-[var(--ais-fg-muted)]">{l}</span>
                      <span className="num text-[15px] font-medium" style={{ color: c }}>
                        {v}
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleDeploy}
                  className="mt-auto flex w-full items-center justify-center gap-1.5 rounded-full py-2.5 text-[13px] font-medium text-white transition !mt-5"
                  style={{ background: deployed ? UP : ACCENT }}
                >
                  {deployed ? (
                    <>
                      <Check size={15} /> Canlı devrede
                    </>
                  ) : (
                    "Stratejiyi canlı devreye al"
                  )}
                </button>
              </div>
            </div>
          </section>

          {/* ───────── Bir şablonla başlayın ───────── */}
          <section className="mt-10 border-t pt-8" style={{ borderColor: "var(--ais-line)" }}>
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h2 className="d-section">Bir şablonla başlayın</h2>
                <p className="mt-1 text-[12.5px] text-[var(--ais-fg-muted)]">
                  Hazır bir stratejiyi seç — anında backtest çalışır.
                </p>
              </div>
              <Layers size={16} className="mt-1 shrink-0" style={{ color: "var(--ais-fg-faint)" }} />
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {STRATEGY_TEMPLATES.map((t) => (
                <button
                  key={t.name}
                  onClick={() => {
                    setRule(t.desc);
                    handleBacktest(`${t.name} — ${t.desc}`);
                  }}
                  className="group relative flex flex-col overflow-hidden rounded-xl border p-5 text-left transition hover:bg-[var(--ais-surface-2)]"
                  style={{ borderColor: "var(--ais-line)", background: "var(--ais-surface)" }}
                >
                  {/* Üst aksan çubuğu — hover'da belirir */}
                  <span
                    className="absolute inset-x-0 top-0 h-[2px] origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100"
                    style={{ background: ACCENT }}
                  />
                  <h3 className="text-[14px] font-medium text-[var(--ais-fg)]">{t.name}</h3>
                  <p className="mt-1.5 line-clamp-3 flex-1 text-[12px] leading-relaxed text-[var(--ais-fg-muted)]">
                    {t.desc}
                  </p>
                  <div className="mt-4 flex items-center gap-2">
                    <span
                      className="num rounded-md px-2 py-1 text-[12px] font-medium"
                      style={{ background: "var(--ais-green-bg)", color: UP }}
                    >
                      {t.cagr}% CAGR
                    </span>
                    <span
                      className="num rounded-md border px-2 py-1 text-[12px] text-[var(--ais-fg-muted)]"
                      style={{ borderColor: "var(--ais-line-strong)" }}
                    >
                      Sharpe {t.sharpe}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
      </PlanGate>
    </>
  );
}

/* ── Sermaye eğrisi — Didit sadeliği: portföy + SPY benchmark, ince çizgi, token renk ── */
function EquityChart({ curve, height = 260 }: { curve: EquityPoint[]; height?: number }) {
  if (!curve || curve.length < 2) {
    return (
      <div
        className="grid place-items-center rounded-xl border text-[13px] text-[var(--ais-fg-muted)]"
        style={{ height, borderColor: "var(--ais-line)", background: "var(--ais-surface)" }}
      >
        Yeterli veri yok
      </div>
    );
  }

  const w = 800;
  const h = 280;
  const padT = 16;
  const padB = 24;
  const padX = 10;
  const plotH = h - padT - padB;
  const plotW = w - padX * 2;

  const port = curve.map((p) => p.v);
  const bench = curve.map((p) => p.b);
  const all = [...port, ...bench].filter((v) => Number.isFinite(v));
  const dataMin = Math.min(...all);
  const dataMax = Math.max(...all);
  const span = dataMax - dataMin || 1;
  const min = dataMin - span * 0.06;
  const max = dataMax + span * 0.06;
  const range = max - min || 1;

  const n = curve.length;
  const x = (i: number) => padX + (i / Math.max(1, n - 1)) * plotW;
  const y = (v: number) => padT + plotH - ((v - min) / range) * plotH;

  const portUp = port[port.length - 1] >= port[0];
  const portColor = portUp ? UP : DOWN;
  const portHex = portUp ? "#0f7d4a" : DOWN_HEX;

  const path = (vals: number[]) =>
    vals.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");

  const portPath = path(port);
  const benchPath = path(bench);
  const area = `${portPath} L${x(n - 1).toFixed(1)},${(padT + plotH).toFixed(1)} L${x(0).toFixed(1)},${(padT + plotH).toFixed(1)} Z`;

  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((t) => padT + plotH * t);

  return (
    <div
      className="overflow-hidden rounded-xl border p-4"
      style={{ borderColor: "var(--ais-line)", background: "var(--ais-surface)" }}
    >
      <svg
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
        style={{ height: height - 56 }}
        className="w-full overflow-visible"
      >
        <defs>
          <linearGradient id="eq-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={portHex} stopOpacity="0.12" />
            <stop offset="100%" stopColor={portHex} stopOpacity="0" />
          </linearGradient>
        </defs>

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

        <path d={area} fill="url(#eq-fill)" />

        {/* SPY benchmark — soluk kesik çizgi */}
        <path
          d={benchPath}
          fill="none"
          stroke="var(--ais-fg-faint)"
          strokeWidth={1.25}
          strokeDasharray="4 4"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          opacity={0.6}
        />

        {/* Portföy */}
        <path
          d={portPath}
          fill="none"
          stroke={portColor}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {/* Lejant */}
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 px-1">
        <span className="flex items-center gap-1.5 text-[12px] text-[var(--ais-fg-muted)]">
          <span className="h-2 w-2 rounded-full" style={{ background: portColor }} />
          Portföy
        </span>
        <span className="flex items-center gap-1.5 text-[12px] text-[var(--ais-fg-muted)]">
          <span className="h-2 w-4 rounded-full" style={{ background: "var(--ais-fg-faint)", opacity: 0.6 }} />
          SPY
        </span>
      </div>
    </div>
  );
}

/* ── Yer tutucu eğri — backtest öncesi örnek sermaye eğrisi (token renk) ── */
function PlaceholderChart({ data, height = 260 }: { data: { t: number; v: number }[]; height?: number }) {
  const w = 800;
  const h = 280;
  const padT = 16;
  const padB = 24;
  const padX = 10;
  const plotH = h - padT - padB;
  const plotW = w - padX * 2;

  const vs = data.map((d) => d.v);
  const min = Math.min(...vs);
  const max = Math.max(...vs);
  const range = max - min || 1;
  const n = data.length;
  const x = (i: number) => padX + (i / Math.max(1, n - 1)) * plotW;
  const y = (v: number) => padT + plotH - ((v - min) / range) * plotH;
  const line = data.map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(d.v).toFixed(1)}`).join(" ");
  const area = `${line} L${x(n - 1).toFixed(1)},${(padT + plotH).toFixed(1)} L${x(0).toFixed(1)},${(padT + plotH).toFixed(1)} Z`;

  return (
    <div
      className="overflow-hidden rounded-xl border p-4"
      style={{ borderColor: "var(--ais-line)", background: "var(--ais-surface)" }}
    >
      <svg
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
        style={{ height: height - 32 }}
        className="w-full"
      >
        <defs>
          <linearGradient id="ph-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={ACCENT_HEX} stopOpacity="0.1" />
            <stop offset="100%" stopColor={ACCENT_HEX} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#ph-fill)" />
        <path
          d={line}
          fill="none"
          stroke={ACCENT_HEX}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}
