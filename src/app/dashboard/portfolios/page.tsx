import type { Metadata } from "next";
import Link from "next/link";
import { Topbar } from "@/components/dashboard/topbar";
import { Sparkline } from "@/components/dashboard/area-chart";
import {
  SMART_PORTFOLIOS,
  getPortfolioHoldings,
  type RiskLevel,
} from "@/lib/dashboard/smart-portfolios";
import { ArrowRight, Layers } from "lucide-react";

export const metadata: Metadata = { title: "Akıllı Portföyler — Finovela" };

// Didit açık-tema renkleri — beyaz zeminde okunur.
const UP = "var(--ais-green)";
const DOWN = "#d93025";

const RISK_LABELS: Record<RiskLevel, string> = {
  Low: "Düşük",
  Moderate: "Orta",
  High: "Yüksek",
};

// Risk seviyesine göre renkli pill: düşük=yeşil, orta=sarı, yüksek=kırmızı.
const RISK_COLORS: Record<RiskLevel, string> = {
  Low: UP,
  Moderate: "#b8860b",
  High: DOWN,
};

function RiskPill({ risk }: { risk: RiskLevel }) {
  const color = RISK_COLORS[risk];
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
      style={{ background: `${color}14`, color }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      {RISK_LABELS[risk]} risk
    </span>
  );
}

export default function SmartPortfoliosPage() {
  return (
    <>
      <Topbar title="Akıllı Portföyler" />
      <div className="ais ais-light min-h-[calc(100vh-64px)]">
        <div className="mx-auto max-w-5xl px-8 py-10">
          {/* ───────── Başlık ───────── */}
          <div>
            <h1 className="d-title">Akıllı Portföyler</h1>
            <p className="d-subtitle mt-2 max-w-2xl leading-relaxed">
              Finovela tarafından oluşturulan ve dengelenen temalı sepetler — tek bir kararla koca
              bir fikre dengeli yatırım yaparsınız. Hepsini anında demo hesapta deneyebilirsiniz.
              Gösterilen getiriler simülasyondur.
            </p>
          </div>

          {/* ───────── Katalog ───────── */}
          <section className="mt-10 border-t pt-8" style={{ borderColor: "var(--ais-line)" }}>
            <div className="mb-5">
              <h2 className="d-section">Katalog</h2>
              <p className="mt-1 text-[12.5px] text-[var(--ais-fg-muted)]">Temalı sepetleri inceleyin.</p>
            </div>

            {/* Kutusuz, ince-ayraçlı ızgara (Didit): kartlar tek bir yüzeyde
                hairline çizgilerle bölünür — ferah ve sade. */}
            <div
              className="grid gap-px overflow-hidden rounded-xl border sm:grid-cols-2 xl:grid-cols-3"
              style={{ borderColor: "var(--ais-line)", background: "var(--ais-line)" }}
            >
              {SMART_PORTFOLIOS.map((p) => {
                const holdings = getPortfolioHoldings(p);
                const up = p.return1y >= 0;
                const up3 = p.return3y >= 0;
                return (
                  <Link
                    key={p.slug}
                    href={`/dashboard/portfolios/${p.slug}`}
                    className="group flex flex-col p-5 transition-colors"
                    style={{ background: "var(--ais-surface)" }}
                  >
                    {/* başlık + risk pill (hizalı) */}
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-[15px] font-medium leading-snug text-[var(--ais-fg)]">
                        {p.name}
                      </h3>
                      <RiskPill risk={p.risk} />
                    </div>
                    <p className="mt-2 min-h-[40px] text-[12.5px] leading-relaxed text-[var(--ais-fg-muted)]">
                      {p.thesis}
                    </p>

                    {/* büyük 1Y getiri + belirgin sparkline */}
                    <div className="mt-auto flex items-end justify-between gap-3 pt-5">
                      <div>
                        <p className="text-[11px] uppercase tracking-wide text-[var(--ais-fg-faint)]">
                          1Y getiri
                        </p>
                        <p
                          className="num mt-1 text-[28px] font-medium leading-none tracking-tight"
                          style={{ color: up ? UP : DOWN }}
                        >
                          {up ? "+" : ""}
                          {p.return1y.toFixed(1)}%
                        </p>
                      </div>
                      <Sparkline seed={p.slug} up={up} width={120} height={48} />
                    </div>

                    {/* alt bilgi şeridi: 3Y getiri + varlık sayısı */}
                    <div
                      className="mt-5 flex items-center justify-between border-t pt-4"
                      style={{ borderColor: "var(--ais-line)" }}
                    >
                      <span className="flex items-baseline gap-1.5 text-[12px] text-[var(--ais-fg-muted)]">
                        3Y
                        <span
                          className="num text-[12.5px] font-medium"
                          style={{ color: up3 ? UP : DOWN }}
                        >
                          {up3 ? "+" : ""}
                          {p.return3y.toFixed(1)}%
                        </span>
                      </span>
                      <span className="flex items-center gap-1.5 text-[12px] text-[var(--ais-fg-muted)]">
                        <Layers size={14} />
                        {holdings.length} varlık
                        <ArrowRight
                          size={14}
                          className="ml-1 text-[var(--ais-fg-faint)] transition group-hover:translate-x-0.5 group-hover:text-[var(--ais-fg-muted)]"
                        />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
