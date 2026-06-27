"use client";

/**
 * Finovela Vergi Merkezi — gerçekleşmemiş K/Z, zarar hasadı, gerçekleşen özet.
 * Tasarım dili: Didit (business.didit.me) — açık tema, kutusuz, border-t ayraçlı
 * bölümler, ızgara-ayraçlı metrik şeridi, ais-dt dense tablo, token renkleri.
 */

import { useEffect, useState, useSyncExternalStore } from "react";
import { Topbar } from "@/components/dashboard/topbar";
import { TickerBadge } from "@/components/dashboard/ticker-badge";
import { fmtUsd } from "@/lib/dashboard/data";
import { paperStore } from "@/lib/dashboard/paper-store";
import { notifStore } from "@/lib/dashboard/use-notifications";
import { useConfirm } from "@/components/dashboard/confirm";
import { PlanGate } from "@/components/dashboard/plan-gate";
import { getUniverseEntry } from "@/lib/market/universe";
import {
  unrealized,
  harvestOpportunities,
  harvestTotals,
  realizedSummary,
  type TaxLot,
  type HarvestOpportunity,
} from "@/lib/dashboard/tax";
import { Scale, RefreshCw } from "lucide-react";

// Didit açık-tema renkleri — beyaz zeminde okunur.
const UP = "var(--ais-green)";
const DOWN = "#d93025";

const TAX_RATES = [15, 24, 32, 37];

