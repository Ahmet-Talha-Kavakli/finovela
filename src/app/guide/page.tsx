import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/site/page-shell";
import { PageHero, Section, SectionHeading } from "@/components/site/page-parts";
import {
  Sparkle,
  ChartLineUp,
  Robot,
  Target,
  ShieldCheck,
  Plugs,
  ArrowRight,
} from "@phosphor-icons/react/dist/ssr";

export const metadata: Metadata = {
  title: "Kullanım Rehberi — Finovela",
  description:
    "Finovela'yı adım adım nasıl kullanırsın: başlangıç, yapay zekâ sohbeti, portföy, otomasyon, hedefler ve güvenlik. Finovela bir yazılım ve eğitim aracıdır; yatırım tavsiyesi vermez.",
};

// Adım adım başlangıç akışı.
const STEPS = [
  {
    n: 1,
    title: "Kaydol ve profilini belirle",
    body: "Web'den ya da uygulamadan saniyeler içinde kaydol. Kısa bir başlangıç akışıyla risk profilini (temkinli / dengeli / agresif) ve hedeflerini seç — Finovela tüm önerilerini buna göre kişiselleştirir.",
    href: "/app",
    cta: "Hemen başla",
  },
  {
    n: 2,
    title: "Portföyünü kur (simülasyon)",
    body: "Kâğıt-portföyünle sıfır riskle başla: hisse, ETF, kripto ekle, pozisyon aç-kapat. Gerçek para gerekmez — her şey simülasyondur. Hazır olduğunda kendi borsa hesabını API anahtarıyla bağlayabilirsin.",
    href: "/dashboard/portfolio",
    cta: "Portföyü gör",
  },
  {
    n: 3,
    title: "Finovela ile sohbet et",
    body: "\"NVDA'yı analiz et\", \"portföyümün riskini değerlendir\", \"AAPL 5 yılda ne olur?\" gibi sor. Yapay zekâ canlı fiyat çeker, teknik/duyarlılık analizi yapar, what-if senaryosu kurar — hepsi tek sohbette.",
    href: "/dashboard/chat",
    cta: "Sohbeti aç",
  },
  {
    n: 4,
    title: "Otomasyon ve alarm kur",
    body: "Doğal dille kural yaz: \"Her Cuma 200$ QQQ al\" ya da \"TSLA %8 düşerse haber ver\". Finovela Brain güven bütçesiyle yapay zekânın ne kadar serbest hareket edeceğini sen belirlersin.",
    href: "/dashboard/automation",
    cta: "Otomasyonu keşfet",
  },
];

// Ana modüller — ne işe yarar.
const MODULES = [
  {
    icon: Sparkle,
    title: "Finovela Sohbet",
    body: "Claude destekli yapay zekâ; portföyünü bilir, web'de araştırır, kart-zengin yanıtlar verir.",
  },
  {
    icon: ChartLineUp,
    title: "Portföy & Analiz",
    body: "Risk skoru, sektör dağılımı, teknik göstergeler ve Finovela Skoru tek ekranda.",
  },
  {
    icon: Robot,
    title: "Otomasyon & Brain",
    body: "Kurallar otopilotta çalışır; güven bütçesi, PIN eşiği ve acil durdurma sende.",
  },
  {
    icon: Target,
    title: "Hedefler & What-If",
    body: "Hedef koy, ilerlemeni izle, senaryoları simüle et — iyimser/baz/kötümser.",
  },
  {
    icon: Plugs,
    title: "Bağlantılar",
    body: "Kendi borsa hesabını AES-256 ile şifreli, yalnızca verdiğin yetki kadar bağla.",
  },
  {
    icon: ShieldCheck,
    title: "Güvenlik",
    body: "İşlem PIN'i, 2FA, yedek kurtarma kodları ve uçtan uca şifreleme.",
  },
];

