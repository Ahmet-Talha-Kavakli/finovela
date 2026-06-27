import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { PageShell } from "@/components/site/page-shell";
import { PageHero, Section, SectionHeading, FaqList } from "@/components/site/page-parts";
import {
  BookOpen,
  ShieldCheck,
  Wallet,
  Robot,
  Lock,
  Question,
} from "@phosphor-icons/react/dist/ssr";

export const metadata: Metadata = {
  title: "Destek — Finovela",
  description:
    "Finovela ile ilgili yardım al. Sık konuları incele, SSS'yi oku ya da ekibimize ulaş — 7/24 buradayız.",
};

const TOPICS = [
  { icon: BookOpen, name: "Başlangıç", desc: "Hesabını ve portföyünü birkaç dakikada kur.", image: "/gen/card-support-otomasyon.png" },
  { icon: Robot, name: "Finovela AI kullanımı", desc: "Sohbet, ses, portföyler ve otomasyon.", image: "/gen/card-support-aikullanim.png" },
  { icon: ShieldCheck, name: "Hesap ve güvenlik", desc: "Giriş, 2FA ve hesabını güvende tutma.", image: "/gen/card-support-hesap.png" },
  { icon: Question, name: "Abonelik ve faturalama", desc: "Plan yükseltme, iptal ve Paddle ödemeleri.", image: "/gen/card-support-islem.png" },
  { icon: Lock, name: "Gizlilik ve veri", desc: "Bilgilerini nasıl koruduğumuz ve işlediğimiz.", image: "/gen/card-support-veri.png" },
  { icon: Wallet, name: "Bağlantılar", desc: "Kendi borsa hesabını güvenle bağla ve yönet.", image: "/gen/card-support-para.png" },
];

const FAQ = [
  {
    q: "Finovela'ya nasıl başlarım?",
    a: "Web'den ya da uygulamadan kaydol, kısa bir başlangıç akışıyla risk profilini ve hedeflerini belirle, sonra portföyünü kur ve Finovela ile araştırmaya başla. Tüm süreç birkaç dakika sürer.",
  },
  {
    q: "Finovela bir aracı kurum mu, paramı tutar mı?",
    a: "Hayır. Finovela bir yazılım (SaaS) ve eğitim/araştırma aracıdır — aracı kurum veya yatırım danışmanı DEĞİLDİR ve fonlarını ASLA tutmaz. Uygulama içindeki portföy ve işlemler simülasyon (kâğıt-portföy) üzerinde çalışır. İstersen kendi borsa hesabını API anahtarıyla bağlarsın; o zaman işlemler senin kendi hesabında, verdiğin yetki kadar gerçekleşir — Finovela aracılık etmez.",
  },
  {
    q: "Verilerim güvende mi?",
    a: "Evet. Her şey uçtan uca şifrelenir, bağladığın API anahtarları AES-256 ile saklanır, kimlik doğrulama güvenli bir sağlayıcıyla (Clerk) yapılır. Finovela kişisel verini asla satmaz.",
  },
  {
    q: "Finovela finansal tavsiye veriyor mu?",
    a: "Hayır. Finovela, kendi kararlarını vermene yardımcı olmak için yapay zekâ destekli analiz, eğitim ve araçlar sunar. Hiçbir çıktısı yatırım tavsiyesi değildir; lisanslı bir uzmandan alınacak kişiye özel danışmanlığın yerini tutmaz. Kararlar tamamen sana aittir.",
  },
  {
    q: "Maliyeti nedir?",
    a: "Finovela ücretsiz başlar (günlük sınırlı yapay zekâ + temel özellikler). Pro ve Unlimited, aylık abonelikle sınırsız sohbet, otomasyon ve gelişmiş analizin kilidini açar. Ödeme, Merchant of Record'umuz Paddle ile alınır. Ayrıntılar için fiyatlandırma sayfasına bak.",
  },
  {
    q: "Bir insana nasıl ulaşırım?",
    a: "Sol-alttaki canlı destek balonuna (Fin) tıklayarak anında yanıt alabilir ya da support@finovela.com adresine e-posta gönderebilirsin. Genellikle birkaç saat içinde dönüş yaparız.",
  },
];

export default function SupportPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Destek"
        image="/gen/p-support.png"
        title="Nasıl yardımcı olabiliriz?"
        subtitle="Yanıtları hızlıca bul, sık konuları incele ya da ekibimize ulaş. Günün her saati buradayız."
      />

      {/* iletişim kartları */}
      <section className="relative overflow-hidden bg-[#0a1838]">
        <div className="mx-auto grid max-w-[900px] gap-5 px-6 pb-16 sm:grid-cols-2">
          <Link
            href="/app"
            className="group rounded-3xl border border-white/10 bg-white/[0.03] p-8 transition hover:border-white/20"
          >
            <Image
              src="/gen/card-support-aikullanim.png"
              alt=""
              width={112}
              height={112}
              className="-ml-1 h-24 w-24 object-contain"
            />
            <h3 className="font-display mt-4 text-xl font-bold text-white">
              Bizimle sohbet et
            </h3>
            <p className="mt-2 text-sm text-white/55">
              Uygulama içi 7/24 destek. Takıldığın yerden çıkmanın en hızlı yolu.
            </p>
          </Link>
          <a
            href="mailto:support@finovela.com"
            className="group rounded-3xl border border-white/10 bg-white/[0.03] p-8 transition hover:border-white/20"
          >
            <Image
              src="/gen/card-support-veri.png"
              alt=""
              width={112}
              height={112}
              className="-ml-1 h-24 w-24 object-contain"
            />
            <h3 className="font-display mt-4 text-xl font-bold text-white">
              E-posta gönder
            </h3>
            <p className="mt-2 text-sm text-white/55">
              support@finovela.com — birkaç saat içinde yanıtlıyoruz.
            </p>
          </a>
        </div>
      </section>

      <Section bg="#071026" prev="#0a1838">
        <SectionHeading eyebrow="Yardım konuları" title="Konuya göre göz at" />
        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {TOPICS.map((t) => (
            <Link
              key={t.name}
              href="/support"
              className="group rounded-3xl border border-white/8 bg-white/[0.03] p-7 transition hover:border-white/15 hover:bg-white/[0.05]"
            >
              <Image
                src={t.image}
                alt=""
                width={112}
                height={112}
                className="-ml-1 h-24 w-24 object-contain"
              />
              <h3 className="font-display mt-4 text-lg font-bold text-white">
                {t.name}
              </h3>
              <p className="mt-1.5 text-sm text-white/55">{t.desc}</p>
            </Link>
          ))}
        </div>
      </Section>

      <section className="relative overflow-hidden bg-[#0a1838]">
        <div className="mx-auto max-w-[1000px] px-6 py-28">
          <h2 className="font-display text-center text-[clamp(28px,4vw,40px)] font-bold text-white">
            Sıkça sorulan sorular
          </h2>
          <FaqList items={FAQ} />
        </div>
      </section>
    </PageShell>
  );
}
