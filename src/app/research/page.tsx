import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/site/page-shell";
import {
  PageHero,
  Section,
  SectionHeading,
  FeatureGrid,
  CtaBand,
  type Feature,
} from "@/components/site/page-parts";
import {
  Brain,
  Newspaper,
  ChartBar,
  MagnifyingGlass,
  Pulse,
  Star,
} from "@phosphor-icons/react/dist/ssr";

export const metadata: Metadata = {
  title: "Araştırma — Finovela",
  description:
    "AI destekli araştırma: sunumdan dakikalar sonra bilanço özetleri, analist konsensüsü, KPI takibi, duygu radarı ve konuşabildiğin bir tarayıcı.",
};

const FEATURES: Feature[] = [
  {
    icon: Brain,
    title: "Filtreleme, sor",
    desc: "Hantal tarayıcıları unut. “Bana geliri artan, 50$ altındaki kârlı AI hisselerini göster.” Finovela listeyi anında döner.",
    image: "/gen/card-research-filtre.png",
  },
  {
    icon: Newspaper,
    title: "Bilanço özetleri",
    desc: "Finovela her bilanço sunumunu yayınlandıktan dakikalar sonra özetler — beklentiyi aştı mı kaçırdı mı, beklenti ve senin için anlamı.",
    image: "/gen/card-research-bilanco.png",
  },
  {
    icon: Star,
    title: "Analist konsensüsü",
    desc: "Wall Street notlarını, 12 aylık fiyat hedeflerini ve duygunun zaman içinde nasıl değiştiğini gör — hepsi tek yerde.",
    image: "/gen/card-research-konsensus.png",
  },
  {
    icon: ChartBar,
    title: "KPI takibi",
    desc: "Gerçekten önemli olan rakamlar — teslimatlar, aboneler, sevk edilen birimler — şirket bazında otomatik olarak öne çıkarılır.",
    image: "/gen/card-research-kpi.png",
  },
  {
    icon: Pulse,
    title: "Duygu radarı",
    desc: "X, Reddit ve forumlardan gelen anlık sinyaller, fiyata yansımadan önce kalabalığın ne hissettiğini gösterir.",
    image: "/gen/card-research-duygu.png",
  },
  {
    icon: MagnifyingGlass,
    title: "İstendiğinde derinlemesine inceleme",
    desc: "Finansallar, temel veriler, içeriden işlemler ve boğa-ayı senaryoları — günlük dille açıklanır.",
    image: "/gen/card-research-derin.png",
  },
];

export default function ResearchPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Araştırma"
        image="/gen/p-research.png"
        title="Wall Street araştırması, sade bir dille"
        subtitle="Finovela raporları, sunumları ve kalabalığı okur — sonra sana önemli olanı söyler. Kurumsal düzeyde araştırma, sohbet kıvamında."
      />

      <Section bg="#0a1838" prev="#0c1d40">
        <SectionHeading
          eyebrow="İçinde neler var"
          title="Araştıracağın her şey — çoktan araştırılmış"
          subtitle="On site arasında sekme dolaştırmak yok. Bir kez sor, tüm tabloyu al."
        />
        <FeatureGrid items={FEATURES} cols={3} cardStyle="A" />
      </Section>

      <Section bg="#071026" prev="#0a1838">
        <SectionHeading
          eyebrow="Sormayı dene"
          title="Bir soru hızında araştırma"
        />
        <div className="mx-auto mt-12 grid max-w-4xl gap-3 sm:grid-cols-2">
          {[
            "Apple'ın son bilanço sunumunu özetle.",
            "Analistler Nvidia hakkında ne diyor?",
            "TSLA ve RIVN'in temel verilerini karşılaştır.",
            "Hangi yarı iletken hisselerinin marjları en iyi?",
            "Şu an Bitcoin hakkında piyasa duygusu nasıl?",
            "Palantir için boğa ve ayı senaryolarını göster.",
          ].map((q) => (
            <Link
              key={q}
              href="/app"
              className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-5 py-4 text-[15px] text-white/80 transition hover:border-white/15"
            >
              <MagnifyingGlass size={18} weight="bold" className="shrink-0 text-brand" />
              &ldquo;{q}&rdquo;
            </Link>
          ))}
        </div>
      </Section>

      <CtaBand
        title="Okumayı senin yerine yapan araştırma"
        subtitle="İlk sorunu ücretsiz sor — Finovela her şeyi çoktan okudu."
        prev="#071026"
      />
    </PageShell>
  );
}
