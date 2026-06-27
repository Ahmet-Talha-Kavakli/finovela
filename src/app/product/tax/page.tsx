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
  Scales,
  TrendDown,
  Receipt,
  ArrowsClockwise,
  PiggyBank,
  FileText,
} from "@phosphor-icons/react/dist/ssr";

export const metadata: Metadata = {
  title: "Vergi Raporlama ve Analizi — Finovela",
  description:
    "Kazandığının daha fazlasını elinde tut. Finovela zarar mahsubu fırsatlarını analiz eder, hangi lotların satılmasının vergi açısından verimli olacağını modeller ve yıl boyu vergi-akıllı raporlar üretir — bir vergi raporlama/hesaplama yazılımıdır, vergi danışmanlığı değildir.",
};

const FEATURES: Feature[] = [
  {
    icon: TrendDown,
    title: "Zarar mahsubu analizi",
    desc: "Finovela, kazançlarını dengeleyebilecek zarar mahsubu fırsatlarını işaretler — sadece Aralık'ta değil, yıl boyunca sürekli izleyip raporlar.",
    image: "/gen/card-tax-mahsup.png",
  },
  {
    icon: ArrowsClockwise,
    title: "Yapay satış (wash-sale) farkında",
    desc: "Önerilen mahsup senaryoları kurallara uygun kalır. Finovela, yapay satış riskine yol açabilecek durumları işaretler; ilişkili alternatif varlıkları analiz ederek sana gösterir.",
    image: "/gen/card-tax-washsale.png",
  },
  {
    icon: Receipt,
    title: "Akıllı lot analizi",
    desc: "Bir satışı modellediğinde Finovela, vergi yükünü en aza indirecek vergi lotlarını analiz eder — fayda sağladığı yerde kısa vade yerine uzun vadeyi önerir. Kararı sen verirsin.",
    image: "/gen/card-tax-lot.png",
  },
  {
    icon: PiggyBank,
    title: "Vergi avantajlı hesap içgörüsü",
    desc: "Bireysel emeklilik ve emeklilik hesaplarını da hesaba kat; Finovela hangi varlığın hangi hesapta vergi açısından daha verimli olacağını analiz edip önersin.",
    image: "/gen/card-tax-hesap.png",
  },
  {
    icon: Scales,
    title: "Doğrudan endeksleme analizi",
    desc: "Bir endeksi tek tek hisseler olarak modelle; böylece Finovela zarar mahsubu fırsatlarını tekil hisse düzeyinde çok daha sık tespit edip raporlayabilir.",
    image: "/gen/card-tax-endeksleme.png",
  },
  {
    icon: FileText,
    title: "Yıl sonuna hazır",
    desc: "Temiz, dışa aktarılabilir özetler ve gerçekleşen kâr/zarar raporları vergi dönemini zahmetsiz kılar.",
    image: "/gen/card-tax-yilsonu.png",
  },
];

export default function TaxPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Vergi Optimizasyonu"
        image="/gen/p-tax.png"
        title={
          <>
            Kazandığının
            <br />
            daha fazlasını tut.
          </>
        }
        subtitle="Vergiler getirileri sessizce yer. Finovela zarar mahsubu fırsatlarını analiz eder, en akıllı lotları modeller ve vergi-akıllı raporlar üretir — yıl boyunca sürekli izleyerek. Kararı sen verirsin."
      >
        <GlassButton href="/app" tone="solid" size="xl">
          Vergi analizini aç
        </GlassButton>
        <GlassButton href="/pricing" tone="glass" size="xl">
          Fiyatlandırmayı gör
        </GlassButton>
      </PageHero>

      <Section bg="#0a1838" prev="#0c1d40">
        <SectionHeading
          eyebrow="Özellikler"
          title="Varsayılan olarak vergi-akıllı"
          subtitle="Varlık yöneticilerinin bir servet karşılığında sunduğu analizler — yerleşik, sürekli ve açıklamalı raporlar olarak."
        />
        <FeatureGrid items={FEATURES} cols={3} cardStyle="B" />
      </Section>

      {/* etki şeridi */}
      <Section bg="#071026" prev="#0a1838">
        <SectionHeading
          eyebrow="Etkisi"
          title="Küçük sızıntılar getiriyi batırır"
          subtitle="On yıllar içinde vergi yükü, portföyünün anlamlı bir dilimine sessizce mal olabilir. Finovela bu sızıntıyı kapatır."
        />
        <div className="mx-auto mt-14 grid max-w-3xl gap-4 sm:grid-cols-3">
          {[
            ["%1–2'ye kadar", "Mahsup analizinden gelen tahmini yıllık vergi sonrası katkı*"],
            ["365 gün", "Finovela sadece yıl sonunda değil, fırsatları sürekli izler"],
            ["Az çaba", "Analiz ve raporlar hazır — kararı sen verirsin"],
          ].map(([v, l]) => (
            <div
              key={l}
              className="rounded-3xl border border-white/8 bg-white/[0.03] p-7 text-center"
            >
              <p className="font-display text-2xl font-bold text-white">{v}</p>
              <p className="mt-2 text-sm text-white/55">{l}</p>
            </div>
          ))}
        </div>
        <p className="mx-auto mt-8 max-w-2xl text-center text-xs text-white/35">
          *Temsilîdir. Gerçek sonuçlar vergi durumuna, hesap türüne ve piyasa
          koşullarına bağlıdır. Finovela bir vergi raporlama/hesaplama yazılımıdır,
          vergi danışmanlığı değildir ve vergi tavsiyesi vermez — bir vergi uzmanına
          danışın.
        </p>
      </Section>

      <CtaBand
        title="Fazladan vergi ödemeyi bırak"
        subtitle="Vergi analizini aç, fırsatları Finovela raporlasın — kararı sen ver."
        prev="#071026"
      />
    </PageShell>
  );
}
