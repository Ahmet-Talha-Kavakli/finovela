"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Topbar } from "@/components/dashboard/topbar";
import {
  PageTitle,
  SectionCard,
  Card,
  Metric,
  Btn,
  EmptyState,
  AIS_UP,
  AIS_DOWN,
} from "@/components/dashboard/ais-kit";
import { TickerBadge } from "@/components/dashboard/ticker-badge";
import { fmtUsd } from "@/lib/dashboard/data";
import { paperStore } from "@/lib/dashboard/paper-store";
import { notifStore } from "@/lib/dashboard/use-notifications";
import { useConfirm } from "@/components/dashboard/confirm";
import { getUniverseEntry } from "@/lib/market/universe";
import {
  unrealized,
  harvestOpportunities,
  harvestTotals,
  realizedSummary,
  type TaxLot,
  type HarvestOpportunity,
} from "@/lib/dashboard/tax";
import { Scales, ArrowsClockwise } from "@phosphor-icons/react";

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
  const [now] = useState(() => Date.now());

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
      <div className="ais min-h-[calc(100vh-64px)]">
        <div className="max-w-7xl px-8 py-10">
          <PageTitle
            title="Vergi Merkezi"
            desc="Gerçekleşmemiş kazançlarını izle, zarar hasadı yap ve vergini azalt."
          />

          {/* ── Summary tiles ─────────────────────────────────── */}
          <SectionCard label="Genel bakış" className="mt-10" bodyClassName="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Metric
              label="Gerçekleşmemiş K/Z"
              value={`${totalUnrealized >= 0 ? "+" : ""}${fmtUsd(totalUnrealized)}`}
              color={totalUnrealized >= 0 ? AIS_UP : AIS_DOWN}
            />
            <Metric label="Hasat edilebilir zarar" value={fmtUsd(-totals.totalLoss)} color={AIS_DOWN} />
            <Metric label="Tahmini vergi tasarrufu" value={`+${fmtUsd(totals.totalTaxSaved)}`} color={AIS_UP} />
            <Metric label="Tahmini ödenecek vergi (gerçekleşen)" value={fmtUsd(realized.estTaxOwed)} />
          </SectionCard>

          {/* ── Tax bracket selector ──────────────────────────── */}
          <SectionCard label="Vergi dilimi" className="mt-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[13px] text-[var(--ais-fg-muted)]">Marjinal vergi diliminiz</span>
              <div className="flex gap-1.5">
                {TAX_RATES.map((r) => (
                  <button
                    key={r}
                    onClick={() => setTaxRate(r)}
                    className={`num rounded-lg border px-3 py-1.5 text-[12.5px] transition ${
                      taxRate === r
                        ? "border-[var(--ais-accent)]/50 text-[var(--ais-fg)]"
                        : "border-[var(--ais-line-strong)] text-[var(--ais-fg-muted)] hover:text-[var(--ais-fg)]"
                    }`}
                    style={taxRate === r ? { background: "var(--ais-accent-bg)" } : undefined}
                  >
                    {r}%
                  </button>
                ))}
              </div>
              <span className="ml-auto text-[12px] text-[var(--ais-fg-faint)]">
                Kısa vadeli kazançlar dilim oranıyla, uzun vadeli %15 ile vergilendirilir.
              </span>
            </div>
          </SectionCard>

          {/* ── Tax-loss harvesting ───────────────────────────── */}
          <SectionCard
            label="Vergi-zarar hasadı fırsatları"
            className="mt-3"
            desc="Zarardaki pozisyonları gerçekleştirerek vergi yükünü düşür."
            bodyClassName={opps.length === 0 ? "p-0" : undefined}
          >
            {opps.length === 0 ? (
              <EmptyState
                icon={Scales}
                title="Hasat edilecek pozisyon yok"
                desc="Şu anda zararda olan pozisyon yok. Piyasa hareket ettiğinde tekrar göz atın."
              />
            ) : (
              <div className="space-y-3">
                {opps.map((o) => (
                <Card
                  key={o.symbol}
                  className="grid grid-cols-1 items-center gap-4 sm:grid-cols-[200px_minmax(0,1fr)_auto] lg:grid-cols-[220px_120px_120px_minmax(0,1fr)_auto]"
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
                    <p className="num text-[14px] font-medium" style={{ color: AIS_DOWN }}>
                      {fmtUsd(-o.unrealizedLoss)}
                    </p>
                  </div>

                  {/* Vergi tasarrufu */}
                  <div className="hidden lg:block">
                    <p className="text-[12px] text-[var(--ais-fg-faint)]">Vergi tasarrufu</p>
                    <p className="num text-[14px] font-medium" style={{ color: AIS_UP }}>
                      +{fmtUsd(o.estTaxSaved)}
                    </p>
                  </div>

                  {/* Zarar + tasarruf (sadece sm..lg arası, tek satır) */}
                  <div className="flex flex-wrap gap-x-6 gap-y-1 lg:hidden">
                    <div>
                      <p className="text-[12px] text-[var(--ais-fg-faint)]">Zarar</p>
                      <p className="num text-[14px] font-medium" style={{ color: AIS_DOWN }}>
                        {fmtUsd(-o.unrealizedLoss)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[12px] text-[var(--ais-fg-faint)]">Vergi tasarrufu</p>
                      <p className="num text-[14px] font-medium" style={{ color: AIS_UP }}>
                        +{fmtUsd(o.estTaxSaved)}
                      </p>
                    </div>
                  </div>

                  {/* Yerine al */}
                  <div className="min-w-0">
                    <p className="flex items-center gap-1 text-[12px] text-[var(--ais-fg-faint)]">
                      <ArrowsClockwise size={12} weight="regular" /> Yerine al
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
                    <Btn
                      variant="primary"
                      onClick={() => harvest(o)}
                      disabled={busy === o.symbol}
                      className="w-full sm:w-auto"
                    >
                      {busy === o.symbol ? "Hasat ediliyor…" : "Hasat et"}
                    </Btn>
                  </div>
                </Card>
                ))}
              </div>
            )}
          </SectionCard>

          {/* ── Unrealized gains/losses ───────────────────────── */}
          <SectionCard label="Gerçekleşmemiş kâr & zararlar" className="mt-3" bodyClassName="p-0">
            <div className="overflow-x-auto p-2">
              <table className="ais-dt min-w-[640px]">
                <thead>
                  <tr>
                    <th className="text-left">Sembol</th>
                    <th className="text-right">Adet</th>
                    <th className="text-right">Maliyet</th>
                    <th className="text-right">Piyasa değeri</th>
                    <th className="text-right">Kâr / zarar</th>
                    <th className="text-right">%</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.symbol}>
                      <td className="font-medium text-[var(--ais-fg)]">{r.symbol}</td>
                      <td className="num text-right">{r.shares}</td>
                      <td className="num text-right">{fmtUsd(r.costBasis)}</td>
                      <td className="num text-right">{fmtUsd(r.marketValue)}</td>
                      <td className="num text-right font-medium" style={{ color: r.gain >= 0 ? AIS_UP : AIS_DOWN }}>
                        {r.gain >= 0 ? "+" : ""}{fmtUsd(r.gain)}
                      </td>
                      <td className="num text-right font-medium" style={{ color: r.gain >= 0 ? AIS_UP : AIS_DOWN }}>
                        {r.gainPct >= 0 ? "+" : ""}{r.gainPct.toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-[var(--ais-fg-muted)]">
                        Henüz pozisyon yok.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </SectionCard>

          {/* ── Realized summary ──────────────────────────────── */}
          <SectionCard label="Gerçekleşen kazançlar (yıl başından bugüne)" className="mt-3" bodyClassName="grid gap-3 sm:grid-cols-3">
            <Metric
              label="Kısa vadeli"
              value={`${realized.shortTermGain >= 0 ? "+" : ""}${fmtUsd(realized.shortTermGain)}`}
              color={realized.shortTermGain >= 0 ? AIS_UP : AIS_DOWN}
            />
            <Metric
              label="Uzun vadeli"
              value={`${realized.longTermGain >= 0 ? "+" : ""}${fmtUsd(realized.longTermGain)}`}
              color={realized.longTermGain >= 0 ? AIS_UP : AIS_DOWN}
            />
            <Metric
              label={`Toplam gerçekleşen · ${realized.trades} satış`}
              value={`${realized.totalRealized >= 0 ? "+" : ""}${fmtUsd(realized.totalRealized)}`}
              color={realized.totalRealized >= 0 ? AIS_UP : AIS_DOWN}
            />
          </SectionCard>
        </div>
      </div>
    </>
  );
}
