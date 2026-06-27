import Image from "next/image";
import Link from "next/link";
import { CurveDivider } from "@/components/ui/curve-divider";

/**
 * "Talk, Tap, Profit — Investing Made Natural" — RockFlow yapısı.
 * SOL: KULLANICININ ürettiği şeffaf (alpha) dik iPhone GÖRSELİ (phone-user.png),
 * ekranı boş → arka plan zaten şeffaf, zemine kaynaşır (kutu YOK). Ekran içeriği
 * GERÇEK HTML/CSS ile ekran camına `perspective` ile oturur. SAĞ: metin + CTA.
 */
export function MadeNatural() {
  return (
    <section className="relative overflow-hidden bg-[#0f2148]">
      <CurveDivider color="#0a1838" />
      <div className="mx-auto grid max-w-[1400px] items-center gap-10 px-6 py-40 lg:grid-cols-2">
        {/* SOL — şeffaf yan açılı (4:3) telefon GÖRSELİ — hero side-angle çekim. */}
        <div className="relative mx-auto flex aspect-[4/3] w-full max-w-xl items-center justify-center lg:max-w-2xl">
          {/* arka glow — telefonun arkasında */}
          <div className="absolute left-1/2 top-1/2 -z-10 h-[75%] w-[75%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(59,109,255,0.5)_0%,transparent_65%)] blur-3xl" />

          <Image
            src="/gen/phone-user.png"
            alt="Finovela mobil sohbet"
            width={1000}
            height={750}
            quality={100}
            priority
            className="relative h-auto w-full object-contain drop-shadow-[0_30px_80px_rgba(0,0,0,0.5)]"
          />
        </div>
        {/* SAĞ — metin */}
        <div>
          <h2 className="font-display text-[42px] font-bold leading-[1.3] text-white">
            Konuş, Dokun, Anla
            <br />
            Araştırma Artık Çok Doğal
          </h2>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-white/65">
            &ldquo;Finovela, teknoloji hisselerimdeki riski analiz et.&rdquo;
            Finovela analiz eder, olası bir koruma stratejisini kurar ve sanal
            portföyde test eder — sıfır tık. Ücretsiz AI yatırım araştırma
            uygulamasında sesle keşfet.
          </p>
          <Link
            href="/app"
            className="mt-9 inline-flex h-14 items-center justify-center rounded-full bg-[linear-gradient(90deg,#cfe0ff,#e6f0ff)] px-9 text-lg font-semibold text-black transition hover:brightness-105"
          >
            Finovela ile Sohbet Et
          </Link>
        </div>
      </div>
    </section>
  );
}
