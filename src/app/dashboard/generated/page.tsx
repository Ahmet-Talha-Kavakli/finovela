"use client";

// Vela — "Generated Assets": sade-dil promptla AI portföy üreten sayfa.
// Prompt → buildPortfolio → her sembol için candles çek → runBacktest →
// sepet + metrikler + BacktestChart. CTA: kaydet + canlı fiyattan paper-buy.

import { useState } from "react";
import { Topbar } from "@/components/dashboard/topbar";
import { TickerBadge } from "@/components/dashboard/ui";
import { PageTitle, SectionCard, Card, EmptyState, AIS_ACCENT, AIS_UP, AIS_DOWN } from "@/components/dashboard/ais-kit";
import { BacktestChart } from "@/components/dashboard/backtest-chart";
import { ChartFrame } from "@/components/dashboard/chart-frame";
import {
  buildPortfolio,
  useGeneratedAssets,
  type BuildResult,
} from "@/lib/dashboard/generated-assets";
import {
  runBacktest,
  type BacktestResult,
  type PriceHistories,
} from "@/lib/dashboard/backtest";
import { paperStore } from "@/lib/dashboard/paper-store";
import { notifStore } from "@/lib/dashboard/use-notifications";
import { getUniverseEntry } from "@/lib/market/universe";
import { Sparkle, Bookmark, Trash, ChartLineUp } from "@phosphor-icons/react";

type Candle = { time: number; close: number };

// Görünen etiket Türkçe; prompt İngilizce kalır çünkü buildPortfolio İngilizce
// anahtar kelimelerle eşleşir (mantığı bozmamak için ayrı tutuldu).
const EXAMPLES: { label: string; prompt: string }[] = [
  { label: "Yapay zeka altyapısı liderleri", prompt: "AI infrastructure leaders" },
  { label: "Düşük oynaklıklı temettü ödeyenler", prompt: "Low-volatility dividend payers" },
  { label: "Büyük kripto paralar", prompt: "Crypto large caps" },
  { label: "Mega ölçekli teknoloji büyümesi", prompt: "Mega-cap technology growth" },
  { label: "Temiz enerji ve EV dönüşümü", prompt: "Clean energy and EV transition" },
  { label: "Çeşitlendirilmiş her şartta çekirdek", prompt: "Diversified all-weather core" },
];

