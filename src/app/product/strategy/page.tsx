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
import {
  StackSimple,
  ChartBar,
  Sparkle,
  ClockCounterClockwise,
  Share,
  SlidersHorizontal,
} from "@phosphor-icons/react/dist/ssr";

export const metadata: Metadata = {
  title: "Strateji Oluşturucu — Finovela",
  description:
    "Kod yazmadan yatırım stratejileri tasarla, geriye dönük test et ve simülasyonda dene. Bir fikri anlat, nasıl performans gösterirdi gör ve Finovela ile paper-trading ortamında modelle.",
};

const FEATURES: Feature[] = [
  {
    icon: Sparkle,
    title: "Kodlama, sadece anlat",
    desc: "Tezini günlük dille yaz. Finovela bunu inceleyip ince ayar yapabileceğin somut, kural tabanlı bir stratejiye dönüştürür.",
    image: "/gen/card-strategy-anlat.png",
  },
  {
    icon: ClockCounterClockwise,
    title: "Döngüler boyunca test et",
    desc: "Stratejinin yükselişler, çöküşler ve yatay seyirde nasıl performans göstereceğini gör — düşüş, Sharpe ve kazanma oranıyla.",
    image: "/gen/card-strategy-test.png",
  },
  {
    icon: SlidersHorizontal,
    title: "Her parametreyi ayarla",
    desc: "Dağılımı, giriş ve çıkış kurallarını, dengelemeyi ve risk sınırlarını basit kaydırıcılarla ayarla — formüle gerek yok.",
    image: "/gen/card-strategy-param.png",
  },
  {
    icon: ChartBar,
    title: "Risk-getiri bir bakışta",
    desc: "Net grafikler, tek bir dolar bile yatırmadan beklenen oynaklığı, maksimum düşüşü ve varlık dağılımını gösterir.",
    image: "/gen/card-strategy-riskgetiri.png",
  },
  {
    icon: StackSimple,
    title: "20+ hazır şablon",
    desc: "Kanıtlanmış taslaklardan başla — momentum, temettü geliri, sektör rotasyonu, düşük oynaklık — ve onları kendine uyarla.",
    image: "/gen/card-strategy-sablon.png",
  },
  {
    icon: Share,
    title: "Yayınla ve paylaş",
    desc: "Strateji modelini Finovela topluluğuyla paylaş. Başkaları senin analizini inceleyip kendi araştırmalarında ilham alır.",
    image: "/gen/card-strategy-yayinla.png",
  },
];

export default function StrategyPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Strateji Oluşturucu"
        image="/gen/p-strategy.png"
        title={
          <>
            Strateji kur.
            <br />
            Test et. Modelle.
          </>
        }
        subtitle="Kod yok, tablo yok. Bir fikri anlat, gerçek piyasa geçmişiyle test et ve simülasyonda (paper trading) dene."
      >
        <GlassButton href="/app" tone="solid" size="xl">
          Strateji kur
        </GlassButton>
        <GlassButton href="/pricing" tone="glass" size="xl">
          Fiyatlandırmayı gör
        </GlassButton>
      </PageHero>

      <Section bg="#0a1838" prev="#0c1d40">
        <SectionHeading
          eyebrow="Özellikler"
          title="Fikirden geriye dönük teste, oradan simülasyona"
          subtitle="Bir kuantitatif masanın yaptığı analizin her şeyi — kuantitatif masaya gerek kalmadan."
        />
        <FeatureGrid items={FEATURES} cols={3} cardStyle="B" />
      </Section>

      {/* backtest mock */}
      <Section bg="#071026" prev="#0a1838">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading
              center={false}
              eyebrow="Geriye dönük test"
              title="Riske girmeden önce bil"
              subtitle="Her strateji yıllarca süren gerçek piyasa verisine karşı test edilir; böylece para yatırmadan önce sadece yükselişi değil, düşüşü de görürsün."
            />
            <div className="mt-8 grid grid-cols-3 gap-4">
              {[
                ["+%18,4", "Yıllıklandırılmış"],
                ["-%12,1", "Maks. düşüş"],
                ["1,42", "Sharpe oranı"],
              ].map(([v, l]) => (
                <div
                  key={l}
                  className="rounded-2xl border border-white/8 bg-white/[0.03] p-5 text-center"
                >
                  <p className="font-display text-2xl font-bold text-white">{v}</p>
                  <p className="mt-1 text-xs text-white/50">{l}</p>
                </div>
              ))}
            </div>
          </div>
          {/* basit grafik mock */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <div className="flex items-end gap-1.5 h-48">
              {[30, 38, 34, 46, 52, 48, 60, 56, 68, 74, 70, 84].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t-md bg-[linear-gradient(180deg,#5b8cff,#2b5cf0)]"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
            <div className="mt-4 flex justify-between text-xs text-white/40">
              <span>2018</span>
              <span>Geriye dönük test edilmiş sermaye eğrisi</span>
              <span>2026</span>
            </div>
          </div>
        </div>
      </Section>

      <CtaBand
        title="En iyi fikrini bir stratejiye dönüştür"
        subtitle="Anlat, test et, simülasyonda dene — başlaması ücretsiz."
        prev="#071026"
      />
    </PageShell>
  );
}
