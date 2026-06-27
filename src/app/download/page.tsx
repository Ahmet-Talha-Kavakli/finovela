import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { PageShell } from "@/components/site/page-shell";
import { Section, SectionHeading, CtaBand } from "@/components/site/page-parts";
import { AppStoreBadge, GooglePlayBadge } from "@/components/site/store-badges";
import {
  ChatCircleDots,
  BellRinging,
  Fingerprint,
  Lightning,
  DeviceMobile,
  Desktop,
  ShieldCheck,
  QrCode,
  Star,
} from "@phosphor-icons/react/dist/ssr";

export const metadata: Metadata = {
  title: "Finovela'yı İndir",
  description:
    "Finovela mobil uygulamasını indir. AI sohbet, portföy ve otomasyon cebinde. iOS ve Android için.",
};

const HIGHLIGHTS = [
  {
    icon: ChatCircleDots,
    t: "Cebinde AI sohbet",
    d: "Claude destekli Finovela ile her an konuş, portföyünü sesli ya da yazılı yönet.",
  },
  {
    icon: BellRinging,
    t: "Anlık bildirim",
    d: "Fiyat alarmları, otomasyon tetikleyicileri ve piyasa hareketleri anında telefonunda.",
  },
  {
    icon: Fingerprint,
    t: "Biyometrik güvenlik",
    d: "Face ID ve parmak izi ile giriş; banka düzeyinde şifreleme ve 2FA.",
  },
  {
    icon: Lightning,
    t: "Anlık senkronizasyon",
    d: "Telefonda başla, masaüstünde bitir. Tek hesap, tüm cihazlar arasında saniyede güncel.",
  },
];

export default function DownloadPage() {
  return (
    <PageShell>
      {/* hero — içerik solda, telefon görseli sağda */}
      <section className="relative overflow-hidden bg-[radial-gradient(120%_120%_at_70%_-10%,#16306b_0%,#0c1d40_55%,#0a1838_100%)]">
        <div className="mx-auto grid max-w-[1300px] items-center gap-10 px-6 pb-28 pt-48 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="text-center lg:text-left">
            <span className="text-gradient text-base font-bold">İndir</span>
            <h1 className="font-display mt-5 text-[clamp(38px,5.4vw,64px)] font-bold leading-[1.08] text-white">
              Finovela&apos;yı indir
            </h1>
            <p className="mx-auto mt-7 max-w-md text-lg leading-relaxed text-white/60 lg:mx-0">
              AI sohbet, portföy ve otomasyon artık cebinde. Finovela mobil
              uygulamasıyla yatırımını her an, her yerden yönet.
            </p>

            {/* store rozetleri */}
            <div className="mt-9 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
              <AppStoreBadge />
              <GooglePlayBadge />
            </div>

            {/* QR + web linki */}
            <div className="mt-9 flex flex-col items-center gap-5 sm:flex-row lg:items-start">
              <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="relative grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]">
                  <QrCode size={64} weight="thin" className="text-white/45" />
                  <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,109,255,0.18),transparent_70%)]" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-white">
                    Telefonunla tara
                  </p>
                  <p className="mt-1 max-w-[180px] text-xs leading-relaxed text-white/50">
                    Kamerayı QR koduna tut, doğru mağazaya yönlendirelim.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-center gap-2 text-sm text-white/45 lg:justify-start">
              <span className="flex">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Star
                    key={i}
                    size={15}
                    weight="fill"
                    className="text-[#ffc857]"
                  />
                ))}
              </span>
              <span>4,9 · 28.000+ değerlendirme</span>
            </div>
          </div>

          {/* telefon görseli (harici png) — zemine kaynaşık, cam ışık */}
          <div className="relative mx-auto aspect-[3/4] w-full max-w-[360px]">
            <div className="absolute inset-[8%] -z-10 rounded-[40%] bg-[radial-gradient(circle,rgba(59,109,255,0.5),transparent_65%)] blur-3xl" />
            <Image
              src="/gen/download-phone.png"
              alt="Finovela mobil uygulaması"
              fill
              priority
              quality={100}
              className="object-contain drop-shadow-[0_30px_70px_rgba(43,92,240,0.45)]"
            />
          </div>
        </div>
      </section>

      {/* öne çıkanlar */}
      <Section bg="#0a1838" prev="#0c1d40">
        <SectionHeading
          eyebrow="Mobilde neler var"
          title="Yatırımının tamamı, cebinde"
          subtitle="Masaüstündeki her şey — sohbet, portföy, otomasyon ve alarmlar — telefonunda da tam güçle çalışır."
        />
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {HIGHLIGHTS.map((c) => (
            <div
              key={c.t}
              className="rounded-3xl border border-white/8 bg-white/[0.03] p-7 transition hover:border-white/15 hover:bg-white/[0.05]"
            >
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand/15 text-brand">
                <c.icon size={24} weight="duotone" />
              </span>
              <h3 className="font-display mt-5 text-lg font-bold text-white">
                {c.t}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/55">
                {c.d}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* tek hesap her cihaz */}
      <Section bg="#071026" prev="#0a1838">
        <SectionHeading
          eyebrow="Her yerde Finovela"
          title="Tek hesap, her cihaz"
          subtitle="iOS, Android ve web tek hesapta birleşir. Hangi cihazda kaldıysan kaldığın yerden devam et."
        />
        <div className="mt-14 grid gap-5 sm:grid-cols-3">
          {[
            {
              icon: DeviceMobile,
              t: "Yerel mobil uygulamalar",
              d: "iOS ve Android için baştan tasarlandı — hızlı, akıcı ve çevrimdışı dayanıklı.",
            },
            {
              icon: Desktop,
              t: "Tam web uygulaması",
              d: "İndirmeye gerek yok; tüm özellikler tarayıcıda da eksiksiz çalışır.",
            },
            {
              icon: ShieldCheck,
              t: "Banka düzeyinde güvenlik",
              d: "Uçtan uca şifreleme, biyometrik giriş ve 2FA ile varlıkların güvende.",
            },
          ].map((c) => (
            <div
              key={c.t}
              className="rounded-3xl border border-white/8 bg-white/[0.03] p-7"
            >
              <c.icon size={28} weight="duotone" className="text-brand" />
              <h3 className="font-display mt-4 text-lg font-bold text-white">
                {c.t}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-white/55">
                {c.d}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
          <AppStoreBadge />
          <GooglePlayBadge />
          <Link
            href="/app"
            className="inline-flex h-14 items-center justify-center rounded-full border border-white/25 px-7 text-base font-semibold text-white transition hover:bg-white/10"
          >
            Web uygulamasını aç
          </Link>
        </div>
      </Section>

      <CtaBand
        prev="#071026"
        title="Finovela cebinde seni bekliyor"
        subtitle="İndir, hesabını oluştur ve AI yatırım yardımcınla saniyeler içinde başla."
      />
    </PageShell>
  );
}
