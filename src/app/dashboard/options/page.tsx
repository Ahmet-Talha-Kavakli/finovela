"use client";

import { useMemo, useState, useEffect } from "react";
import { Topbar } from "@/components/dashboard/topbar";
import { PageTitle, SectionCard, Card, Metric, EmptyState, AIS_ACCENT, AIS_UP, AIS_DOWN } from "@/components/dashboard/ais-kit";
import { ChartFrame } from "@/components/dashboard/chart-frame";
import { fmtUsd } from "@/lib/dashboard/data";
import { notifStore } from "@/lib/dashboard/use-notifications";
import { optionsStore, markPosition } from "@/lib/dashboard/options-store";
import { useOptions } from "@/lib/dashboard/use-options";
import { useConfirm } from "@/components/dashboard/confirm";
import { TrendUp, TrendDown, Lightning, ShieldCheck, ArrowsLeftRight, CheckCircle, X } from "@phosphor-icons/react";

const ACCENT = AIS_ACCENT;
const UP = AIS_UP;
const DOWN = AIS_DOWN;

/* ----------------------------------------------------------------
 * Mock underlyings (deterministic chain generated from base price)
 * ---------------------------------------------------------------- */
type Underlying = { symbol: string; name: string; price: number; iv: number };

const UNDERLYINGS: Underlying[] = [
  { symbol: "AAPL", name: "Apple Inc.", price: 294.18, iv: 0.27 },
  { symbol: "NVDA", name: "NVIDIA Corp.", price: 182.44, iv: 0.46 },
  { symbol: "TSLA", name: "Tesla Inc.", price: 311.02, iv: 0.58 },
  { symbol: "SPY", name: "SPDR S&P 500 ETF", price: 584.31, iv: 0.14 },
];

const EXPIRIES = [
  { label: "27 Haz", dte: 3 },
  { label: "18 Tem", dte: 24 },
  { label: "15 Ağu", dte: 52 },
  { label: "19 Eyl", dte: 87 },
  { label: "19 Ara", dte: 178 },
];

/* ----------------------------------------------------------------
 * Black-Scholes (deterministic) — realistic option pricing
 * ---------------------------------------------------------------- */
const RATE = 0.043; // risk-free