// Her sembol için günlük candles çek → kapanış dizisi (eski→yeni).
async function fetchCloses(symbol: string): Promise<number[]> {
  const to = Math.floor(Date.now() / 1000);
  const from = to - 60 * 60 * 24 * 365; // ~1y
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

async function fetchQuotes(symbols: string[]): Promise<Record<string, number>> {
  try {
    const res = await fetch(
      `/api/market/quote?symbols=${symbols.map(encodeURIComponent).join(",")}`,
    );
    const data = (await res.json()) as { quotes?: { symbol: string; price: number }[] };
    const map: Record<string, number> = {};
    for (const q of data.quotes ?? []) map[q.symbol] = q.price;
    return map;
  } catch {
    return {};
  }
}

function fmtUsd(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export default function GeneratedAssetsPage() {
  const store = useGeneratedAssets();
  const [prompt, setPrompt] = useState("AI infrastructure leaders");
  const [building, setBuilding] = useState(false);
  const [result, setResult] = useState<BuildResult | null>(null);
  const [backtest, setBacktest] = useState<BacktestResult | null>(null);
  const [amount, setAmount] = useState("2500");
  const [invested, setInvested] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate(p: string) {
    const text = p.trim();
    if (!text) return;
    setBuilding(true);
    setError(null);
    setInvested(false);
    setSaved(false);
    setBacktest(null);

    const built = buildPortfolio(text);
    setResult(built);

    const syms = Object.keys(built.weights);
    // Tüm sembollerin geçmişi + SPY benchmark paralel çekilir.
    const [closesArr, spyCloses] = await Promise.all([
      Promise.all(syms.map((s) => fetchCloses(s))),
      fetchCloses("SPY"),
    ]);

    const histories: PriceHistories = {};
    syms.forEach((s, i) => {
      histories[s] = closesArr[i];
    });

    const bt = runBacktest(built.weights, histories, spyCloses);
    setBacktest(bt);
    setBuilding(false);
  }

  function handleSave() {
    if (!result) return;
    store.save(result);
    setSaved(true);
    notifStore.push("info", `Üretilen portföy kaydedildi: ${result.name}`);
  }

  async function handleInvest() {
    if (!result) return;
    const dollars = parseFloat(amount);
    if (!Number.isFinite(dollars) || dollars <= 0) {
      setError("Geçerli bir tutar girin.");
      return;
    }
    const { cash } = paperStore.get();
    if (dollars > cash) {
      setError(`Yetersiz alım gücü. Kullanılabilir: ${fmtUsd(cash)}.`);
      return;
    }
    setError(null);

    const syms = Object.keys(result.weights);
    const prices = await fetchQuotes(syms);

    let placed = 0;
    for (const sym of syms) {
      const pct = result.weights[sym];
      const price = prices[sym] ?? getUniverseEntry(sym).basePrice;
      if (!price || price <= 0) continue;
      const alloc = (dollars * pct) / 100;
      const shares = +(alloc / price).toFixed(6);
      if (shares <= 0) continue;
      const r = paperStore.placeOrder({ side: "BUY", symbol: sym, shares, price });
      if (r.ok) placed++;
    }

    if (placed > 0) {
      setInvested(true);
      notifStore.push(
        "order",
        `${result.name} portföyüne ${fmtUsd(dollars)} yatırıldı (${placed} pozisyon)`,
      );
    } else {
      setError("Emirler iletilemedi — alım gücünüzü kontrol edin.");
    }
  }

  const m = backtest?.metrics;

  return (
    <>
      <Topbar title="Üretilen Varlıklar" />
      <div className="ais min-h-[calc(100vh-64px)]">
        <div className="max-w-7xl px-8 py-10">
          <PageTitle
            title="Üretilen Varlıklar"
            desc="Sade bir tema tarif et; Finovela bir portföy oluştursun, SPY'a karşı geriye dönük test etsin, dilersen demo olarak yatır."
          />

          {/* prompt oluşturucu */}
          <SectionCard
            label="Bir portföy tarif edin"
            desc="Finovela'ya bir tema veya kriter söyleyin — örneğin “yapay zeka altyapısı liderleri” ya da “düşük oynaklıklı temettü ödeyenler”."
            action={
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--ais-accent-bg)] px-2.5 py-1 text-[11px] font-medium text-[var(--ais-accent)]">
                <Sparkle size={13} weight="fill" />
                Yapay zeka
              </span>
            }
          >
            {/* büyük, davetkar tarif kutusu */}
            <div className="ais-card-hover flex items-center gap-3 rounded-xl border border-[var(--ais-line-strong)] bg-[var(--ais-surface-2)]/40 px-4 py-2.5 transition focus-within:border-[var(--ais-accent)]/50">
              <Sparkle size={18} weight="regular" className="shrink-0 text-[var(--ais-accent)]" />
              <input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGenerate(prompt)}
                placeholder="Bir tema tarif edin… ör. yapay zeka altyapısı liderleri"
                className="num flex-1 bg-transparent text-[14px] text-[var(--ais-fg)] placeholder:text-[var(--ais-fg-faint)] focus:outline-none"
              />
              <button
                onClick={() => handleGenerate(prompt)}
                disabled={building}
                className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg px-4 text-[13px] font-medium text-[var(--ais-accent)] transition hover:brightness-110 disabled:opacity-50"
                style={{ background: "var(--ais-accent-bg)" }}
              >
                <Sparkle size={15} weight="fill" />
                {building ? "Üretiliyor…" : "Üret"}
              </button>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-[11.5px] text-[var(--ais-fg-faint)]">Hızlı başlangıç:</span>
              {EXAMPLES.map((c) => (
                <button
                  key={c.prompt}
                  onClick={() => {
                    setPrompt(c.prompt);
                    handleGenerate(c.prompt);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[var(--ais-line-strong)] px-3 py-1 text-[12px] text-[var(--ais-fg-muted)] transition hover:border-[var(--ais-accent)]/40 hover:bg-[var(--ais-surface-2)] hover:text-[var(--ais-fg)]"
                >
                  <Sparkle size={12} weight="regular" className="text-[var(--ais-fg-faint)]" />
                  {c.label}
                </button>
              ))}
            </div>
          </SectionCard>

          {result && (
            <div className="mt-3 grid gap-3 lg:grid-cols-3">
              {/* sepet + aksiyonlar */}
              <SectionCard
                label={result.name}
                className="lg:col-span-1"
                action={<span className="text-[12px] text-[var(--ais-fg-faint)]">{Object.keys(result.weights).length} varlık</span>}
              >
                <p className="mb-4 text-[12px] leading-relaxed text-[var(--ais-fg-muted)]">
                  {result.rationale}
                </p>
                <div className="space-y-1">
                  {Object.entries(result.weights)
                    .sort((a, b) => b[1] - a[1])
                    .map(([sym, pct]) => {
                      const u = getUniverseEntry(sym);
                      return (
                        <div key={sym} className="ais-row flex items-center gap-3 px-2 py-2">
                          <TickerBadge symbol={sym} size={30} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[13px] font-medium text-[var(--ais-fg)]">{sym}</p>
                            <p className="truncate text-[12px] text-[var(--ais-fg-muted)]">{u.name}</p>
                          </div>
                          <div className="flex w-24 items-center gap-2">
                            <div className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: AIS_ACCENT }} />
                            </div>
                            <span className="num w-10 text-right text-[13px] font-medium text-[var(--ais-fg)]">
                              {pct.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>

                {/* CTA'lar */}
                <div className="mt-5 space-y-3 border-t border-[var(--ais-line)] pt-4">
                  <div className="flex items-center gap-2 rounded-lg border border-[var(--ais-line-strong)] px-3">
                    <span className="text-[13px] text-[var(--ais-fg-muted)]">$</span>
                    <input
                      value={amount}
                      onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                      inputMode="decimal"
                      className="num w-full bg-transparent py-2.5 text-[13px] text-[var(--ais-fg)] focus:outline-none"
                      placeholder="Tutar"
                    />
                  </div>
                  {error && <p className="text-[12px]" style={{ color: AIS_DOWN }}>{error}</p>}
                  <button
                    onClick={handleInvest}
                    className="inline-flex w-full items-center justify-center rounded-lg py-2.5 text-[13px] font-medium text-[var(--ais-accent)] transition"
                    style={{ background: "var(--ais-accent-bg)" }}
                  >
                    {invested ? "Yatırıldı ✓" : `${fmtUsd(parseFloat(amount) || 0)} yatır`}
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--ais-line-strong)] py-2.5 text-[13px] font-medium text-[var(--ais-fg)] transition hover:bg-[var(--ais-surface-2)]"
                  >
                    <Bookmark size={15} weight="regular" />
                    {saved ? "Kaydedildi" : "Portföyü kaydet"}
                  </button>
                </div>
              </SectionCard>

              {/* backtest */}
              <SectionCard
                label="SPY'a karşı geriye dönük test"
                className="lg:col-span-2"
                action={<span className="text-[12px] text-[var(--ais-fg-faint)]">{m ? `${m.days} işlem günü` : "Geriye dönük test"}</span>}
              >
                {building ? (
                  <div className="grid h-[240px] place-items-center text-[13px] text-[var(--ais-fg-muted)]">
                    Geriye dönük test çalışıyor…
                  </div>
                ) : (
                  <>
                    <ChartFrame
                      title="SPY'a karşı geriye dönük test"
                      render={(big) => (
                        <BacktestChart curve={backtest?.curve ?? []} height={big ? 440 : 240} />
                      )}
                    />
                    {m && (
                      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
                        {[
                          { l: "Toplam getiri", v: `${m.totalReturn >= 0 ? "+" : ""}${m.totalReturn.toFixed(1)}%`, c: m.totalReturn >= 0 ? AIS_UP : AIS_DOWN },
                          { l: "CAGR", v: `${m.cagr >= 0 ? "+" : ""}${m.cagr.toFixed(1)}%`, c: m.cagr >= 0 ? AIS_UP : AIS_DOWN },
                          { l: "Maks. düşüş", v: `${m.maxDrawdown.toFixed(1)}%`, c: AIS_DOWN },
                          { l: "Sharpe", v: m.sharpe.toFixed(2), c: "var(--ais-fg)" },
                          { l: "Oynaklık", v: `${m.volatility.toFixed(1)}%`, c: "var(--ais-fg)" },
                          { l: "Kazanma oranı", v: `${m.winRate.toFixed(0)}%`, c: "var(--ais-fg)" },
                          { l: "En iyi gün", v: `+${m.bestDay.toFixed(1)}%`, c: AIS_UP },
                          { l: "En kötü gün", v: `${m.worstDay.toFixed(1)}%`, c: AIS_DOWN },
                        ].map((s) => (
                          <div key={s.l}>
                            <p className="text-[11px] text-[var(--ais-fg-faint)]">{s.l}</p>
                            <p className="num mt-1 text-[18px] font-normal tracking-tight" style={{ color: s.c }}>
                              {s.v}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </SectionCard>
            </div>
          )}

          {/* Keşif Merkezi — kaydedilen üretilmiş portföyler */}
          <SectionCard
            label="Keşif Merkezi"
            desc="Kaydettiğin üretilmiş portföyler."
            className="mt-3"
            bodyClassName={store.list.length === 0 ? "p-0" : undefined}
          >
          {store.list.length === 0 ? (
              <EmptyState
                icon={ChartLineUp}
                title="Henüz kayıtlı portföy yok"
                desc="Yukarıda bir tema tarif edin ve “Portföyü kaydet”e dokunun."
              />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {store.list.map((g) => {
                const syms = Object.keys(g.weights);
                return (
                  <Card
                    key={g.id}
                    hover
                    className="group flex h-full flex-col transition-transform duration-200 hover:-translate-y-0.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="truncate text-[14px] font-medium text-[var(--ais-fg)]">{g.name}</h3>
                        <p className="mt-1 truncate text-[12px] text-[var(--ais-fg-muted)]">&ldquo;{g.prompt}&rdquo;</p>
                      </div>
                      <button
                        onClick={() => store.remove(g.id)}
                        className="shrink-0 text-[var(--ais-fg-faint)] opacity-0 transition hover:text-[var(--ais-fg)] group-hover:opacity-100"
                        aria-label="Kaldır"
                      >
                        <Trash size={16} weight="regular" />
                      </button>
                    </div>

                    {/* gerçek logolu sembol rozetleri */}
                    <div className="mt-4 flex items-center gap-2">
                      <div className="flex items-center -space-x-2">
                        {syms.slice(0, 5).map((s) => (
                          <span
                            key={s}
                            className="rounded-full ring-2 ring-[var(--ais-bg)]"
                            title={s}
                          >
                            <TickerBadge symbol={s} size={26} />
                          </span>
                        ))}
                      </div>
                      <span className="text-[12px] text-[var(--ais-fg-muted)]">
                        {syms.length} varlık
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setPrompt(g.prompt);
                        handleGenerate(g.prompt);
                      }}
                      className="mt-auto inline-flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-[13px] font-medium text-[var(--ais-accent)] transition hover:brightness-110"
                      style={{ background: "var(--ais-accent-bg)" }}
                    >
                      <ChartLineUp size={15} weight="regular" />
                      Aç ve test et
                    </button>
                  </Card>
                );
              })}
            </div>
          )}
          </SectionCard>
        </div>
      </div>
    </>
  );
}