export default function GuidePage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Kullanım Rehberi"
        title="Finovela'yı dakikalar içinde öğren"
        subtitle="Kaydolmaktan ilk otomasyonuna kadar her adım. Finovela bir yazılım (SaaS) ve eğitim/araştırma aracıdır — fonlarını tutmaz, yatırım tavsiyesi vermez; kararlar sana aittir."
      >
        <Link
          href="/app"
          className="inline-flex items-center gap-2 rounded-full bg-[#2b5cf0] px-6 py-3 text-sm font-semibold text-white transition hover:brightness-110"
        >
          Ücretsiz başla <ArrowRight size={16} weight="bold" />
        </Link>
      </PageHero>

      {/* Adım adım başlangıç */}
      <Section bg="#0a1838">
        <SectionHeading
          eyebrow="Başlangıç"
          title="Dört adımda kuruluma hazır"
          subtitle="Sırayla ilerle; her adım birkaç dakika sürer."
        />
        <div className="mx-auto mt-16 max-w-3xl space-y-5">
          {STEPS.map((s) => (
            <div
              key={s.n}
              className="flex flex-col gap-4 rounded-3xl border border-white/[0.08] bg-white/[0.03] p-7 sm:flex-row sm:items-start"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#2b5cf0] text-lg font-bold text-white">
                {s.n}
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="font-display text-xl font-bold text-white">{s.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-white/60">{s.body}</p>
                <Link
                  href={s.href}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#7fb0ff] transition hover:text-white"
                >
                  {s.cta} <ArrowRight size={14} weight="bold" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Ana modüller */}
      <Section bg="#071026" prev="#0a1838">
        <SectionHeading
          eyebrow="Modüller"
          title="Finovela neler yapar?"
          subtitle="Her modül tek bir işi iyi yapar — birlikte tam bir araştırma ve karar ortamı oluşturur."
        />
        <div className="mx-auto mt-16 grid max-w-[1100px] gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((m) => (
            <div
              key={m.title}
              className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-7"
            >
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#2b5cf0]/15 text-[#7fb0ff]">
                <m.icon size={24} weight="regular" />
              </span>
              <h3 className="font-display mt-5 text-lg font-bold text-white">{m.title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-white/55">{m.body}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* İpuçları + CTA */}
      <Section bg="#0a1838" prev="#071026">
        <SectionHeading
          eyebrow="İpuçları"
          title="Daha iyi sonuç için"
        />
        <div className="mx-auto mt-14 max-w-3xl space-y-4">
          {[
            "Sohbette net ol: \"NVDA al/sat\" yerine \"NVDA'yı son bilançosu ve teknikleriyle değerlendir\" daha zengin yanıt verir.",
            "Sesli mesajı dene: sohbet kutusundaki mikrofon ile konuşarak sor.",
            "Brain güven bütçesini düşük başlat; yapay zekâya güvendikçe yetkiyi artır.",
            "Takıldığın an sol-alttaki canlı destek (Fin) sana ürünün her yerinde yardımcı olur.",
          ].map((tip, i) => (
            <div
              key={i}
              className="flex items-start gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-5 py-4"
            >
              <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#2b5cf0]/20 text-xs font-bold text-[#7fb0ff]">
                {i + 1}
              </span>
              <p className="text-[15px] leading-relaxed text-white/70">{tip}</p>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-16 flex max-w-2xl flex-col items-center gap-5 rounded-3xl border border-white/[0.08] bg-white/[0.03] p-10 text-center">
          <h3 className="font-display text-2xl font-bold text-white">Hazır mısın?</h3>
          <p className="max-w-md text-[15px] leading-relaxed text-white/60">
            Ücretsiz başla, ilk sohbetinde portföyünü Finovela&apos;ya tanıt. Hiçbir çıktısı yatırım
            tavsiyesi değildir.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/app"
              className="inline-flex items-center gap-2 rounded-full bg-[#2b5cf0] px-6 py-3 text-sm font-semibold text-white transition hover:brightness-110"
            >
              Ücretsiz başla <ArrowRight size={16} weight="bold" />
            </Link>
            <Link
              href="/support"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.06]"
            >
              Destek &amp; SSS
            </Link>
          </div>
        </div>
      </Section>
    </PageShell>
  );
}
