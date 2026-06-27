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
  title: "Finovela AI — yatırım araştırması ve eğitim yazılımın",
  description:
    "Claude destekli sohbet tabanlı analiz yazılımı. Finovela webde canlı araştırma yapıp kaynak gösterir, yüklediğin grafik ve PDF'leri analiz eder, teknik analiz kartları çıkarır ve simülasyon (paper) hesabında fikirlerini risksiz test etmene yardım eder. Bilgilendirme ve eğitim amaçlı bir yazılım aracıdır — yatırım danışmanlığı değildir.",
};

const CAPABILITIES: Feature[] = [
  {
    icon: ChatCircleDots,
    title: "Sohbet ederek araştır",
    desc: "“Tesla'yı analiz et” ya da “teknoloji ağırlığım çok mu?” diye sor. Finovela niyetini anlar, veriyi çeker ve simülasyon hesabında deneyebileceğin net bir senaryo hazırlar.",
    image: "/gen/card-ai-sohbet.png",
  },
  {
    icon: Microphone,
    title: "Sesle sor",
    desc: "Eller serbest. Ne merak ettiğini söyle yeter — Finovela dinler, akıl yürütür ve görsel bir analiz döner. Koltuğundan, arabandan, her yerden.",
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
    desc: "Bir grafik, ekran görüntüsü ya da bilanço PDF'i yükle; Finovela görseli okur, formasyonu ve sayıları eğitici biçimde yorumlar ve neye dikkat etmen gerektiğini açıklar.",
    image: "/gen/card-ai-yukle.png",
  },
  {
    icon: Newspaper,
    title: "Sohbette canlı kartlar",
    desc: "Teknik analiz (RSI, MACD, Bollinger), Finovela Skoru, what-if senaryoları, duyarlılık ve haber — hepsi sohbetin içinde görsel, bilgilendirici kartlar olarak.",
    image: "/gen/card-ai-kartlar.png",
  },
  {
    icon: Brain,
    title: "Model seç, tonu ayarla",
    desc: "Finovela 1 / 1.1 / 1.2 ile hız ve derinlik arasında geçiş yap, yanıt tonunu kendine göre belirle. Her fikri simülasyon (paper) hesabında risksiz dene.",
    image: "/gen/card-ai-model.png",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Sorunu Finovela'ya söyle",
    desc: "Günlük dille — analiz edilecek bir hisse, anlamak istediğin bir tema, bir risk seviyesi ya da portföyünle ilgili eğitici bir soru.",
  },
  {
    n: "02",
    title: "Finovela akıl yürütür ve açıklar",
    desc: "Canlı veriyi çeker, analizi yapar ve net bir özet döner: olası senaryolar, dağılım, riskler ve nedenleri — bilgilendirme amaçlı.",
  },
  {
    n: "03",
    title: "Simülasyonda dene, kontrol sende",
    desc: "Fikirleri sanal (paper) hesabında risksiz test et. Kendi lisanslı aracı kurumunu bağlamayı seçersen, her kararı yalnızca SEN onaylarsın — Finovela senin yerine işlem yapmaz.",
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
            Piyasayı anla.
            <br />
            Sohbetle.
          </>
        }
        subtitle="Claude destekli Finovela Sohbet, günlük dili net piyasa analizine dönüştürür. Webde canlı araştırır, yüklediğin grafikleri okur, teknik analiz kartları çıkarır ve fikirlerini simülasyon hesabında risksiz test etmene yardım eder — sohbetle ya da sesle. Bilgilendirme ve eğitim amaçlı bir yazılımdır."
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
          title="Tek asistan. Her analiz."
          subtitle="Hızlı bir hisse kontrolünden tüm bir portföyü simülasyonda modellemeye kadar — araştırmayı Finovela yapar, kararı her zaman sen verirsin."
        />
        <FeatureGrid items={CAPABILITIES} cols={3} cardStyle="B" />
      </Section>

      {/* nasıl çalışır */}
      <Section bg="#071026" prev="#0a1838">
        <SectionHeading
          eyebrow="Nasıl çalışır"
          title="Bir cümleden içgörüye"
          subtitle="Menü yok, jargon yok, beş ekran arasında tıklamak yok. Sadece anlaşılır analize dönüşen bir sohbet."
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
          title="Senin yerine asla karar vermeyen AI"
          subtitle="Finovela bir yazılım aracıdır — paranı asla tutmaz ve senin adına işlem yapmaz. Yalnızca-izleme modunu kullan, fikirleri simülasyonda dene veya kendi lisanslı aracı kurumunu bağla; bağlasan bile her emri yalnızca sen onaylarsın. Her zaman geri alınabilir, her zaman şeffaf."
          bullets={[
            "Finovela paranı tutmaz, transfer etmez, saklamaz",
            "Yalnızca-izleme modu — sadece analiz et, izle",
            "Simülasyon (paper) hesabında risksiz dene",
            "Verdiği her analizin tam, şeffaf etkinlik kaydı",
          ]}
        />
      </Section>

      {/* Hukuki netlik bandı — Paddle/AUP uyumu + dürüst konumlandırma */}
      <Section bg="#071026" prev="#0a1838">
        <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center">
          <p className="text-[13px] leading-relaxed text-white/55">
            <span className="font-semibold text-white/80">Finovela bir yazılım (SaaS) ve eğitim aracıdır.</span>{" "}
            Yatırım danışmanlığı, aracılık (broker/dealer) veya portföy yönetimi hizmeti{" "}
            <span className="text-white/80">değildir</span>. Kullanıcı fonlarını tutmaz, saklamaz veya
            transfer etmez. Uygulama içindeki portföy bir <span className="text-white/80">simülasyondur
            (paper trading)</span>. Sunulan tüm içerik genel bilgilendirme ve eğitim amaçlıdır; kişiye
            özel yatırım tavsiyesi teşkil etmez. Yatırım kararları kullanıcının kendi sorumluluğundadır
            ve sermaye kaybı riski içerir. Geçmiş performans gelecek getirinin garantisi değildir.
          </p>
        </div>
      </Section>

      <CtaBand
        title="Piyasayı anlamanın en akıllı yoluyla tanış"
        subtitle="7/24 AI araştırma asistanınla başlamak ücretsiz. Bir merhaba de."
        prev="#071026"
      />
    </PageShell>
  );
}
