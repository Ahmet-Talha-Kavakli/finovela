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
  Robot,
  ArrowsClockwise,
  Repeat,
  Bell,
  ShieldCheck,
  TrendDown,
  Wallet,
  Gauge,
} from "@phosphor-icons/react/dist/ssr";

export const metadata: Metadata = {
  title: "Otomasyon — Finovela",
  description:
    "Bir kuralı günlük dille anlat, Finovela 7/24 çalıştırsın: tekrarlayan alımlar, otomatik dengeleme, zarar-durdur, nakit aktarımı ve tetik tabanlı işlemler.",
};

const AGENTS: Feature[] = [
  {
    icon: Repeat,
    title: "Tekrarlayan yatırım",
    desc: "Belirlediğin programa göre 20'ye kadar varlığa istediğin tutarı otomatik yatır — günlük, haftalık ya da aylık, kesirli paylarla.",
    image: "/gen/card-automation-tekrar.png",
  },
  {
    icon: ArrowsClockwise,
    title: "Otomatik dengeleme",
    desc: "Finovela dağılımını hedefte tutar. Bir pozisyon saptığında otomatik olarak kısar ve tamamlar — tabloya gerek yok.",
    image: "/gen/card-automation-odengeleme.png",
  },
  {
    icon: TrendDown,
    title: "Risk korumaları",
    desc: "Zarar-durdur, kâr-al ve takip eden stop'ları bir kez ayarla. Finovela piyasayı izler ve kuralın tetiklendiği an harekete geçer.",
    image: "/gen/card-automation-riskkoruma.png",
  },
  {
    icon: Wallet,
    title: "Nakit yönetimi",
    desc: "Atıl nakdi getirili bir hesaba aktar, temettüleri otomatik yeniden yatır ve bankandan tamamla — hepsi otomatik pilotta.",
    image: "/gen/card-automation-nakit.png",
  },
  {
    icon: Gauge,
    title: "Gösterge tetikleri",
    desc: "RSI, MACD, hareketli ortalamalar, VIX ya da bir fiyat seviyesine göre işlem yap. “RSI 30'un altına düşerse düşüşten al” — tamamdır.",
    image: "/gen/card-automation-tetik.png",
  },
  {
    icon: Bell,
    title: "Akıllı alarmlar",
    desc: "Takip ettiğin her şeyde bilanço, büyük hareketler, haberler ve duygu değişimleri için bildirim al — ya da Finovela harekete geçsin.",
    image: "/gen/card-automation-alarm.png",
  },
];

export default function AutomationPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Otomasyon"
        image="/gen/p-automation.png"
        title={
          <>
            Kuralı belirle.
            <br />
            Finovela 7/24 çalıştırsın.
          </>
        }
        subtitle="Ne istediğini günlük dille anlat. Finovela bunu, piyasayı izleyen ve koşulların sağlandığı an işlemi gerçekleştiren her zaman açık bir ajana dönüştürür."
      >
        <GlassButton href="/app" tone="solid" size="xl">
          Otomasyon kur
        </GlassButton>
        <GlassButton href="/pricing" tone="glass" size="xl">
          Fiyatlandırmayı gör
        </GlassButton>
      </PageHero>

      <Section bg="#0a1838" prev="#0c1d40">
        <SectionHeading
          eyebrow="Neleri otomatikleştirebilirsin"
          title="Stratejin, otomatik pilotta"
          subtitle="Dolar-maliyet ortalamasından karmaşık tetik tabanlı işlemlere kadar — anlatabiliyorsan, Finovela çalıştırabilir."
        />
        <FeatureGrid items={AGENTS} cols={3} cardStyle="B" />
      </Section>

      {/* agent örneği */}
      <Section bg="#071026" prev="#0a1838">
        <SectionHeading
          eyebrow="Günlük dille ajanlar"
          title="Ne olması gerektiğini söyle yeter"
        />
        <div className="mx-auto mt-14 grid max-w-4xl gap-4 sm:grid-cols-2">
          {[
            "AAPL'imde her ay covered call sat.",
            "Hisseler %5'ten fazla saparsa 60/40'a dengele.",
            "Her Cuma 200$'lık VOO al.",
            "1.000$ üzerindeki atıl nakdi getirili hesabıma taşı.",
            "Her %8'lik geri çekilmede NVDA'ya ekle.",
            "TSLA 350$'ı geçerse pozisyonumun yarısında kâr al.",
          ].map((p) => (
            <div
              key={p}
              className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-5 py-4"
            >
              <Robot size={20} weight="duotone" className="shrink-0 text-brand" />
              <span className="text-[15px] text-white/80">&ldquo;{p}&rdquo;</span>
            </div>
          ))}
        </div>
        <div className="mx-auto mt-10 flex max-w-xl items-center justify-center gap-2 rounded-2xl border border-white/8 bg-white/[0.03] px-5 py-4 text-center text-sm text-white/55">
          <ShieldCheck size={18} weight="fill" className="text-brand" />
          Herhangi bir ajanı istediğin an duraklat, düzenle ya da durdur. Her işlem kaydedilir.
        </div>
      </Section>

      <CtaBand
        title="Yatırımını otomatik pilota al"
        subtitle="İlk otomasyonunu bir dakikadan kısa sürede kur — başlaması ücretsiz."
        prev="#071026"
      />
    </PageShell>
  );
}
