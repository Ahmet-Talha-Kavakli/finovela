import type { Metadata } from "next";
import { PageShell } from "@/components/site/page-shell";
import {
  PageHero,
  Section,
  SectionHeading,
  FeatureGrid,
  ImageSplit,
  CtaBand,
  type Feature,
} from "@/components/site/page-parts";
import { GlassButton } from "@/components/ui/glass-button";
import {
  ChatCircleDots,
  Microphone,
  Globe,
  ImageSquare,
  Brain,
  Newspaper,
} from "@phosphor-icons/react/dist/ssr";

export const metadata: Metadata = {
  title: "Finovela AI — Sohbet ederek yatırım yapan yardımcın",
  description:
    "Claude destekli sohbet. Finovela webde canlı araştırma yapıp kaynak gösterir, yüklediğin grafik ve PDF'leri analiz eder, teknik analiz kartları çıkarır ve işlemi gerçekleştirir. 7/24 AI yatırım ortağın.",
};

const CAPABILITIES: Feature[] = [
  {
    icon: ChatCircleDots,
    title: "Sohbet ederek yatırım yap",
    desc: "“100$'lık Tesla al” ya da “teknoloji hisselerimi koru.” Finovela niyetini anlar, işlemi hazırlar ve tek onayla gerçekleştirir.",
    image: "/gen/card-ai-sohbet.png",
  },
  {
    icon: Microphone,
    title: "Sesle işlem",
    desc: "Eller serbest. Ne istediğini söyle yeter — Finovela dinler, akıl yürütür ve harekete geçer. Koltuğundan, arabandan, her yerden işlem yap.",
    image: "/gen/card-ai-ses.png",
  },
  {
    icon: Globe,
    title: "Canlı web araştırması",
    desc: "Finovela soruyu yanıtlarken interneti canlı tarar; en güncel haberi ve piyasayı kaynak göstererek getirir — tahmin değil, doğrulanabilir bilgi.",
    image: "/gen/card-ai-web.png",
  },
  {
    icon: ImageSquare,
    title: "Grafik ve dosya yükle",
    desc: "Bir grafik, ekran görüntüsü ya da bilanço PDF'i yükle; Finovela görseli okur, formasyonu ve sayıları yorumlar ve ne yapman gerektiğini söyler.",
    image: "/gen/card-ai-yukle.png",
  },
  {
    icon: Newspaper,
    title: "Sohbette canlı kartlar",
    desc: "Teknik analiz (RSI, MACD, Bollinger), Finovela Skoru, what-if senaryoları, duyarlılık ve haber — hepsi sohbetin içinde görsel kartlar olarak.",
    image: "/gen/card-ai-kartlar.png",
  },
  {
    icon: Brain,
    title: "Model seç, tonu ayarla",
    desc: "Finovela 1 / 1.1 / 1.2 ile hız ve derinlik arasında geçiş yap, yanıt tonunu kendine göre belirle. Her fikri sanal işlemle risksiz dene.",
    image: "/gen/card-ai-model.png",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Hedefini Finovela'ya söyle",
    desc: "Günlük dille — analiz edilecek bir hisse, yatırım yapılacak bir tema, bir risk seviyesi ya da portföyünle ilgili bir soru.",
  },
  {
    n: "02",
    title: "Finovela akıl yürütür ve önerir",
    desc: "Canlı veriyi çeker, analizi yapar ve net bir plan döner: işlem, dağılım, risk ve nedeni.",
  },
  {
    n: "03",
    title: "Sen onaylarsın, Finovela uygular",
    desc: "Onayın olmadan hiçbir şey olmaz. Tek dokunuşla Finovela emri verir — ya da bir sonraki sefer için otomatikleştirir.",
  },
];

export default function VelaAiPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Finovela AI"
        image="/gen/p-ai.png"
        title={
          <>
            Paranla konuş.
            <br />
            O seni dinler.
          </>
        }
        subtitle="Claude destekli Finovela Sohbet, günlük dili gerçek yatırıma dönüştürür. Webde canlı araştırır, yüklediğin grafikleri okur, teknik analiz kartları çıkarır ve işlemi gerçekleştirir — sohbetle ya da sesle, sıfır tık."
      >
        <GlassButton href="/app" tone="solid" size="xl">
          Finovela ile sohbet et
        </GlassButton>
        <GlassButton href="/pricing" tone="glass" size="xl">
          Fiyatlandırmayı gör
        </GlassButton>
      </PageHero>

      <Section bg="#0a1838" prev="#0c1d40">
        <SectionHeading
          eyebrow="Yetenekler"
          title="Tek asistan. Her iş."
          subtitle="Hızlı bir hisse kontrolünden tüm bir portföyü kurup dengelemeye kadar — işi Finovela yapar, kararı sen verirsin."
        />
        <FeatureGrid items={CAPABILITIES} cols={3} cardStyle="B" />
      </Section>

      {/* nasıl çalışır */}
      <Section bg="#071026" prev="#0a1838">
        <SectionHeading
          eyebrow="Nasıl çalışır"
          title="Bir cümleden işleme"
          subtitle="Menü yok, jargon yok, beş ekran arasında tıklamak yok. Sadece harekete dönüşen bir sohbet."
        />
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
                {s.title}
              </h3>
              <p className="mt-3 text-[15px] leading-relaxed text-white/55">
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* görselli split — kontrol */}
      <Section bg="#0a1838" prev="#071026">
        <ImageSplit
          image="/gen/p-strategy.png"
          reverse
          eyebrow="Kontrol sende"
          title="Harekete geçmeden önce soran AI"
          subtitle="Finovela onayın olmadan asla işlem yapmaz. Yalnızca-izleme modunu, bir harcama sınırını ayarla ya da belirlediğin kurallarla çalışmasına izin ver — her zaman geri alınabilir, her zaman şeffaf."
          bullets={[
            "Her emir, gerçekleşmek için dokunuşunu bekler",
            "Yalnızca-izleme modu — Finovela işlem yapmasın, izlesin",
            "Finovela'nın verdiği her kararın tam etkinlik kaydı",
            "Risk tarzını öğrenir ve her yanıtı ona göre ayarlar",
          ]}
        />
      </Section>

      <CtaBand
        title="Yatırımın en akıllı yoluyla tanış"
        subtitle="7/24 AI yatırım ortağınla başlamak ücretsiz. Bir merhaba de."
        prev="#0a1838"
      />
    </PageShell>
  );
}
