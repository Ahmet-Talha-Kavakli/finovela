"use client";

// Vela — Strategy Builder. "Backtest" butonu artık strateji metnindeki ima
// edilen holding'ler için candles çekip GERÇEK backtest çalıştırır. "Deploy"
// butonu kalıcı bir otomasyon oluşturur. Mevcut mantık korunur, AI Studio kabuğu.

import { useState } from "react";
import { Topbar } from "@/components/dashboard/topbar";
import { AreaChart } from "@/components/dashboard/area-chart";
import { BacktestChart } from "@/components/dashboard/backtest-chart";
import { ChartFrame } from "@/components/dashboard/chart-frame";
import {
  PageTitle,
  SectionCard,
  Card,
  Btn,
  IconChip,
  AIS_ACCENT,
  AIS_UP,
  AIS_DOWN,
} from "@/components/dashboard/ais-kit";
import { STRATEGY_TEMPLATES, getEquityCurve } from "@/lib/dashboard/data";
import {
  buildPortfolio,
  type BuildResult,
} from "@/lib/dashboard/generated-assets";
import {
  runBacktest,
  type BacktestResult,
  type PriceHistories,
} from "@/lib/dashboard/backtest";
import { useAutomations } from "@/lib/dashboard/use-automations";
import { notifStore } from "@/lib/dashboard/use-notifications";
import { decisionStore } from "@/lib/dashboard/use-decisions";
import { brainStore } from "@/lib/dashboard/use-brain";
import { Sparkle, Play, StackSimple } from "@phosphor-icons/react";

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
        ["Yıllıklandırılmış getiri", `${m.cagr >= 0 ? "+" : ""}${m.cagr.toFixed(1)}%`, m.cagr >= 0 ? AIS_UP : AIS_DOWN],
        ["Maks. düşüş", `${m.maxDrawdown.toFixed(1)}%`, AIS_DOWN],
        ["Sharpe oranı", m.sharpe.toFixed(2), "var(--ais-fg)"],
        ["Kazanma oranı", `${m.winRate.toFixed(0)}%`, "var(--ais-fg)"],
        ["Volatilite", `${m.volatility.toFixed(1)}%`, "var(--ais-fg)"],
      ]
    : [
        ["Yıllıklandırılmış getiri", "+24.1%", AIS_UP],
        ["Maks. düşüş", "-18.4%", AIS_DOWN],
        ["Sharpe oranı", "1.32", "var(--ais-fg)"],
        ["Kazanma oranı", "63%", "var(--ais-fg)"],
        ["Volatilite", "16.2%", "var(--ais-fg)"],
      ];

  return (
    <>
      <Topbar title="Strateji Oluşturucu" />
      <div className="ais min-h-[calc(100vh-64px)]">
        <div className="max-w-7xl px-8 py-10">
          <PageTitle
            title="Strateji Oluşturucu"
            desc="Doğal dille bir strateji tanımla, gerçek verilerle geriye dönük test et, beğenirsen canlı devreye al."
          />

          {/* prompt builder */}
          <SectionCard label="Bir strateji tanımlayın" className="mt-10">
            <div className="flex items-center gap-2">
              <IconChip icon={Sparkle} color={AIS_ACCENT} size={32} />
              <h2 className="text-[14px] font-medium text-[var(--ais-fg)]">Ne yapmasını istersin?</h2>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <input
                value={rule}
                onChange={(e) => setRule(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleBacktest(rule)}
                className="ais-input flex-1"
              />
              <Btn variant="primary" onClick={() => handleBacktest(rule)} disabled={running} className="h-9 shrink-0 px-4">
                <Play size={14} weight="regular" />
                {running ? "Çalışıyor…" : "Geriye dönük test"}
              </Btn>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {["Momentum", "Ortalamaya dönüş", "Temettü büyümesi", "Sektör rotasyonu", "Maliyet ortalaması"].map((c) => (
                <button
                  key={c}
                  onClick={() => setRule(c)}
                  className="rounded-full border border-[var(--ais-line-strong)] px-3 py-1 text-[12px] text-[var(--ais-fg-muted)] transition hover:text-[var(--ais-fg)]"
                >
                  {c}
                </button>
              ))}
            </div>
          </SectionCard>

          {/* backtest sonucu */}
          <SectionCard label="Geriye dönük test" desc="Stratejinin geçmiş verideki performansı." className="mt-3" bodyClassName="grid gap-3 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-[13.5px] font-medium text-[var(--ais-fg)]">Sermaye eğrisi</h3>
                <span className="text-[12px] text-[var(--ais-fg-faint)]">
                  {m ? `${m.days} işlem günü · SPY'ye karşı` : "Geriye dönük test çalıştırın"}
                </span>
              </div>
              <ChartFrame
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
                    <BacktestChart curve={backtest.curve} height={big ? 440 : 260} />
                  ) : (
                    <div style={{ height: big ? 440 : 260 }}>
                      <AreaChart data={PLACEHOLDER_CURVE} positive />
                    </div>
                  )
                }
              />
              {built && (
                <p className="mt-4 text-[12px] text-[var(--ais-fg-muted)]">
                  İma edilen varlıklar: {Object.keys(built.weights).join(", ")}
                </p>
              )}
            </Card>
            <Card className="flex flex-col">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-[13.5px] font-medium text-[var(--ais-fg)]">Sonuçlar</h3>
                <span className="text-[11px] text-[var(--ais-fg-faint)]">
                  {m ? "Gerçek backtest" : "Örnek değerler"}
                </span>
              </div>

              {/* Öne çıkan iki metrik — büyük, renkli */}
              <div className="grid grid-cols-2 gap-3">
                {results.slice(0, 2).map(([l, v, c]) => (
                  <div key={l} className="ais-card p-3.5">
                    <p className="text-[11.5px] text-[var(--ais-fg-faint)]">{l}</p>
                    <p className="num mt-1.5 text-[24px] font-medium leading-none tracking-tight" style={{ color: c }}>
                      {v}
                    </p>
                  </div>
                ))}
              </div>

              {/* Kalan metrikler — sade satırlar */}
              <div className="mt-3 space-y-0.5">
                {results.slice(2).map(([l, v, c]) => (
                  <div
                    key={l}
                    className="flex items-center justify-between rounded-lg px-2.5 py-2.5 transition hover:bg-[var(--ais-surface-2)]"
                  >
                    <span className="text-[13px] text-[var(--ais-fg-muted)]">{l}</span>
                    <span className="num text-[15px] font-medium" style={{ color: c }}>{v}</span>
                  </div>
                ))}
              </div>

              <Btn variant="primary" onClick={handleDeploy} className="mt-auto w-full pt-0 !mt-5">
                {deployed ? "Canlı devrede ✓" : "Stratejiyi canlı devreye al"}
              </Btn>
            </Card>
          </SectionCard>

          {/* şablonlar */}
          <SectionCard
            label="Bir şablonla başlayın"
            className="mt-3"
            action={<StackSimple size={16} weight="regular" className="text-[var(--ais-fg-muted)]" />}
            bodyClassName="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
          >
            {STRATEGY_TEMPLATES.map((t) => (
              <button
                key={t.name}
                onClick={() => {
                  setRule(t.desc);
                  handleBacktest(`${t.name} — ${t.desc}`);
                }}
                className="group ais-card ais-card-hover relative flex flex-col overflow-hidden p-5 text-left"
              >
                {/* Üst aksan çubuğu — hover'da belirir */}
                <span
                  className="absolute inset-x-0 top-0 h-[2px] origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100"
                  style={{ background: AIS_ACCENT }}
                />
                <h3 className="text-[14px] font-medium text-[var(--ais-fg)]">{t.name}</h3>
                <p className="mt-1.5 line-clamp-3 flex-1 text-[12px] leading-relaxed text-[var(--ais-fg-muted)]">
                  {t.desc}
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <span
                    className="num rounded-md px-2 py-1 text-[12px] font-medium"
                    style={{ background: `${AIS_UP}1f`, color: AIS_UP }}
                  >
                    {t.cagr}% CAGR
                  </span>
                  <span className="num rounded-md border border-[var(--ais-line-strong)] px-2 py-1 text-[12px] text-[var(--ais-fg-muted)]">
                    Sharpe {t.sharpe}
                  </span>
                </div>
              </button>
            ))}
          </SectionCard>
        </div>
      </div>
    </>
  );
}
