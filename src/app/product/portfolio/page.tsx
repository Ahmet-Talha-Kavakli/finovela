import type { Metadata } from "next";
import { PageShell } from "@/components/site/page-shell";
import {
  PageHero,
  Section,
  SectionHeading,
  FeatureGrid,
  CtaBand,
  type Feature,
} from "@/components/site/page-parts";
import { GlassButton } from "@/components/ui/glass-button";
import { TickerBadge } from "@/components/dashboard/ticker-badge";
import {
  ChartPieSlice,
  ChartLineUp,
  Eye,
  Coins,
  ArrowsClockwise,
  Target,
} from "@phosphor-icons/react/dist/ssr";

export const metadata: Metadata = {
  title: "Portföy — Finovela",
  description:
    "Her varlığını takip et, gerçek performansını anla ve paranı neyin hareket ettirdiğini Finovela'ya açıklat — hepsi tek, net ve şık bir ekranda.",
};

const FEATURES: Feature[] = [
  {
    icon: ChartPieSlice,
    title: "Her şey tek ekranda",
    desc: "Hisse, ETF, opsiyon, kripto ve nakit — tüm net varlığın tek ve sade bir panelde.",
    image: "/gen/card-portfolio-tekekran.png",
  },
  {
    icon: ChartLineUp,
    title: "Gerçek performans",
    desc: "Zaman ağırlıklı getiriler, temettüler ve ücretler hesaba katılır — gösteriş için değil, gerçekte ne kazandığını gör.",
    image: "/gen/card-portfolio-performans.png",
  },
  {
    icon: Eye,
    title: "Nedenini sor",
    desc: "“Portföyüm bugün neden düştü?” Finovela sürükleyicileri günlük dille, varlık varlık açıklar.",
    image: "/gen/card-portfolio-neden.png",
  },
  {
    icon: Target,
    title: "Hedef takibi",
    desc: "Hedeflerini belirle; Finovela istenen tempoda mısın gösterir — değilsen neyi değiştirmen gerektiğini söyler.",
    image: "/gen/card-portfolio-hedef.png",
  },
  {
    icon: Coins,
    title: "Temettü ve gelir",
    desc: "Temettüler, tahvil kuponları ve getiri için birleşik bir gelir görünümü — yerleşik otomatik yeniden yatırımla.",
    image: "/gen/card-portfolio-temettu.png",
  },
  {
    icon: ArrowsClockwise,
    title: "Akıllı dengeleme",
    desc: "Finovela hedef dağılımından sapmayı işaretler ve komutunla ya da belirli aralıklarla portföyü dengeler.",
    image: "/gen/card-portfolio-dengeleme.png",
  },
];

export default function PortfolioPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Portfolio"
        image="/gen/p-portfolio.png"
        title={
          <>
            Her şeyi gör.
            <br />
            Hepsini anla.
          </>
        }
        subtitle="Tüm portföyünün tek ve şık bir görünümü — getirilerini neyin yönlendirdiğini tam olarak açıklayan bir AI ile."
      >
        <GlassButton href="/app" tone="solid" size="xl">
          Portföyünü aç
        </GlassButton>
        <GlassButton href="/pricing" tone="glass" size="xl">
          Fiyatlandırmayı gör
        </GlassButton>
      </PageHero>

      <Section bg="#0a1838" prev="#0c1d40">
        <SectionHeading
          eyebrow="Özellikler"
          title="Karmaşa değil, netlik"
          subtitle="Önemli olan rakamlar, ihtiyaç duyduğun açıklamalar ve gerisi yok."
        />
        <FeatureGrid items={FEATURES} cols={3} cardStyle="B" />
      </Section>

      {/* dashboard mock */}
      <Section bg="#071026" prev="#0a1838">
        <div className="mx-auto max-w-4xl rounded-3xl border border-white/10 bg-white/[0.03] p-8">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm text-white/50">Toplam değer</p>
              <p className="font-display text-4xl font-bold text-white">
                $128,440.12
              </p>
            </div>
            <span className="rounded-full bg-[#34d399]/15 px-3 py-1 text-sm font-semibold text-[#6ee7b7]">
bugün +%2,4
            </span>
          </div>
          <div className="mt-6 flex items-end gap-1.5 h-32">
            {[40, 44, 42, 50, 48, 56, 60, 58, 66, 72, 70, 80].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t bg-[linear-gradient(180deg,#5b8cff,#2b5cf0)]"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {[
              ["NVDA", "Nvidia", "+%4,1", "#34d399"],
              ["AAPL", "Apple", "+%0,8", "#34d399"],
              ["TSLA", "Tesla", "-%1,2", "#f87171"],
              ["VOO", "S&P 500 ETF", "+%0,5", "#34d399"],
            ].map(([sym, name, chg, color]) => (
              <div
                key={sym}
                className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <TickerBadge symbol={sym} size={32} />
                  <div>
                    <p className="font-semibold text-white">{sym}</p>
                    <p className="text-xs text-white/45">{name}</p>
                  </div>
                </div>
                <span className="font-semibold" style={{ color }}>
                  {chg}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <CtaBand
        title="Paran, nihayet net"
        subtitle="Bağlan ya da sıfırdan başla — tüm tablonu saniyeler içinde gör."
        prev="#071026"
      />
    </PageShell>
  );
}
