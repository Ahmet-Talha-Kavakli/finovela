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
  UsersThree,
  Copy,
  Trophy,
  ShieldCheck,
  ChartLineUp,
  Sparkle,
} from "@phosphor-icons/react/dist/ssr";

export const metadata: Metadata = {
  title: "Kopya İşlem — Finovela",
  description:
    "Kendini kanıtlamış yatırımcıları takip et ve hamlelerini otomatik olarak yansıt. Finovela, en iyi yatırımcıları senin tarzınla eşleştirir ve dağılımlarını portföyüne kopyalar.",
};

const FEATURES: Feature[] = [
  {
    icon: Trophy,
    title: "Denetlenmiş liderlik tablosu",
    desc: "En iyi yatırımcıları gerçek, çok dönemli getirilere göre sıralı incele — tam işlem geçmişi ve risk skorlarıyla, kayırma yok.",
    image: "/gen/card-copy-liderlik.png",
  },
  {
    icon: Copy,
    title: "Otomatik yansıt",
    desc: "Bir yatırımcı seç; Finovela mevcut pozisyonlarını ve gelecekteki her hamlesini, senin tutarına ölçeklenmiş olarak portföyüne kopyalar.",
    image: "/gen/card-copy-yansit.png",
  },
  {
    icon: Sparkle,
    title: "AI ile sana eşleştirilmiş",
    desc: "Finovela, risk toleransına ve hedeflerine uyan yatırımcıları önerir — sana uymayan bir tarzı kopyalamazsın.",
    image: "/gen/card-copy-eslesme.png",
  },
  {
    icon: ShieldCheck,
    title: "Kopya zarar-durdur",
    desc: "Bir zarar eşiği belirle; kopya ilişkisi otomatik olarak durur. Aşağı yönlü riskin kontrolü sende kalır.",
    image: "/gen/card-copy-copystop.png",
  },
  {
    icon: UsersThree,
    title: "Uzmanlar arasında çeşitlendir",
    desc: "Sermayeni birden fazla yatırımcı ve stratejiye yay; getirileri dengele ve tek yatırımcı riskini azalt.",
    image: "/gen/card-copy-cesitlendir.png",
  },
  {
    icon: ChartLineUp,
    title: "Tam şeffaflık",
    desc: "Kopyalanan her işlem, ücret ve performans verisi görünürdür. Neye sahip olduğunu ve nedenini anlık olarak gör.",
    image: "/gen/card-copy-seffaf.png",
  },
];

const STEPS = [
  { n: "01", t: "Liderlik tablosunu incele", d: "Getiri, risk, varlıklar ve zaman ufkuna göre filtrele." },
  { n: "02", t: "Kopya tutarını ve kurallarını belirle", d: "Ne kadar ayıracağını ve kopya zarar-durdur seviyeni seç." },
  { n: "03", t: "Finovela otomatik yansıtır", d: "Onların işlemleri seninkiler olur — hepsini tek yerden yönet." },
];

export default function CopyTradingPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Kopya İşlem"
        image="/gen/p-copy.png"
        title={
          <>
            Kendini kanıtlamış
            <br />
            yatırımcılarla yatırım yap.
          </>
        }
        subtitle="En iyi yatırımcıları bul, kendi tarzınla eşleştir ve dağılımlarını otomatik olarak yansıt. Takip ederek öğren — aşağı yönlü riskin korunurken."
      >
        <GlassButton href="/app" tone="solid" size="xl">
          Yatırımcıları keşfet
        </GlassButton>
        <GlassButton href="/pricing" tone="glass" size="xl">
          Fiyatlandırmayı gör
        </GlassButton>
      </PageHero>

      <Section bg="#0a1838" prev="#0c1d40">
        <SectionHeading
          eyebrow="Özellikler"
          title="Körü körüne değil, akıllıca kopyala"
          subtitle="Gerçek geçmiş performans, AI eşleştirmesi ve yerleşik risk kontrolleri — kopya işlemin doğru hali."
        />
        <FeatureGrid items={FEATURES} cols={3} cardStyle="B" />
      </Section>

      <Section bg="#071026" prev="#0a1838">
        <SectionHeading eyebrow="Nasıl çalışır" title="Bir uzmanı kopyalamak için üç dokunuş" />
        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {STEPS.map((s) => (
            <div
              key={s.n}
              className="rounded-3xl border border-white/8 bg-white/[0.03] p-8"
            >
              <span className="font-display text-4xl font-bold text-brand/60">
                {s.n}
              </span>
              <h3 className="font-display mt-4 text-xl font-bold text-white">
                {s.t}
              </h3>
              <p className="mt-3 text-[15px] leading-relaxed text-white/55">
                {s.d}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <CtaBand
        title="En iyileri kopyalamaya başla"
        subtitle="Takip edeceğin ilk yatırımcıyı bul — liderlik tablosunu incelemek ücretsiz."
        prev="#071026"
      />
    </PageShell>
  );
}
