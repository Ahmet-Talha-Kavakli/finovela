import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Topbar } from "@/components/dashboard/topbar";
import {
  PageTitle,
  Section,
  Card,
  Metric,
  AIS_ACCENT,
  AIS_UP,
  AIS_DOWN,
} from "@/components/dashboard/ais-kit";
import { TickerBadge } from "@/components/dashboard/ui";
import { AreaChart, RadialGauge, MonoDonut } from "@/components/dashboard/area-chart";
import { InvestBasket } from "@/components/dashboard/backtest-chart";
import {
  SMART_PORTFOLIOS,
  getSmartPortfolio,
  getPortfolioHoldings,
  getPortfolioCurve,
  riskGaugeValue,
} from "@/lib/dashboard/smart-portfolios";
import {
  ArrowLeft,
  Sparkle,
  ArrowsClockwise,
  ShieldCheck,
} from "@phosphor-icons/react/dist/ssr";

// Veri katmanındaki İngilizce değerleri ekranda Türkçe göster (mantık değişmez).
const RISK_LABELS: Record<string, string> = {
  Low: "Düşük",
  Moderate: "Orta",
  High: "Yüksek",
};
const REBALANCE_LABELS: Record<string, string> = {
  Monthly: "Aylık",
  Quarterly: "Üç aylık",
  "Semi-annual": "Altı aylık",
  Annual: "Yıllık",
};
const trRisk = (r: string) => RISK_LABELS[r] ?? r;
const trRebalance = (r: string) => REBALANCE_LABELS[r] ?? r;

export function generateStaticParams() {
  return SMART_PORTFOLIOS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = getSmartPortfolio(slug);
  return { title: p ? `${p.name} — Finovela` : "Akıllı Portföyler — Finovela" };
}

