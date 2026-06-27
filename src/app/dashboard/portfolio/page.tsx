"use client";

import { Topbar } from "@/components/dashboard/topbar";
import { TickerBadge } from "@/components/dashboard/ui";
import { AreaChart, Sparkline, RadialGauge } from "@/components/dashboard/area-chart";
import { ChartFrame } from "@/components/dashboard/chart-frame";
import { useLivePortfolio } from "@/lib/dashboard/use-portfolio";
import { useEquityCurve } from "@/lib/dashboard/use-equity-curve";
import { ConnectedExchangeCard } from "@/components/dashboard/connected-exchange-card";
import { getUniverseEntry } from "@/lib/market/universe";
import { fmtUsd, fmtMoney } from "@/lib/dashboard/data";
import {
  Card,
  SectionCard,
  Metric,
  Pill,
  AIS_UP,
  AIS_DOWN,
  AIS_ACCENT,
} from "@/components/dashboard/ais-kit";

export default function PortfolioPage() {
  const { positions, summary, orders, risk } = useLivePortfolio();
  const { curve, benchmark } = useEquityCurve("1Y");
  const sorted = [...positions].sort((a, b) => b.value - a.value);

  const bySector = new Map<string, number>();
  for (const p of positions) bySector.set(p.sector, (bySector.get(p.sector) ?? 0) + p.value);
  const totalVal = [...bySector.values()].reduce((a, b) => a + b, 0) || 1;
  const allocation = [...bySector.entries()]
    .map(([sector, value]) => ({ sector, pct: +((value / totalVal) * 100).toFixed(1) }))
    .sort((a, b) => b.pct - a.pct);

  const dayUp = summary.dayPl >= 0;
  const totalUp = summary.totalPl >= 0;

  return (
    <>
      <Topbar title="Portföy" />
      <div className="ais min-h-[calc(100vh-64px)]">
        <div className="max-w-7xl px-8 py-10">
          <h1 className="text-[22px] font-normal tracking-tight text-[var(--ais-fg)]">Portföy</h1>

          {/* ───────── Bağlı borsa (gerçek bakiye) ───────── */}
          <div className="mt-8">
            <ConnectedExchangeCard />
          </div>

          {/* ───────── Genel bakış ───────── */}
          <SectionCard
            label="Genel bakış"
            className="mt-10"
            bodyClassName="grid grid-cols-2 gap-3 lg:grid-cols-4"
          >
            <Metric label="Toplam değer" animate={summary.total} format={(n) => fmtUsd(n)} />
            <Metric
              label="Bugün"
              animate={summary.dayPl}
              format={(n) => `${dayUp ? "+" : ""}${fmtUsd(n)}`}
              sub={`${summary.dayPlPct}%`}
              color={dayUp ? AIS_UP : AIS_DOWN}
            />
            <Metric
              label="Toplam getiri"
              animate={summary.totalPl}
              format={(n) => `${totalUp ? "+" : ""}${fmtUsd(n)}`}
              sub={`${summary.totalPlPct}%`}
              color={totalUp ? AIS_UP : AIS_DOWN}
            />
            <Metric label="Kullanılabilir nakit" animate={summary.cash} format={(n) => fmtUsd(n)} />
          </SectionCard>

          {/* ───────── Performans + dağılım ───────── */}
          <div className="mt-3 grid gap-3 lg:grid-cols-3">
            <SectionCard label="Performans" className="lg:col-span-2">
              <ChartFrame
                title="Performans"
                render={(big) => (
                  <div style={{ height: big ? 440 : 288 }}>
                    <AreaChart data={curve} benchmark={benchmark} positive={summary.totalPl >= 0} />
                  </div>
                )}
              />
            </SectionCard>
            <SectionCard label="Sektöre göre dağılım">
              <div className="space-y-3.5">
                {allocation.map((a, i) => (
                  <div key={a.sector}>
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="text-[var(--ais-fg-muted)]">{a.sector}</span>
                      <span className="num font-medium text-[var(--ais-fg)]">{a.pct}%</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${a.pct}%`,
                          background: AIS_ACCENT,
                          opacity: [1, 0.78, 0.6, 0.46, 0.34, 0.24][i % 6],
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>

          {/* ───────── Portföy riski ───────── */}
          <SectionCard label="Portföy riski" className="mt-3">
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-10">
              <RadialGauge
                value={risk.score * 10}
                label={`${risk.score}`}
                sublabel="/ 10"
                tone={risk.score <= 3 ? "up" : risk.score >= 8 ? "down" : "white"}
              />
              <div className="flex-1">
                <p className="text-[16px] font-medium text-[var(--ais-fg)]">{risk.label}</p>
                <p className="mt-1.5 max-w-md text-[13px] leading-relaxed text-[var(--ais-fg-muted)]">
                  Finovela portföyünüzü yoğunlaşma, tek varlık ağırlığı ve kripto
                  maruziyetine göre 1–10 arası puanlar. Düşük puan daha istikrarlı,
                  yüksek puan daha büyük dalgalanma anlamına gelir.
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:max-w-sm">
                  <div className="ais-card p-3">
                    <p className="text-[12px] text-[var(--ais-fg-faint)]">En büyük pozisyon</p>
                    <p className="num mt-1 text-[14px] font-medium text-[var(--ais-fg)]">{risk.topWeight}%</p>
                  </div>
                  <div className="ais-card p-3">
                    <p className="text-[12px] text-[var(--ais-fg-faint)]">Kripto maruziyeti</p>
                    <p className="num mt-1 text-[14px] font-medium text-[var(--ais-fg)]">{risk.cryptoWeight}%</p>
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* ───────── Tüm varlıklar ───────── */}
          <SectionCard label="Tüm varlıklar" className="mt-3" bodyClassName="p-0">
            <div className="overflow-x-auto p-2">
              <table className="ais-dt min-w-[720px]">
                <thead>
                  <tr>
                    <th className="text-left">Varlık</th>
                    <th className="text-right">Fiyat</th>
                    <th className="text-right">Bugün</th>
                    <th className="text-right">Adet</th>
                    <th className="text-right">Ort. maliyet</th>
                    <th className="text-right">Değer</th>
                    <th className="text-right">Toplam K/Z</th>
                    <th className="text-left">7g</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((p) => (
                    <tr key={p.symbol}>
                      <td>
                        <div className="flex items-center gap-3">
                          <TickerBadge symbol={p.symbol} size={32} />
                          <div>
                            <p className="text-[13px] font-medium text-[var(--ais-fg)]">{p.symbol}</p>
                            <p className="text-[12px] text-[var(--ais-fg-muted)]">{p.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="num text-right font-medium text-[var(--ais-fg)]">
                        {fmtMoney(p.price, getUniverseEntry(p.symbol).currency ?? "USD")}
                      </td>
                      <td className="num text-right" style={{ color: p.changePct >= 0 ? AIS_UP : AIS_DOWN }}>
                        {p.changePct >= 0 ? "+" : ""}
                        {p.changePct}%
                      </td>
                      <td className="num text-right text-[var(--ais-fg-muted)]">
                        {p.shares < 1 ? p.shares.toFixed(4) : p.shares}
                      </td>
                      <td className="num text-right text-[var(--ais-fg-muted)]">{fmtUsd(p.avgCost)}</td>
                      <td className="num text-right font-medium text-[var(--ais-fg)]">{fmtUsd(p.value)}</td>
                      <td className="num text-right" style={{ color: p.pl >= 0 ? AIS_UP : AIS_DOWN }}>
                        {p.pl >= 0 ? "+" : ""}
                        {fmtUsd(p.pl)}
                        <span className="ml-1 text-[11px] opacity-70">({p.plPct}%)</span>
                      </td>
                      <td className="text-left">
                        <Sparkline seed={p.symbol} up={p.plPct >= 0} width={70} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>

          {/* ───────── Son emirler ───────── */}
          {orders.length > 0 && (
            <SectionCard label="Son emirler" className="mt-3">
              <div className="space-y-0.5">
                {orders.slice(0, 8).map((o) => (
                  <div key={o.id} className="ais-row flex items-center gap-3 rounded-lg px-2 py-2.5">
                    <Pill color={o.side === "BUY" ? AIS_UP : AIS_DOWN}>
                      {o.side === "BUY" ? "AL" : "SAT"}
                    </Pill>
                    <span className="text-[13px] font-medium text-[var(--ais-fg)]">{o.symbol}</span>
                    <span className="num text-[12.5px] text-[var(--ais-fg-muted)]">
                      {o.shares < 1 ? o.shares.toFixed(4) : o.shares} @ {fmtUsd(o.price)}
                    </span>
                    <span className="num ml-auto text-[13px] font-medium text-[var(--ais-fg)]">
                      {fmtUsd(o.shares * o.price)}
                    </span>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}
        </div>
      </div>
    </>
  );
}