// Abramowitz–Stegun normal CDF approximation
function normCdf(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp((-x * x) / 2);
  let p =
    d *
    t *
    (0.3193815 +
      t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  if (x > 0) p = 1 - p;
  return p;
}

function bs(
  spot: number,
  strike: number,
  t: number, // years
  vol: number,
  call: boolean,
) {
  if (t <= 0) {
    const intrinsic = call ? Math.max(spot - strike, 0) : Math.max(strike - spot, 0);
    return { price: intrinsic, delta: call ? (spot > strike ? 1 : 0) : spot < strike ? -1 : 0 };
  }
  const d1 =
    (Math.log(spot / strike) + (RATE + (vol * vol) / 2) * t) / (vol * Math.sqrt(t));
  const d2 = d1 - vol * Math.sqrt(t);
  const price = call
    ? spot * normCdf(d1) - strike * Math.exp(-RATE * t) * normCdf(d2)
    : strike * Math.exp(-RATE * t) * normCdf(-d2) - spot * normCdf(-d1);
  const delta = call ? normCdf(d1) : normCdf(d1) - 1;
  return { price: Math.max(price, 0), delta };
}

type OptRow = {
  strike: number;
  call: { bid: number; ask: number; last: number; vol: number; iv: number; delta: number };
  put: { bid: number; ask: number; last: number; vol: number; iv: number; delta: number };
};

function buildChain(u: Underlying, dte: number): OptRow[] {
  const t = dte / 365;
  // strikes: step ~ 1.7% of spot, rounded, 6 above + 6 below ATM
  const rawStep = u.price * 0.017;
  const step = Math.max(1, Math.round(rawStep / 2.5) * 2.5);
  const atm = Math.round(u.price / step) * step;
  const rows: OptRow[] = [];
  for (let i = -6; i <= 6; i++) {
    const strike = +(atm + i * step).toFixed(2);
    if (strike <= 0) continue;
    // volatility smile — wings have higher IV
    const moneyness = Math.abs(strike - u.price) / u.price;
    const smile = u.iv * (1 + moneyness * 0.9);
    const callP = bs(u.price, strike, t, smile, true);
    const putP = bs(u.price, strike, t, smile, false);
    // deterministic spread + volume from strike
    const spread = (mid: number) => Math.max(0.02, mid * 0.012 + 0.03);
    const seed = (strike * 7.3 + dte) % 100;
    const baseVol = Math.round((900 - moneyness * 6000) * (1 + (seed % 30) / 100));
    const mk = (p: { price: number; delta: number }, isCall: boolean) => {
      const mid = +p.price.toFixed(2);
      const sp = spread(mid);
      const vol = Math.max(0, baseVol + Math.round((isCall ? 1 : -1) * (seed % 40) * 4));
      return {
        bid: +Math.max(0, mid - sp / 2).toFixed(2),
        ask: +(mid + sp / 2).toFixed(2),
        last: +mid.toFixed(2),
        vol,
        iv: +(smile * 100).toFixed(1),
        delta: +p.delta.toFixed(2),
      };
    };
    rows.push({ strike, call: mk(callP, true), put: mk(putP, false) });
  }
  return rows;
}

/* ----------------------------------------------------------------
 * Strategies
 * ---------------------------------------------------------------- */
type Leg = { action: "Buy" | "Sell"; type: "Call" | "Put" | "Stock"; strike?: number; qty: number };
type StratKey = "covered-call" | "csp" | "bull-call" | "protective-put" | "iron-condor";

const STRATEGIES: { key: StratKey; name: string; desc: string; icon: React.ReactNode }[] = [
  { key: "covered-call", name: "Kapalı Alım (Covered Call)", desc: "Hisseyi elde tut, yükseliş potansiyelini gelir için sat.", icon: <TrendUp size={16} weight="bold" /> },
  { key: "csp", name: "Nakit Teminatlı Satım", desc: "Bir put sat, düşüşü beklerken prim kazan.", icon: <TrendDown size={16} weight="bold" /> },
  { key: "bull-call", name: "Boğa Alım Spreadi", desc: "Ölçülü bir yükselişe tanımlı-riskli bahis.", icon: <ArrowsLeftRight size={16} weight="bold" /> },
  { key: "protective-put", name: "Koruyucu Satım", desc: "Hisseni ani düşüşe karşı sigortala.", icon: <ShieldCheck size={16} weight="bold" /> },
  { key: "iron-condor", name: "Demir Kondor", desc: "Hisse bant içinde kalırsa kâr et.", icon: <Lightning size={16} weight="bold" /> },
];

type StratResult = {
  legs: Leg[];
  maxProfit: number | null; // null = unlimited
  maxLoss: number | null; // null = unlimited (per 100 contract)
  breakeven: number[];
  netCredit: number; // + credit, - debit (per share)
  payoff: (price: number) => number; // P/L per 100-share contract at expiry
};

function near(rows: OptRow[], target: number): OptRow {
  return rows.reduce((a, b) => (Math.abs(b.strike - target) < Math.abs(a.strike - target) ? b : a));
}

function buildStrategy(key: StratKey, u: Underlying, rows: OptRow[]): StratResult {
  const S = u.price;
  const atmRow = near(rows, S);
  // helper: per-100 payoff from legs
  const make = (legs: Leg[], netCredit: number): StratResult["payoff"] => (price: number) => {
    let v = 0;
    for (const l of legs) {
      const sign = l.action === "Buy" ? 1 : -1;
      if (l.type === "Stock") {
        v += sign * (price - S) * l.qty;
      } else if (l.type === "Call") {
        v += sign * Math.max(price - (l.strike ?? 0), 0) * 100 * l.qty;
      } else {
        v += sign * Math.max((l.strike ?? 0) - price, 0) * 100 * l.qty;
      }
    }
    return v + netCredit * 100;
  };

  if (key === "covered-call") {
    const shortRow = near(rows, S * 1.05);
    const prem = shortRow.call.bid;
    const legs: Leg[] = [
      { action: "Buy", type: "Stock", qty: 1 },
      { action: "Sell", type: "Call", strike: shortRow.strike, qty: 1 },
    ];
    // net credit treated as premium only; stock cost handled in payoff via (price - S)
    const payoff = make(legs, prem);
    const maxProfit = (shortRow.strike - S + prem) * 100;
    const breakeven = [+(S - prem).toFixed(2)];
    return { legs, maxProfit, maxLoss: -(S - prem) * 100, breakeven, netCredit: prem, payoff };
  }

  if (key === "csp") {
    const shortRow = near(rows, S * 0.95);
    const prem = shortRow.put.bid;
    const legs: Leg[] = [{ action: "Sell", type: "Put", strike: shortRow.strike, qty: 1 }];
    const payoff = make(legs, prem);
    const breakeven = [+(shortRow.strike - prem).toFixed(2)];
    return {
      legs,
      maxProfit: prem * 100,
      maxLoss: -(shortRow.strike - prem) * 100,
      breakeven,
      netCredit: prem,
      payoff,
    };
  }

  if (key === "bull-call") {
    const longRow = atmRow;
    const shortRow = near(rows, S * 1.07);
    const debit = longRow.call.ask - shortRow.call.bid;
    const legs: Leg[] = [
      { action: "Buy", type: "Call", strike: longRow.strike, qty: 1 },
      { action: "Sell", type: "Call", strike: shortRow.strike, qty: 1 },
    ];
    const payoff = make(legs, -debit);
    const width = shortRow.strike - longRow.strike;
    const breakeven = [+(longRow.strike + debit).toFixed(2)];
    return {
      legs,
      maxProfit: (width - debit) * 100,
      maxLoss: -debit * 100,
      breakeven,
      netCredit: -debit,
      payoff,
    };
  }

  if (key === "protective-put") {
    const putRow = near(rows, S * 0.95);
    const debit = putRow.put.ask;
    const legs: Leg[] = [
      { action: "Buy", type: "Stock", qty: 1 },
      { action: "Buy", type: "Put", strike: putRow.strike, qty: 1 },
    ];
    const payoff = make(legs, -debit);
    const breakeven = [+(S + debit).toFixed(2)];
    return {
      legs,
      maxProfit: null,
      maxLoss: -(S - putRow.strike + debit) * 100,
      breakeven,
      netCredit: -debit,
      payoff,
    };
  }

  // iron-condor
  const putShort = near(rows, S * 0.94);
  const putLong = near(rows, S * 0.88);
  const callShort = near(rows, S * 1.06);
  const callLong = near(rows, S * 1.12);
  const credit =
    putShort.put.bid - putLong.put.ask + callShort.call.bid - callLong.call.ask;
  const legs: Leg[] = [
    { action: "Buy", type: "Put", strike: putLong.strike, qty: 1 },
    { action: "Sell", type: "Put", strike: putShort.strike, qty: 1 },
    { action: "Sell", type: "Call", strike: callShort.strike, qty: 1 },
    { action: "Buy", type: "Call", strike: callLong.strike, qty: 1 },
  ];
  const payoff = make(legs, credit);
  const wing = Math.min(putShort.strike - putLong.strike, callLong.strike - callShort.strike);
  return {
    legs,
    maxProfit: credit * 100,
    maxLoss: -(wing - credit) * 100,
    breakeven: [
      +(putShort.strike - credit).toFixed(2),
      +(callShort.strike + credit).toFixed(2),
    ],
    netCredit: credit,
    payoff,
  };
}

/* ----------------------------------------------------------------
 * Payoff diagram (SVG) — green above 0, red below
 * ---------------------------------------------------------------- */
function PayoffChart({ spot, payoff }: { spot: number; payoff: (p: number) => number }) {
  const w = 760;
  const h = 220;
  const lo = spot * 0.78;
  const hi = spot * 1.22;
  const N = 120;
  const pts = Array.from({ length: N + 1 }, (_, i) => {
    const price = lo + ((hi - lo) * i) / N;
    return { price, pl: payoff(price) };
  });
  const pls = pts.map((p) => p.pl);
  const maxAbs = Math.max(Math.abs(Math.min(...pls)), Math.abs(Math.max(...pls)), 1) * 1.12;
  const x = (price: number) => ((price - lo) / (hi - lo)) * w;
  const y = (pl: number) => h / 2 - (pl / maxAbs) * (h / 2 - 8);
  const zeroY = y(0);

  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${x(p.price).toFixed(1)},${y(p.pl).toFixed(1)}`).join(" ");
  // split-fill: above zero green, below red
  const upArea = `M0,${zeroY} ${pts.map((p) => `L${x(p.price).toFixed(1)},${y(Math.max(p.pl, 0)).toFixed(1)}`).join(" ")} L${w},${zeroY} Z`;
  const downArea = `M0,${zeroY} ${pts.map((p) => `L${x(p.price).toFixed(1)},${y(Math.min(p.pl, 0)).toFixed(1)}`).join(" ")} L${w},${zeroY} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-full w-full">
      <defs>
        <linearGradient id="po-up" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={UP} stopOpacity="0.22" />
          <stop offset="100%" stopColor={UP} stopOpacity="0" />
        </linearGradient>
        <linearGradient id="po-down" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor={DOWN} stopOpacity="0.22" />
          <stop offset="100%" stopColor={DOWN} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={upArea} fill="url(#po-up)" />
      <path d={downArea} fill="url(#po-down)" />
      {/* zero line */}
      <line x1="0" y1={zeroY} x2={w} y2={zeroY} stroke="rgba(255,255,255,0.18)" strokeWidth="1" strokeDasharray="4 4" />
      {/* spot marker */}
      <line x1={x(spot)} y1="0" x2={x(spot)} y2={h} stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
      <path d={path} fill="none" stroke="var(--ais-fg)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/* ----------------------------------------------------------------
 * Page
 * ---------------------------------------------------------------- */
export default function OptionsPage() {
  const [symbol, setSymbol] = useState(UNDERLYINGS[0].symbol);
  const [expiryIdx, setExpiryIdx] = useState(1);
  const [strat, setStrat] = useState<StratKey>("covered-call");
  const [confirmed, setConfirmed] = useState(false);

  // GERÇEK canlı fiyatlar — underlying'lerin spot fiyatını çek (opsiyon zinciri
  // hâlâ Black-Scholes ile türetilir, ama GERÇEK spot üzerinden hesaplanır).
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});
  useEffect(() => {
    let cancelled = false;
    const syms = UNDERLYINGS.map((u) => u.symbol).join(",");
    void (async () => {
      try {
        const res = await fetch(`/api/market/quote?symbols=${syms}`, { cache: "no-store" });
        const data = (await res.json()) as { quotes?: { symbol: string; price: number }[] };
        if (cancelled || !data.quotes) return;
        const m: Record<string, number> = {};
        for (const q of data.quotes) m[q.symbol] = q.price;
        setLivePrices(m);
      } catch {
        /* fallback fiyatlar kalır */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const baseU = UNDERLYINGS.find((x) => x.symbol === symbol)!;
  // Canlı fiyat varsa onu kullan; yoksa fallback fiyat.
  const u: Underlying = { ...baseU, price: livePrices[symbol] ?? baseU.price };
  const expiry = EXPIRIES[expiryIdx];
  const chain = useMemo(() => buildChain(u, expiry.dte), [u, expiry.dte]);
  const result = useMemo(() => buildStrategy(strat, u, chain), [strat, u, chain]);
  const atmStrike = near(chain, u.price).strike;
  const positions = useOptions();
  const confirm = useConfirm();

  /** Bir bacağın hisse-başına primini chain'den bul (Buy → ask, Sell → bid). */
  function legPremium(l: Leg): number {
    if (l.type === "Stock" || l.strike == null) return 0;
    const row = near(chain, l.strike);
    const side = l.type === "Call" ? row.call : row.put;
    return l.action === "Buy" ? side.ask : side.bid;
  }

  /** Seçili stratejinin opsiyon bacaklarını gerçek pozisyona çevir. */
  async function confirmStrategy() {
    const name = STRATEGIES.find((s) => s.key === strat)!.name;
    const ok = await confirm({
      title: "Stratejiyi onayla",
      message: `${u.symbol} üzerinde "${name}" stratejisiyle ${expiry.label} vadeli bir demo opsiyon pozisyonu açılacak. Bu bir paper işlemdir.`,
      confirmLabel: "Stratejiyi onayla",
      cancelLabel: "Vazgeç",
      tone: "buy",
    });
    if (!ok) return;
    let opened = 0;
    for (const l of result.legs) {
      if (l.type === "Stock" || l.strike == null) continue; // hisse bacağı opsiyon değil
      optionsStore.openPosition({
        underlying: u.symbol,
        type: l.type === "Call" ? "call" : "put",
        side: l.action === "Buy" ? "long" : "short",
        strike: l.strike,
        expiry: expiry.label,
        expiryDte: expiry.dte,
        contracts: l.qty,
        premium: legPremium(l),
        iv: u.iv,
      });
      opened++;
    }
    notifStore.push(
      "order",
      `${u.symbol} üzerinde ${name} açıldı (${expiry.label}) · ${opened} bacak · demo`,
    );
    setConfirmed(true);
    setTimeout(() => setConfirmed(false), 3000);
  }

  const fmtPL = (n: number | null) =>
    n === null ? "Sınırsız" : `${n >= 0 ? "+" : "−"}${fmtUsd(Math.abs(n))}`;

  return (
    <>
      <Topbar title="Opsiyonlar" />
      <div className="ais min-h-[calc(100vh-64px)]">
        <div className="max-w-7xl px-8 py-10">
          <PageTitle
            title="Opsiyonlar"
            desc="Dayanak ve vade seç, zinciri incele, tanımlı stratejiler oluştur ve demo pozisyon aç."
          />

          {/* seçici */}
          <SectionCard label="Dayanak ve vade" className="mt-2">
            <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
              <div>
                <p className="mb-2 text-[12px] text-[var(--ais-fg-faint)]">Dayanak varlık</p>
                <div className="flex flex-wrap gap-2">
                  {UNDERLYINGS.map((x) => {
                    const on = x.symbol === symbol;
                    return (
                      <button
                        key={x.symbol}
                        onClick={() => setSymbol(x.symbol)}
                        className={`rounded-lg border px-3.5 py-1.5 text-[13px] font-medium transition ${
                          on
                            ? "border-[var(--ais-accent)]/50 text-[var(--ais-accent)]"
                            : "border-[var(--ais-line-strong)] text-[var(--ais-fg-muted)] hover:bg-[var(--ais-surface-2)]"
                        }`}
                        style={on ? { background: "var(--ais-accent-bg)" } : undefined}
                      >
                        {x.symbol}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="ml-auto text-right">
                <p className="text-[12px] text-[var(--ais-fg-muted)]">{u.name}</p>
                <p className="num text-[22px] font-normal tracking-tight text-[var(--ais-fg)]">{fmtUsd(u.price)}</p>
                <p className="text-[12px] text-[var(--ais-fg-faint)]">IV {(u.iv * 100).toFixed(0)}%</p>
              </div>
            </div>
            <div className="mt-5">
              <p className="mb-2 text-[12px] text-[var(--ais-fg-faint)]">Vade</p>
              <div className="flex flex-wrap gap-2">
                {EXPIRIES.map((e, i) => {
                  const on = i === expiryIdx;
                  return (
                    <button
                      key={e.label}
                      onClick={() => setExpiryIdx(i)}
                      className={`rounded-lg border px-3.5 py-1.5 text-[13px] transition ${
                        on
                          ? "border-[var(--ais-accent)]/50 text-[var(--ais-accent)]"
                          : "border-[var(--ais-line-strong)] text-[var(--ais-fg-muted)] hover:bg-[var(--ais-surface-2)]"
                      }`}
                      style={on ? { background: "var(--ais-accent-bg)" } : undefined}
                    >
                      {e.label}
                      <span className="ml-1.5 text-[11px] text-[var(--ais-fg-faint)]">{e.dte}g</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </SectionCard>

          {/* opsiyon zinciri */}
          <SectionCard
            label="Opsiyon zinciri"
            className="mt-3"
            desc={`${symbol} · ${expiry.label} — paraya en yakın satır vurgulanır.`}
            bodyClassName="p-0"
          >
            <div className="overflow-x-auto">
              <table className="ais-dt num min-w-[920px]">
                <thead>
                  <tr>
                    <th colSpan={6} className="!text-center" style={{ color: UP }}>
                      Alım opsiyonları
                    </th>
                    <th></th>
                    <th colSpan={6} className="!text-center" style={{ color: DOWN }}>
                      Satım opsiyonları
                    </th>
                  </tr>
                  <tr>
                    <th className="!text-right">Alış</th>
                    <th className="!text-right">Satış</th>
                    <th className="!text-right">Son</th>
                    <th className="!text-right">Hacim</th>
                    <th className="!text-right">IV</th>
                    <th className="!text-right">Δ</th>
                    <th className="!text-center">Kullanım</th>
                    <th className="!text-right">Alış</th>
                    <th className="!text-right">Satış</th>
                    <th className="!text-right">Son</th>
                    <th className="!text-right">Hacim</th>
                    <th className="!text-right">IV</th>
                    <th className="!text-right">Δ</th>
                  </tr>
                </thead>
                <tbody>
                  {chain.map((r) => {
                    const isAtm = r.strike === atmStrike;
                    const callItm = r.strike < u.price;
                    const putItm = r.strike > u.price;
                    const callBg = callItm ? `${UP}0d` : undefined;
                    const putBg = putItm ? `${DOWN}0d` : undefined;
                    return (
                      <tr key={r.strike} style={isAtm ? { background: "var(--ais-accent-bg)" } : undefined}>
                        {/* calls */}
                        <td className="!text-right" style={{ background: callBg }}>
                          <span style={{ color: UP }}>{r.call.bid.toFixed(2)}</span>
                        </td>
                        <td className="!text-right text-[var(--ais-fg)]" style={{ background: callBg }}>
                          {r.call.ask.toFixed(2)}
                        </td>
                        <td className="!text-right text-[var(--ais-fg)]" style={{ background: callBg }}>
                          {r.call.last.toFixed(2)}
                        </td>
                        <td className="!text-right text-[var(--ais-fg-muted)]" style={{ background: callBg }}>
                          {r.call.vol.toLocaleString("en-US")}
                        </td>
                        <td className="!text-right text-[var(--ais-fg-muted)]" style={{ background: callBg }}>
                          {r.call.iv.toFixed(0)}%
                        </td>
                        <td className="!text-right text-[var(--ais-fg-muted)]" style={{ background: callBg }}>
                          {r.call.delta.toFixed(2)}
                        </td>
                        {/* strike */}
                        <td className="!text-center">
                          <span
                            className="inline-block rounded-md px-2.5 py-0.5 font-medium"
                            style={
                              isAtm
                                ? { background: "var(--ais-accent-bg)", color: ACCENT }
                                : { color: "var(--ais-fg)" }
                            }
                          >
                            {r.strike.toFixed(1)}
                          </span>
                        </td>
                        {/* puts */}
                        <td className="!text-right" style={{ background: putBg }}>
                          <span style={{ color: DOWN }}>{r.put.bid.toFixed(2)}</span>
                        </td>
                        <td className="!text-right text-[var(--ais-fg)]" style={{ background: putBg }}>
                          {r.put.ask.toFixed(2)}
                        </td>
                        <td className="!text-right text-[var(--ais-fg)]" style={{ background: putBg }}>
                          {r.put.last.toFixed(2)}
                        </td>
                        <td className="!text-right text-[var(--ais-fg-muted)]" style={{ background: putBg }}>
                          {r.put.vol.toLocaleString("en-US")}
                        </td>
                        <td className="!text-right text-[var(--ais-fg-muted)]" style={{ background: putBg }}>
                          {r.put.iv.toFixed(0)}%
                        </td>
                        <td className="!text-right text-[var(--ais-fg-muted)]" style={{ background: putBg }}>
                          {r.put.delta.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="border-t border-[var(--ais-line)] px-5 py-3 text-[12px] text-[var(--ais-fg-faint)]">
              Paraya en yakın satır vurgulandı. Karda (ITM) bacaklar hafifçe renklendirildi. Dayanak (underlying) fiyatları CANLIDIR; opsiyon prim/Greek değerleri canlı fiyat üzerinden Black-Scholes ile tahmin edilir (gerçek opsiyon piyasası kotasyonu değildir).
            </p>
          </SectionCard>

          {/* strateji oluşturucu */}
          <SectionCard label="Strateji oluşturucu" className="mt-3" desc="Tanımlı-riskli bir strateji seç, getirisini gör.">
          <div className="grid gap-3 lg:grid-cols-3">
            {/* strateji seçici */}
            <div className="space-y-2 lg:col-span-1">
              {STRATEGIES.map((s) => {
                const on = s.key === strat;
                return (
                  <button
                    key={s.key}
                    onClick={() => setStrat(s.key)}
                    className={`ais-card ais-card-hover flex w-full items-start gap-3 p-3 text-left ${
                      on ? "!border-[var(--ais-accent)]/50" : ""
                    }`}
                  >
                    <span
                      className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg"
                      style={
                        on
                          ? { background: "var(--ais-accent-bg)", color: ACCENT }
                          : { background: "rgba(255,255,255,0.05)", color: "var(--ais-fg-muted)" }
                      }
                    >
                      {s.icon}
                    </span>
                    <span>
                      <span className="block text-[13.5px] font-medium text-[var(--ais-fg)]">{s.name}</span>
                      <span className="mt-0.5 block text-[12px] leading-relaxed text-[var(--ais-fg-muted)]">{s.desc}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            {/* bacaklar + getiri + metrikler */}
            <Card className="lg:col-span-2">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-[14px] font-medium text-[var(--ais-fg)]">{STRATEGIES.find((s) => s.key === strat)!.name}</h3>
                <span className="text-[12px] text-[var(--ais-fg-faint)]">{u.symbol} · {expiry.label} · 1 kontrat</span>
              </div>

              {/* bacaklar */}
              <div className="mb-5 space-y-1.5">
                {result.legs.map((l, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg border border-[var(--ais-line)] px-4 py-2.5 text-[13px]"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="rounded-md px-2 py-0.5 text-[11px] font-medium"
                        style={{
                          color: l.action === "Buy" ? UP : DOWN,
                          background: `${l.action === "Buy" ? UP : DOWN}1f`,
                        }}
                      >
                        {l.action === "Buy" ? "Al" : "Sat"}
                      </span>
                      <span className="font-medium text-[var(--ais-fg)]">
                        {l.qty}{" "}
                        {l.type === "Stock"
                          ? "× 100 hisse"
                          : `× ${l.type === "Call" ? "Alım" : "Satım"}`}
                      </span>
                    </div>
                    <span className="num text-[var(--ais-fg-muted)]">
                      {l.strike ? `${fmtUsd(l.strike)} kullanım` : `@ ${fmtUsd(u.price)}`}
                    </span>
                  </div>
                ))}
              </div>

              {/* metrikler */}
              <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Metric label="Maks. kâr" value={fmtPL(result.maxProfit)} color={UP} />
                <Metric label="Maks. zarar" value={fmtPL(result.maxLoss)} color={DOWN} />
                <Metric
                  label="Başabaş"
                  value={result.breakeven.map((b) => fmtUsd(b)).join(" / ")}
                />
                <Metric
                  label={result.netCredit >= 0 ? "Net alacak" : "Net borç"}
                  value={fmtUsd(Math.abs(result.netCredit) * 100)}
                  color={result.netCredit >= 0 ? UP : undefined}
                />
              </div>

              {/* getiri */}
              <div className="mb-1 flex items-center justify-between">
                <p className="text-[12px] text-[var(--ais-fg-faint)]">Vade sonu getirisi</p>
                <p className="text-[12px] text-[var(--ais-fg-faint)]">Spot {fmtUsd(u.price)}</p>
              </div>
              <ChartFrame
                title="Vade sonu getirisi"
                render={(big) => (
                  <div className="w-full" style={{ height: big ? 440 : 200 }}>
                    <PayoffChart spot={u.price} payoff={result.payoff} />
                  </div>
                )}
              />
              <div className="num mt-1 flex justify-between text-[11px] text-[var(--ais-fg-faint)]">
                <span>{fmtUsd(u.price * 0.78)}</span>
                <span>{fmtUsd(u.price * 0.89)}</span>
                <span className="text-[var(--ais-fg-muted)]">{fmtUsd(u.price)}</span>
                <span>{fmtUsd(u.price * 1.11)}</span>
                <span>{fmtUsd(u.price * 1.22)}</span>
              </div>

              {confirmed ? (
                <div
                  className="mt-6 flex items-center justify-center gap-2 rounded-lg py-3 text-[13px] font-medium"
                  style={{ background: `${UP}1f`, color: UP }}
                >
                  <CheckCircle size={16} weight="regular" /> Strateji açıldı · demo
                </div>
              ) : (
                <button
                  onClick={confirmStrategy}
                  className="mt-6 inline-flex w-full items-center justify-center rounded-lg py-3 text-[13px] font-medium text-[var(--ais-accent)]"
                  style={{ background: "var(--ais-accent-bg)" }}
                >
                  Stratejiyi onayla · Demo işlem
                </button>
              )}
            </Card>
          </div>
          </SectionCard>

          {/* açık pozisyonlar — canlı K/Z */}
          <SectionCard
            label="Açık pozisyonlar"
            className="mt-3"
            desc={`${positions.length} açık`}
            bodyClassName="p-0"
          >
          {positions.length === 0 ? (
              <EmptyState
                title="Henüz açık pozisyon yok"
                desc="Yukarıda bir strateji oluşturup onaylayarak bir tane açın."
              />
          ) : (
              <div className="overflow-x-auto">
                <table className="ais-dt num min-w-[680px]">
                  <thead>
                    <tr>
                      <th>Pozisyon</th>
                      <th className="!text-right">Kullanım</th>
                      <th className="!text-right">Kontrat</th>
                      <th className="!text-right">Giriş</th>
                      <th className="!text-right">Güncel</th>
                      <th className="!text-right">K/Z</th>
                      <th className="!text-right"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {positions.map((p) => {
                      const under = UNDERLYINGS.find((x) => x.symbol === p.underlying);
                      const markPrice = under?.price ?? p.strike;
                      const { mark, pl } = markPosition(p, markPrice);
                      const up = pl >= 0;
                      return (
                        <tr key={p.id}>
                          <td>
                            <span
                              className="mr-2 rounded-md px-2 py-0.5 text-[11px] font-medium"
                              style={{
                                color: p.side === "long" ? UP : DOWN,
                                background: `${p.side === "long" ? UP : DOWN}1f`,
                              }}
                            >
                              {p.side === "long" ? "Uzun" : "Kısa"}
                            </span>
                            <span className="font-medium text-[var(--ais-fg)]">
                              {p.underlying} {p.type === "call" ? "Alım" : "Satım"}
                            </span>
                            <span className="ml-2 text-[12px] text-[var(--ais-fg-faint)]">{p.expiry}</span>
                          </td>
                          <td className="!text-right text-[var(--ais-fg)]">{fmtUsd(p.strike)}</td>
                          <td className="!text-right text-[var(--ais-fg-muted)]">{p.contracts}</td>
                          <td className="!text-right text-[var(--ais-fg-muted)]">{fmtUsd(p.premium)}</td>
                          <td className="!text-right text-[var(--ais-fg)]">{fmtUsd(mark)}</td>
                          <td className="!text-right font-medium" style={{ color: up ? UP : DOWN }}>
                            {up ? "+" : "−"}
                            {fmtUsd(Math.abs(pl))}
                          </td>
                          <td className="!text-right">
                            <button
                              onClick={() => optionsStore.closePosition(p.id, markPrice)}
                              className="inline-flex items-center gap-1 rounded-lg border border-[var(--ais-line-strong)] px-3 py-1 text-[12px] text-[var(--ais-fg-muted)] transition hover:bg-[var(--ais-surface-2)]"
                            >
                              <X size={11} weight="regular" /> Kapat
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
          )}
          </SectionCard>
        </div>
      </div>
    </>
  );
}
