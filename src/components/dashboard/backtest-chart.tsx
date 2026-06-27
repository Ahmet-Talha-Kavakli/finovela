"use client";

// Vela — backtest görselleştirme: equity eğrisi (portföy vs benchmark) +
// altında drawdown alanı. Bağımlılıksız, saf SVG. OLED monokrom tema:
// portföy = beyaz çizgi, benchmark = soluk kesikli, drawdown = kırmızı dolgu.

import { useState } from "react";
import { Check } from "lucide-react";
import type { EquityPoint } from "@/lib/dashboard/backtest";
import { paperStore } from "@/lib/dashboard/paper-store";
import { notifStore } from "@/lib/dashboard/use-notifications";
import { useConfirm } from "@/components/dashboard/confirm";
import { getUniverseEntry } from "@/lib/market/universe";

const UP = "#3ecf8e";
const DOWN = "#ff5c5c";

function buildPath(
  values: number[],
  min: number,
  max: number,
  w: number,
  h: number,
): string {
  const n = values.length;
  if (n < 2) return "";
  const span = max - min || 1;
  return values
    .map((v, i) => {
      const x = (i / (n - 1)) * w;
      const y = h - ((v - min) / span) * h;
      return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

/** NAV serisinden drawdown serisi (negatif yüzde) üret. */
function drawdownSeries(values: number[]): number[] {
  let peak = values[0] ?? 1;
  return values.map((v) => {
    if (v > peak) peak = v;
    return peak > 0 ? (v / peak - 1) * 100 : 0;
  });
}

export function BacktestChart({
  curve,
  height = 240,
}: {
  curve: EquityPoint[];
  height?: number;
}) {
  if (!curve || curve.length < 2) {
    return (
      <div
        className="grid place-items-center rounded-xl border border-white/[0.08] text-sm text-white/40"
        style={{ height }}
      >
        Sermaye eğrisini görmek için bir geriye dönük test çalıştırın.
      </div>
    );
  }

  const W = 600;
  const H = height;
  const ddH = Math.round(H * 0.26); // alt drawdown şeridi yüksekliği
  const eqH = H - ddH - 12;

  const port = curve.map((p) => p.v);
  const bench = curve.map((p) => p.b);
  const all = [...port, ...bench];
  const min = Math.min(...all);
  const max = Math.max(...all);

  const portPath = buildPath(port, min, max, W, eqH);
  const benchPath = buildPath(bench, min, max, W, eqH);

  const dd = drawdownSeries(port);
  const ddMin = Math.min(...dd, -0.01); // en kötü
  const ddPath = buildPath(dd, ddMin, 0, W, ddH);
  // drawdown alanını kapat (taban = 0 çizgisi, en üstte)
  const ddArea = ddPath
    ? `${ddPath} L${W},0 L0,0 Z`
    : "";

  const finalPort = port[port.length - 1];
  const finalBench = bench[bench.length - 1];
  const portUp = finalPort >= 100;

  return (
    <div>
      {/* equity curve */}
      <svg
        viewBox={`0 0 ${W} ${eqH}`}
        preserveAspectRatio="none"
        className="w-full"
        style={{ height: eqH }}
      >
        {/* benchmark — soluk kesikli */}
        <path
          d={benchPath}
          fill="none"
          stroke="rgba(255,255,255,0.28)"
          strokeWidth={1.5}
          strokeDasharray="4 4"
          vectorEffect="non-scaling-stroke"
        />
        {/* portföy — vurgulu çizgi */}
        <path
          d={portPath}
          fill="none"
          stroke={portUp ? UP : DOWN}
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {/* drawdown şeridi */}
      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-wide text-white/35">
          <span>Düşüş</span>
          <span style={{ color: DOWN }}>%{ddMin.toFixed(1)} maks</span>
        </div>
        <svg
          viewBox={`0 0 ${W} ${ddH}`}
          preserveAspectRatio="none"
          className="w-full"
          style={{ height: ddH }}
        >
          <path d={ddArea} fill="rgba(255,92,92,0.18)" />
          <path
            d={ddPath}
            fill="none"
            stroke={DOWN}
            strokeWidth={1.25}
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>

      {/* legend */}
      <div className="mt-3 flex items-center gap-5 text-xs">
        <span className="flex items-center gap-1.5 text-white/70">
          <span
            className="inline-block h-0.5 w-4 rounded-full"
            style={{ background: portUp ? UP : DOWN }}
          />
          Portföy
          <span style={{ color: portUp ? UP : DOWN }}>
            {portUp ? "+" : ""}
            {(finalPort - 100).toFixed(1)}%
          </span>
        </span>
        <span className="flex items-center gap-1.5 text-white/45">
          <span
            className="inline-block h-0.5 w-4 rounded-full"
            style={{ background: "rgba(255,255,255,0.4)" }}
          />
SPY karşılaştırma
          <span className="text-white/55">
            {finalBench >= 100 ? "+" : ""}
            {(finalBench - 100).toFixed(1)}%
          </span>
        </span>
      </div>
    </div>
  );
}

/* ----------------------- INVEST BASKET (client island) ----------------------- */

type BasketHolding = { symbol: string; pct: number };

function fmtUsd0(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
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

/**
 * "Invest" CTA — bir sepeti ağırlığına göre canlı fiyattan paper-store'a alır.
 * Tutar girişi + alım gücü kontrolü + başarı durumu + bildirim.
 * Server component sayfalarından (örn. portfolios/[slug]) çağrılabilen client island.
 */
export function InvestBasket({
  name,
  holdings,
  defaultAmount = 1000,
}: {
  name: string;
  holdings: BasketHolding[];
  defaultAmount?: number;
}) {
  const [amount, setAmount] = useState(String(defaultAmount));
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const confirm = useConfirm();

  async function invest() {
    const dollars = parseFloat(amount);
    if (!Number.isFinite(dollars) || dollars <= 0) {
      setError("Geçerli bir tutar girin.");
      return;
    }
    const { cash } = paperStore.get();
    if (dollars > cash) {
      setError(`Yetersiz alım gücü. Kullanılabilir: ${fmtUsd0(cash)}.`);
      return;
    }
    const ok = await confirm({
      title: "Yatırımı onayla",
      message: `${name} sepetine ${fmtUsd0(dollars)} yatırılacak ve sepetteki varlıklar ağırlığına göre satın alınacak.`,
      confirmLabel: "Yatır",
      cancelLabel: "Vazgeç",
      tone: "buy",
    });
    if (!ok) return;
    setError(null);
    setBusy(true);

    const syms = holdings.map((h) => h.symbol);
    const prices = await fetchQuotes(syms);

    let placed = 0;
    for (const h of holdings) {
      const price = prices[h.symbol] ?? getUniverseEntry(h.symbol).basePrice;
      if (!price || price <= 0) continue;
      const alloc = (dollars * h.pct) / 100;
      const shares = +(alloc / price).toFixed(6);
      if (shares <= 0) continue;
      const r = paperStore.placeOrder({ side: "BUY", symbol: h.symbol, shares, price });
      if (r.ok) placed++;
    }

    setBusy(false);
    if (placed > 0) {
      setDone(true);
      notifStore.push(
        "order",
        `${name} portföyüne ${fmtUsd0(dollars)} yatırıldı (${placed} pozisyon)`,
      );
    } else {
      setError("Emirler oluşturulamadı — alım gücünüzü kontrol edin.");
    }
  }

  return (
    <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
      <div
        className="flex items-center gap-2 rounded-full border px-4"
        style={{ borderColor: "var(--ais-line-strong)", background: "var(--ais-surface)" }}
      >
        <span className="text-sm text-[var(--ais-fg-faint)]">$</span>
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
          inputMode="decimal"
          className="w-24 bg-transparent py-2.5 text-sm text-[var(--ais-fg)] placeholder:text-[var(--ais-fg-faint)] focus:outline-none"
          placeholder="Tutar"
        />
      </div>
      <button
        onClick={invest}
        disabled={busy}
        className="flex h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full px-7 text-sm font-bold text-white transition hover:brightness-105 disabled:opacity-60"
        style={{ background: "var(--ais-accent)" }}
      >
        {busy ? (
          "Yatırılıyor…"
        ) : done ? (
          <>
            <Check size={16} strokeWidth={2.5} />
            Yatırıldı
          </>
        ) : (
          `${fmtUsd0(parseFloat(amount) || 0)} yatır`
        )}
      </button>
      {error && (
        <span className="text-xs sm:self-center" style={{ color: DOWN }}>
          {error}
        </span>
      )}
    </div>
  );
}
