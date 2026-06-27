import type { Metadata } from "next";
import Link from "next/link";
import { Topbar } from "@/components/dashboard/topbar";
import { PageTitle, SectionCard, Card, Pill, AIS_UP, AIS_DOWN } from "@/components/dashboard/ais-kit";
import { Sparkline } from "@/components/dashboard/area-chart";
import {
  SMART_PORTFOLIOS,
  getPortfolioHoldings,
  type RiskLevel,
} from "@/lib/dashboard/smart-portfolios";
import { ArrowRight, Stack } from "@phosphor-icons/react/dist/ssr";

export const metadata: Metadata = { title: "Akıllı Portföyler — Finovela" };

const RISK_LABELS: Record<RiskLevel, string> = {
  Low: "Düşük",
  Moderate: "Orta",
  High: "Yüksek",
};

// Risk seviyesine göre renkli pill: düşük=yeşil, orta=sarı, yüksek=kırmızı.
const RISK_COLORS: Record<RiskLevel, string> = {
  Low: AIS_UP,
  Moderate: "#fdd663",
  High: AIS_DOWN,
};

function RiskPill({ risk }: { risk: RiskLevel }) {
  return (
    <Pill color={RISK_COLORS[risk]} dot>
      {RISK_LABELS[risk]} risk
    </Pill>
  );
}

export default function SmartPortfoliosPage() {
  return (
    <>
      <Topbar title="Akıllı Portföyler" />
      <div className="ais min-h-[calc(100vh-64px)]">
        <div className="max-w-7xl px-8 py-10">
          <PageTitle
            title="Akıllı Portföyler"
            desc="Finovela tarafından oluşturulan ve dengelenen temalı sepetler — tek bir kararla koca bir fikre dengeli yatırım yaparsınız. Hepsini anında demo hesapta deneyebilirsiniz. Gösterilen getiriler simülasyondur."
          />

          <SectionCard label="Katalog" desc="Temalı sepetleri inceleyin." className="mt-10">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {SMART_PORTFOLIOS.map((p) => {
              const holdings = getPortfolioHoldings(p);
              const up = p.return1y >= 0;
              const up3 = p.return3y >= 0;
              return (
                <Link key={p.slug} href={`/dashboard/portfolios/${p.slug}`}>
                  <Card
                    hover
                    className="group h-full transition-transform duration-200 hover:-translate-y-0.5"
                  >
                    {/* başlık + risk pill */}
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-[15px] font-medium text-[var(--ais-fg)]">{p.name}</h3>
                      <RiskPill risk={p.risk} />
                    </div>
                    <p className="mt-2 min-h-[40px] text-[12.5px] leading-relaxed text-[var(--ais-fg-muted)]">
                      {p.thesis}
                    </p>

                    {/* büyük 1Y getiri + belirgin sparkline */}
                    <div className="mt-5 flex items-end justify-between gap-3">
                      <div>
                        <p className="text-[11px] uppercase tracking-wide text-[var(--ais-fg-faint)]">
                          1Y getiri
                        </p>
                        <p
                          className="num mt-1 text-[28px] font-normal leading-none tracking-tight"
                          style={{ color: up ? AIS_UP : AIS_DOWN }}
                        >
                          {up ? "+" : ""}
                          {p.return1y.toFixed(1)}%
                        </p>
                      </div>
                      <Sparkline seed={p.slug} up={up} width={120} height={48} />
                    </div>

                    {/* alt bilgi şeridi: 3Y getiri + varlık sayısı */}
                    <div className="mt-5 flex items-center justify-between border-t border-[var(--ais-line)] pt-4">
                      <span className="flex items-baseline gap-1.5 text-[12px] text-[var(--ais-fg-muted)]">
                        3Y
                        <span
                          className="num text-[12.5px] font-medium"
                          style={{ color: up3 ? AIS_UP : AIS_DOWN }}
                        >
                          {up3 ? "+" : ""}
                          {p.return3y.toFixed(1)}%
                        </span>
                      </span>
                      <span className="flex items-center gap-1.5 text-[12px] text-[var(--ais-fg-muted)]">
                        <Stack size={14} weight="regular" />
                        {holdings.length} varlık
                        <ArrowRight
                          size={14}
                          className="ml-1 text-[var(--ais-fg-faint)] transition group-hover:translate-x-0.5 group-hover:text-[var(--ais-fg-muted)]"
                        />
                      </span>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
          </SectionCard>
        </div>
      </div>
    </>
  );
}