export default async function PortfolioDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const portfolio = getSmartPortfolio(slug);
  if (!portfolio) notFound();

  const holdings = getPortfolioHoldings(portfolio);
  const curve = getPortfolioCurve(portfolio);
  const up = portfolio.return1y >= 0;
  const up3 = portfolio.return3y >= 0;

  const stats: { label: string; value: string; color?: string }[] = [
    {
      label: "1Y getiri",
      value: `${up ? "+" : ""}${portfolio.return1y.toFixed(1)}%`,
      color: up ? AIS_UP : AIS_DOWN,
    },
    {
      label: "3Y getiri",
      value: `${up3 ? "+" : ""}${portfolio.return3y.toFixed(1)}%`,
      color: up3 ? AIS_UP : AIS_DOWN,
    },
    {
      label: "Gider oranı",
      value: `${portfolio.expense.toFixed(2)}%`,
    },
    {
      label: "Minimum",
      value: `$${portfolio.minInvest.toLocaleString("en-US")}`,
    },
  ];

  return (
    <>
      <Topbar title={portfolio.name} />
      <div className="ais min-h-[calc(100vh-64px)]">
        <div className="max-w-7xl px-8 py-10">
          <Link
            href="/dashboard/portfolios"
            className="inline-flex items-center gap-1.5 text-[12.5px] text-[var(--ais-fg-muted)] transition hover:text-[var(--ais-fg)]"
          >
            <ArrowLeft size={15} weight="regular" />
            Tüm Akıllı Portföyler
          </Link>

          {/* header */}
          <div className="mt-5 flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="max-w-2xl">
              <PageTitle
                title={portfolio.name}
                desc={portfolio.detail}
              />
            </div>
            <div className="shrink-0">
              <InvestBasket
                name={portfolio.name}
                holdings={holdings.map((h) => ({ symbol: h.symbol, pct: h.pct }))}
                defaultAmount={portfolio.minInvest}
              />
            </div>
          </div>

          {/* stat row */}
          <Section label="Genel bakış" className="mt-6" />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {stats.map((s) => (
              <Metric key={s.label} label={s.label} value={s.value} color={s.color} />
            ))}
          </div>

          {/* performance + risk */}
          <Section label="Performans" className="mt-10" desc="100'e endekslendi · son 12 ay." />
          <div className="grid gap-3 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <div className="h-[260px]">
                <AreaChart data={curve} positive={up} />
              </div>
            </Card>
            <Card>
              <p className="mb-4 text-[13px] font-medium text-[var(--ais-fg)]">Risk profili</p>
              <div className="flex flex-col items-center">
                <RadialGauge
                  value={riskGaugeValue(portfolio.risk)}
                  label={trRisk(portfolio.risk)}
                  sublabel="Risk seviyesi"
                  tone="white"
                />
                <div className="mt-6 w-full space-y-3">
                  {[
                    ["Dengeleme", trRebalance(portfolio.rebalance)],
                    ["Varlıklar", `${holdings.length} varlık`],
                    ["Gider oranı", `${portfolio.expense.toFixed(2)}%`],
                  ].map(([l, v]) => (
                    <div
                      key={l}
                      className="flex items-center justify-between border-b border-[var(--ais-line)] pb-3 text-[13px] last:border-0 last:pb-0"
                    >
                      <span className="text-[var(--ais-fg-muted)]">{l}</span>
                      <span className="num font-medium text-[var(--ais-fg)]">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {/* allocation: donut + holdings table */}
          <Section label="Dağılım" className="mt-10" desc="Sepetin varlık ağırlıkları." />
          <div className="grid gap-3 lg:grid-cols-3">
            <Card className="flex flex-col items-center justify-center">
              <MonoDonut data={holdings.map((h) => ({ pct: h.pct }))} size={180} />
            </Card>

            <Card className="lg:col-span-2">
              <p className="mb-3 text-[13px] font-medium text-[var(--ais-fg)]">Varlıklar</p>
              <div className="space-y-1">
                {holdings.map((h) => (
                  <div
                    key={h.symbol}
                    className="ais-row flex items-center gap-4 px-2 py-2.5"
                  >
                    <TickerBadge symbol={h.symbol} size={34} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-[var(--ais-fg)]">
                        {h.symbol}
                      </p>
                      <p className="truncate text-[12px] text-[var(--ais-fg-muted)]">{h.name}</p>
                    </div>
                    <span className="hidden text-[12px] text-[var(--ais-fg-faint)] sm:block">
                      {h.sector}
                    </span>
                    <div className="flex w-32 items-center gap-3">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.08]">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${h.pct}%`, background: "rgba(255,255,255,0.55)" }}
                        />
                      </div>
                      <span className="num w-12 text-right text-[13px] font-medium text-[var(--ais-fg)]">
                        {h.pct.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* how it works */}
          <Section label="Nasıl çalışır" className="mt-10" />
          <Card>
            <div className="grid gap-6 sm:grid-cols-3">
              {[
                {
                  icon: Sparkle,
                  title: "Yapay zeka ile oluşturulur",
                  body: "Finovela, varlıkları tema etrafında seçip ağırlıklandırır; kararlılık ile yoğunlaşma riskini dengeler.",
                },
                {
                  icon: ArrowsClockwise,
                  title: `${trRebalance(portfolio.rebalance)} dengeleme`,
                  body: "Sepet otomatik olarak hedef ağırlıklara dengelenir; kazananlar kırpılır, geride kalanlar takviye edilir.",
                },
                {
                  icon: ShieldCheck,
                  title: "Demo hesap",
                  body: "Performansı risksiz takip etmek için simüle nakitle yatırım yapın. Gerçek para kullanılmaz.",
                },
              ].map((step) => {
                const StepIcon = step.icon;
                return (
                  <div key={step.title}>
                    <span
                      className="grid h-9 w-9 place-items-center rounded-lg"
                      style={{ background: `${AIS_ACCENT}1f`, color: AIS_ACCENT }}
                    >
                      <StepIcon size={18} weight="regular" />
                    </span>
                    <h3 className="mt-3 text-[13px] font-medium text-[var(--ais-fg)]">
                      {step.title}
                    </h3>
                    <p className="mt-1.5 text-[12px] leading-relaxed text-[var(--ais-fg-muted)]">
                      {step.body}
                    </p>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