export default function TaxPage() {
  // paperStore'a abone ol (holdings + orders canlı).
  const paper = useSyncExternalStore(
    (cb) => paperStore.subscribe(cb),
    () => paperStore.get(),
    () => paperStore.get(),
  );

  const [prices, setPrices] = useState<Record<string, number>>({});
  const [taxRate, setTaxRate] = useState(24);
  const [busy, setBusy] = useState<string | null>(null);
  const confirm = useConfirm();
  // Referans tarihi bir kez sabitle (render sırasında Date.now() çağırma).
  const [now] = useState(() => (typeof window === "undefined" ? 0 : Date.now()));

  // Canlı fiyatları çek.
  useEffect(() => {
    const symbols = paper.holdings.map((h) => h.symbol).join(",");
    if (!symbols) return;
    fetch(`/api/market/quote?symbols=${symbols}`)
      .then((r) => r.json())
      .then((d: { quotes?: { symbol: string; price: number }[] }) => {
        if (!d.quotes) return;
        const map: Record<string, number> = {};
        for (const q of d.quotes) map[q.symbol] = q.price;
        setPrices(map);
      })
      .catch(() => {});
  }, [paper.holdings]);

  // Lot'ları kur (canlı fiyatla; fiyat yoksa avgCost'a düş → 0 P/L).
  const lots: TaxLot[] = paper.holdings.map((h) => ({
    symbol: h.symbol,
    shares: h.shares,
    avgCost: h.avgCost,
    price: prices[h.symbol] ?? h.avgCost,
  }));

  const rows = unrealized(lots);
  const opps = harvestOpportunities(lots, taxRate);
  const totals = harvestTotals(opps);
  const realized = realizedSummary(
    paper.orders.map((o) => ({ side: o.side, symbol: o.symbol, shares: o.shares, price: o.price, ts: o.ts })),
    now,
    taxRate,
    15,
  );

  const totalUnrealized = rows.reduce((s, r) => s + r.gain, 0);

  async function harvest(o: HarvestOpportunity) {
    if (busy) return;
    const ok = await confirm({
      title: "Hasadı onayla",
      message: `${o.symbol} pozisyonu satılacak (${fmtUsd(-o.unrealizedLoss)} zarar gerçekleşecek)${o.replacement ? ` ve yerine ${o.replacement} alınacak` : ""}. Tahmini vergi tasarrufu ~${fmtUsd(o.estTaxSaved)}.`,
      confirmLabel: "Mahsup et",
      cancelLabel: "Vazgeç",
      tone: "danger",
    });
    if (!ok) return;
    setBusy(o.symbol);
    try {
      // Zarardaki pozisyonu sat.
      const sell = paperStore.placeOrder({
        side: "SELL",
        symbol: o.symbol,
        shares: o.shares,
        price: +(o.marketValue / o.shares).toFixed(2),
      });
      if (!sell.ok) {
        notifStore.push("info", `Hasat başarısız: ${sell.error ?? "satılamadı"} ${o.symbol}`);
        return;
      }
      // Wash-sale güvenli ikameyi al (varsa, fiyatını çek).
      if (o.replacement) {
        try {
          const res = await fetch(`/api/market/quote?symbol=${o.replacement}`);
          const json = (await res.json()) as { quote?: { price: number } };
          const repPrice = json.quote?.price ?? getUniverseEntry(o.replacement).basePrice;
          const shares = +(o.marketValue / repPrice).toFixed(4);
          if (shares > 0) {
            paperStore.placeOrder({ side: "BUY", symbol: o.replacement, shares, price: repPrice });
          }
        } catch {
          /* ikame alımı başarısız olsa da zarar gerçekleşti */
        }
      }
      notifStore.push(
        "order",
        `${o.symbol} hasat edildi: ${fmtUsd(-o.unrealizedLoss)} zarar gerçekleşti, ~${fmtUsd(o.estTaxSaved)} vergi tasarrufu${o.replacement ? ` → ${o.replacement} alındı` : ""}`,
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <Topbar title="Vergi Merkezi" />
      <PlanGate feature="taxCenter">
      <div className="ais ais-light min-h-[calc(100vh-64px)]">
        <div className="mx-auto max-w-5xl px-8 py-10">
          {/* ───────── Başlık ───────── */}
          <div>
            <h1 className="d-title">Vergi Merkezi</h1>
            <p className="d-subtitle mt-2 max-w-2xl leading-relaxed">
              Gerçekleşmemiş kazançlarını izle, zarar hasadı yap ve vergini azalt.
            </p>
          </div>

          {/* ───────── Genel bakış (kutusuz ızgara-ayraçlı şerit) ───────── */}
          <div
            className="mt-9 grid grid-cols-2 gap-px overflow-hidden rounded-xl border lg:grid-cols-4"
            style={{ borderColor: "var(--ais-line)", background: "var(--ais-line)" }}
          >
            <Stat
              label="Gerçekleşmemiş K/Z"
              value={`${totalUnrealized >= 0 ? "+" : ""}${fmtUsd(totalUnrealized)}`}
              color={totalUnrealized >= 0 ? UP : DOWN}
            />
            <Stat label="Hasat edilebilir zarar" value={fmtUsd(-totals.totalLoss)} color={DOWN} />
            <Stat label="Tahmini vergi tasarrufu" value={`+${fmtUsd(totals.totalTaxSaved)}`} color={UP} />
            <Stat label="Tahmini ödenecek vergi (gerçekleşen)" value={fmtUsd(realized.estTaxOwed)} />
          </div>

          {/* ───────── Vergi dilimi ───────── */}
          <section className="mt-10 border-t pt-8" style={{ borderColor: "var(--ais-line)" }}>
            <h2 className="d-section mb-5">Vergi dilimi</h2>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[13px] text-[var(--ais-fg-muted)]">Marjinal vergi diliminiz</span>
              <div className="flex gap-1.5">
                {TAX_RATES.map((r) => {
                  const on = taxRate === r;
                  return (
                    <button
                      key={r}
                      onClick={() => setTaxRate(r)}
                      className="num rounded-lg border px-3 py-1.5 text-[12.5px] font-medium transition"
                      style={{
                        borderColor: on ? "var(--ais-accent)" : "var(--ais-line-strong)",
                        background: on ? "var(--ais-accent-bg)" : "transparent",
                        color: on ? "var(--ais-fg)" : "var(--ais-fg-muted)",
                      }}
                    >
                      {r}%
                    </button>
                  );
                })}
              </div>
              <span className="ml-auto text-[12px] text-[var(--ais-fg-faint)]">
                Kısa vadeli kazançlar dilim oranıyla, uzun vadeli %15 ile vergilendirilir.
              </span>
            </div>
          </section>

          {/* ───────── Vergi-zarar hasadı fırsatları ───────── */}
          <section className="mt-10 border-t pt-8" style={{ borderColor: "var(--ais-line)" }}>
            <div className="mb-5">
              <h2 className="d-section">Vergi-zarar hasadı fırsatları</h2>
              <p className="mt-1 text-[12.5px] text-[var(--ais-fg-muted)]">
                Zarardaki pozisyonları gerçekleştirerek vergi yükünü düşür.
              </p>
            </div>

            {opps.length === 0 ? (
              <div
                className="rounded-xl border border-dashed px-6 py-16 text-center"
                style={{ borderColor: "var(--ais-line-strong)" }}
              >
                <Scale size={22} className="mx-auto text-[var(--ais-fg-faint)]" />
                <p className="mt-3 text-[14px] font-medium text-[var(--ais-fg)]">Hasat edilecek pozisyon yok</p>
                <p className="mx-auto mt-1 max-w-sm text-[12.5px] text-[var(--ais-fg-muted)]">
                  Şu anda zararda olan pozisyon yok. Piyasa hareket ettiğinde tekrar göz atın.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {opps.map((o) => (
                  <div
                    key={o.symbol}
                    className="grid grid-cols-1 items-center gap-4 rounded-xl border p-4 sm:grid-cols-[200px_minmax(0,1fr)_auto] lg:grid-cols-[220px_120px_120px_minmax(0,1fr)_auto]"
                    style={{ borderColor: "var(--ais-line)", background: "var(--ais-surface)" }}
                  >
                    {/* Sembol */}
                    <div className="flex items-center gap-3">
                      <TickerBadge symbol={o.symbol} />
                      <div className="min-w-0">
                        <p className="text-[13.5px] font-medium text-[var(--ais-fg)]">{o.symbol}</p>
                        <p className="num text-[12px] text-[var(--ais-fg-faint)]">
                          {o.shares} adet · {fmtUsd(o.marketValue)}
                        </p>
                      </div>
                    </div>

                    {/* Zarar */}
                    <div className="hidden lg:block">
                      <p className="text-[12px] text-[var(--ais-fg-faint)]">Zarar</p>
                      <p className="num text-[14px] font-medium" style={{ color: DOWN }}>
                        {fmtUsd(-o.unrealizedLoss)}
                      </p>
                    </div>

                    {/* Vergi tasarrufu */}
                    <div className="hidden lg:block">
                      <p className="text-[12px] text-[var(--ais-fg-faint)]">Vergi tasarrufu</p>
                      <p className="num text-[14px] font-medium" style={{ color: UP }}>
                        +{fmtUsd(o.estTaxSaved)}
                      </p>
                    </div>

                    {/* Zarar + tasarruf (sadece sm..lg arası, tek satır) */}
                    <div className="flex flex-wrap gap-x-6 gap-y-1 lg:hidden">
                      <div>
                        <p className="text-[12px] text-[var(--ais-fg-faint)]">Zarar</p>
                        <p className="num text-[14px] font-medium" style={{ color: DOWN }}>
                          {fmtUsd(-o.unrealizedLoss)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[12px] text-[var(--ais-fg-faint)]">Vergi tasarrufu</p>
                        <p className="num text-[14px] font-medium" style={{ color: UP }}>
                          +{fmtUsd(o.estTaxSaved)}
                        </p>
                      </div>
                    </div>

                    {/* Yerine al */}
                    <div className="min-w-0">
                      <p className="flex items-center gap-1 text-[12px] text-[var(--ais-fg-faint)]">
                        <RefreshCw size={12} /> Yerine al
                      </p>
                      <p className="mt-0.5 flex items-baseline gap-1.5">
                        <span className="text-[13.5px] font-medium text-[var(--ais-fg)]">
                          {o.replacement ?? "—"}
                        </span>
                        <span className="truncate text-[12px] text-[var(--ais-fg-muted)]">
                          {o.replacementNote}
                        </span>
                      </p>
                    </div>

                    {/* Hasat et */}
                    <div className="sm:justify-self-end">
                      <button
                        onClick={() => harvest(o)}
                        disabled={busy === o.symbol}
                        className="inline-flex h-9 w-full items-center justify-center rounded-lg px-4 text-[13px] font-medium text-white transition disabled:opacity-40 sm:w-auto"
                        style={{ background: "var(--ais-accent)" }}
                      >
                        {busy === o.symbol ? "Hasat ediliyor…" : "Hasat et"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ───────── Gerçekleşmemiş kâr & zararlar ───────── */}
          <section className="mt-10 border-t pt-8" style={{ borderColor: "var(--ais-line)" }}>
            <h2 className="d-section mb-5">Gerçekleşmemiş kâr & zararlar</h2>
            <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "var(--ais-line)" }}>
              <table className="ais-dt min-w-[640px]">
                <thead>
                  <tr>
                    <th>SEMBOL</th>
                    <th className="!text-right">ADET</th>
                    <th className="!text-right">MALİYET</th>
                    <th className="!text-right">PİYASA DEĞERİ</th>
                    <th className="!text-right">KÂR / ZARAR</th>
                    <th className="!text-right">%</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.symbol}>
                      <td className="font-medium text-[var(--ais-fg)]">{r.symbol}</td>
                      <td className="num !text-right text-[var(--ais-fg-muted)]">{r.shares}</td>
                      <td className="num !text-right text-[var(--ais-fg-muted)]">{fmtUsd(r.costBasis)}</td>
                      <td className="num !text-right">{fmtUsd(r.marketValue)}</td>
                      <td className="num !text-right font-medium" style={{ color: r.gain >= 0 ? UP : DOWN }}>
                        {r.gain >= 0 ? "+" : ""}{fmtUsd(r.gain)}
                      </td>
                      <td className="num !text-right font-medium" style={{ color: r.gain >= 0 ? UP : DOWN }}>
                        {r.gainPct >= 0 ? "+" : ""}{r.gainPct.toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-[var(--ais-fg-faint)]">
                        Henüz pozisyon yok.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* ───────── Gerçekleşen kazançlar (kutusuz ızgara-ayraçlı şerit) ───────── */}
          <section className="mt-10 border-t pt-8" style={{ borderColor: "var(--ais-line)" }}>
            <h2 className="d-section mb-5">Gerçekleşen kazançlar (yıl başından bugüne)</h2>
            <div
              className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border sm:grid-cols-3"
              style={{ borderColor: "var(--ais-line)", background: "var(--ais-line)" }}
            >
              <Stat
                label="Kısa vadeli"
                value={`${realized.shortTermGain >= 0 ? "+" : ""}${fmtUsd(realized.shortTermGain)}`}
                color={realized.shortTermGain >= 0 ? UP : DOWN}
              />
              <Stat
                label="Uzun vadeli"
                value={`${realized.longTermGain >= 0 ? "+" : ""}${fmtUsd(realized.longTermGain)}`}
                color={realized.longTermGain >= 0 ? UP : DOWN}
              />
              <Stat
                label={`Toplam gerçekleşen · ${realized.trades} satış`}
                value={`${realized.totalRealized >= 0 ? "+" : ""}${fmtUsd(realized.totalRealized)}`}
                color={realized.totalRealized >= 0 ? UP : DOWN}
              />
            </div>
          </section>
        </div>
      </div>
      </PlanGate>
    </>
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
