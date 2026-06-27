import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Topbar } from "@/components/dashboard/topbar";
import { TickerBadge } from "@/components/dashboard/ui";
import { AreaChart } from "@/components/dashboard/area-chart";
import { InvestBasket } from "@/components/dashboard/backtest-chart";
import {
  SMART_PORTFOLIOS,
  getSmartPortfolio,
  getPortfolioHoldings,
  getPortfolioCurve,
  type RiskLevel,
} from "@/lib/dashboard/smart-portfolios";
import { ArrowLeft, Sparkles, RefreshCw, ShieldCheck } from "lucide-react";

// Didit açık-tema renkleri — beyaz zeminde okunur.
const UP = "var(--ais-green)";
const DOWN = "#d93025";
const ACCENT = "var(--ais-accent)";

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

// Risk seviyesine göre renk + 1–10 puan (segment bar için).
const RISK_COLORS: Record<RiskLevel, string> = {
  Low: UP,
  Moderate: "#b8860b",
  High: DOWN,
};
const RISK_SCORE: Record<RiskLevel, number> = {
  Low: 3,
  Moderate: 6,
  High: 9,
};

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

  const riskColor = RISK_COLORS[portfolio.risk];
  const riskScore = RISK_SCORE[portfolio.risk];

  const stats: { label: string; value: string; color?: string }[] = [
    {
      label: "1Y getiri",
      value: `${up ? "+" : ""}${portfolio.return1y.toFixed(1)}%`,
      color: up ? UP : DOWN,
    },
    {
      label: "3Y getiri",
      value: `${up3 ? "+" : ""}${portfolio.return3y.toFixed(1)}%`,
      color: up3 ? UP : DOWN,
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

  const maxPct = Math.max(...holdings.map((h) => h.pct), 1);

  return (
    <>
      <Topbar title={portfolio.name} />
      <div className="ais ais-light min-h-[calc(100vh-64px)]">
        <div className="mx-auto max-w-5xl px-8 py-10">
          {/* ───────── Geri ───────── */}
          <Link
            href="/dashboard/portfolios"
            className="inline-flex items-center gap-1.5 text-[12.5px] text-[var(--ais-fg-muted)] transition hover:text-[var(--ais-fg)]"
          >
            <ArrowLeft size={15} />
            Tüm Akıllı Portföyler
          </Link>

          {/* ───────── Başlık ───────── */}
          <div className="mt-5 flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="max-w-2xl">
              <h1 className="d-title">{portfolio.name}</h1>
              <p className="d-subtitle mt-2 leading-relaxed">{portfolio.detail}</p>
            </div>
            <div className="shrink-0">
              <InvestBasket
                name={portfolio.name}
                holdings={holdings.map((h) => ({ symbol: h.symbol, pct: h.pct }))}
                defaultAmount={portfolio.minInvest}
              />
            </div>
          </div>

          {/* ───────── Genel bakış (kutusuz ızgara-ayraçlı şerit) ───────── */}
          <div
            className="mt-9 grid grid-cols-2 gap-px overflow-hidden rounded-xl border lg:grid-cols-4"
            style={{ borderColor: "var(--ais-line)", background: "var(--ais-line)" }}
          >
            {stats.map((s) => (
              <div key={s.label} className="bg-[var(--ais-surface)] px-5 py-4">
                <p className="text-[11.5px] text-[var(--ais-fg-faint)]">{s.label}</p>
                <p
                  className="num mt-2 text-[19px] font-medium tracking-tight"
                  style={{ color: s.color ?? "var(--ais-fg)" }}
                >
                  {s.value}
                </p>
              </div>
            ))}
          </div>

          {/* ───────── Performans + risk ───────── */}
          <div
            className="mt-10 grid gap-8 border-t pt-8 lg:grid-cols-3"
            style={{ borderColor: "var(--ais-line)" }}
          >
            <div className="lg:col-span-2">
              <h2 className="d-section mb-1">Performans</h2>
              <p className="mb-4 text-[12.5px] text-[var(--ais-fg-muted)]">
                100&apos;e endekslendi · son 12 ay.
              </p>
              <div
                className="rounded-xl border p-4"
                style={{ borderColor: "var(--ais-line)", background: "var(--ais-surface)" }}
              >
                <div className="h-[260px]">
                  <AreaChart data={curve} positive={up} />
                </div>
              </div>
            </div>

            <div>
              <h2 className="d-section mb-1">Risk profili</h2>
              <p className="mb-4 text-[12.5px] text-[var(--ais-fg-muted)]">Seviye ve sepet kuralları.</p>
              <div
                className="rounded-xl border p-6"
                style={{ borderColor: "var(--ais-line)", background: "var(--ais-surface)" }}
              >
                {/* Skor — Didit tarzı temiz sayı + segment bar (radial yerine) */}
                <div className="flex items-baseline gap-1.5">
                  <span
                    className="num text-[40px] font-semibold leading-none"
                    style={{ color: riskColor }}
                  >
                    {riskScore}
                  </span>
                  <span className="text-[15px] text-[var(--ais-fg-faint)]">/ 10</span>
                </div>
                <p className="mt-2 text-[13px] font-medium text-[var(--ais-fg)]">
                  {trRisk(portfolio.risk)} risk
                </p>
                {/* 10 segmentli bar */}
                <div className="mt-3 flex gap-1">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <span
                      key={i}
                      className="h-1.5 flex-1 rounded-full"
                      style={{
                        background: i < riskScore ? riskColor : "var(--ais-surface-2)",
                      }}
                    />
                  ))}
                </div>

                <div className="mt-6 space-y-3">
                  {[
                    ["Dengeleme", trRebalance(portfolio.rebalance)],
                    ["Varlıklar", `${holdings.length} varlık`],
                    ["Gider oranı", `${portfolio.expense.toFixed(2)}%`],
                  ].map(([l, v]) => (
                    <div
                      key={l}
                      className="flex items-center justify-between border-b pb-3 text-[13px] last:border-0 last:pb-0"
                      style={{ borderColor: "var(--ais-line)" }}
                    >
                      <span className="text-[var(--ais-fg-muted)]">{l}</span>
                      <span className="num font-medium text-[var(--ais-fg)]">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ───────── Dağılım (varlıklar + ağırlık barları) ───────── */}
          <section className="mt-10 border-t pt-8" style={{ borderColor: "var(--ais-line)" }}>
            <div className="mb-5 flex items-end justify-between gap-3">
              <div>
                <h2 className="d-section">Dağılım</h2>
                <p className="mt-1 text-[12.5px] text-[var(--ais-fg-muted)]">
                  Sepetin varlık ağırlıkları.
                </p>
              </div>
              <span className="text-[12px] text-[var(--ais-fg-faint)]">{holdings.length} varlık</span>
            </div>

            <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "var(--ais-line)" }}>
              <table className="ais-dt min-w-[640px]">
                <thead>
                  <tr>
                    <th>VARLIK</th>
                    <th>SEKTÖR</th>
                    <th>AĞIRLIK</th>
                    <th className="!text-right">PAY</th>
                  </tr>
                </thead>
                <tbody>
                  {holdings.map((h, i) => (
                    <tr key={h.symbol}>
                      <td>
                        <div className="flex items-center gap-3">
                          <TickerBadge symbol={h.symbol} size={30} />
                          <div className="min-w-0">
                            <p className="text-[13px] font-medium text-[var(--ais-fg)]">{h.symbol}</p>
                            <p className="truncate text-[12px] text-[var(--ais-fg-muted)]">{h.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="text-[12.5px] text-[var(--ais-fg-muted)]">{h.sector}</td>
                      <td>
                        <div
                          className="h-1.5 w-32 overflow-hidden rounded-full"
                          style={{ background: "var(--ais-surface-2)" }}
                        >
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${(h.pct / maxPct) * 100}%`,
                              background: ACCENT,
                              opacity: [1, 0.82, 0.66, 0.52, 0.4, 0.3][i % 6],
                            }}
                          />
                        </div>
                      </td>
                      <td className="num !text-right font-medium text-[var(--ais-fg)]">
                        {h.pct.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* ───────── Nasıl çalışır ───────── */}
          <section className="mt-10 border-t pt-8" style={{ borderColor: "var(--ais-line)" }}>
            <h2 className="d-section mb-5">Nasıl çalışır</h2>
            <div
              className="rounded-xl border p-6"
              style={{ borderColor: "var(--ais-line)", background: "var(--ais-surface)" }}
            >
              <div className="grid gap-6 sm:grid-cols-3">
                {[
                  {
                    icon: Sparkles,
                    title: "Yapay zeka ile oluşturulur",
                    body: "Finovela, varlıkları tema etrafında seçip ağırlıklandırır; kararlılık ile yoğunlaşma riskini dengeler.",
                  },
                  {
                    icon: RefreshCw,
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
                        style={{ background: "var(--ais-accent-bg)", color: ACCENT }}
                      >
                        <StepIcon size={18} />
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
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
