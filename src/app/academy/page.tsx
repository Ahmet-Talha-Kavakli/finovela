import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { PageShell } from "@/components/site/page-shell";
import { PageHero, Section, SectionHeading, CtaBand } from "@/components/site/page-parts";
import {
  GraduationCap,
  BookOpen,
  ChartLineUp,
  CurrencyBtc,
  Scales,
  Brain,
} from "@phosphor-icons/react/dist/ssr";

export const metadata: Metadata = {
  title: "Akademi — Finovela",
  description:
    "AI ile yatırımı öğren. Ücretsiz kurslar, rehberler ve kısa dersler — ilk payından opsiyonlara, kriptoya ve vergi-akıllı yatırıma kadar.",
};

const TRACKS = [
  { icon: BookOpen, name: "Yatırıma Giriş", lessons: 12, level: "Başlangıç", desc: "Hesap aç, ilk payını al ve temelleri anla.", image: "/gen/card-academy-temel.png" },
  { icon: Brain, name: "AI ile Yatırım", lessons: 9, level: "Başlangıç", desc: "Finovela'ya nasıl talimat verilir, sohbetle portföy kurmak ve AI'a güvenmek (ve doğrulamak).", image: "/gen/card-academy-analiz.png" },
  { icon: ChartLineUp, name: "Piyasayı Okumak", lessons: 14, level: "Orta", desc: "Grafikler, temel veriler, bilançolar ve fiyatları gerçekte ne hareket ettirir.", image: "/gen/card-academy-portfoy.png" },
  { icon: Scales, name: "Opsiyonların Sırrı", lessons: 11, level: "Orta", desc: "Alım, satım, spread'ler ve bunları parmak yakmadan kullanmak.", image: "/gen/card-academy-risk.png" },
  { icon: CurrencyBtc, name: "Kripto Temelleri", lessons: 8, level: "Başlangıç", desc: "Kripto nedir, güvenle nasıl tutulur ve bir portföye nasıl uyar.", image: "/gen/card-academy-otomasyon.png" },
  { icon: Scales, name: "Vergi-Akıllı Yatırım", lessons: 7, level: "İleri", desc: "Mahsup, hesap türleri ve getirinin daha fazlasını elinde tutmak.", image: "/gen/card-academy-ileri.png" },
];

const ARTICLES = [
  "Dolar-maliyet ortalaması nedir — ve neden işe yarar",
  "Bir bilanço raporu 5 dakikada nasıl okunur",
  "Endeks fonları mı hisse seçimi mi: sana hangisi uygun?",
  "Riski anlamak: oynaklık, düşüş ve sen",
  "Yeni başlayanlar için portföy kurma rehberi",
  "AI, insanların yatırım yapma şeklini nasıl değiştiriyor",
];

export default function AcademyPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Akademi"
        image="/gen/p-academy.png"
        title="AI ile yatırımı öğren"
        subtitle="Ücretsiz, sade dilde dersler — ilk payından ileri stratejilere kadar. Eğitmenin Finovela ile kendi hızında öğren."
      />

      <Section bg="#0a1838" prev="#0c1d40">
        <SectionHeading
          eyebrow="Öğrenme yolları"
          title="Nereden istersen başla"
          subtitle="Her seviye için yapılandırılmış kurslar; her biri kısa ve pratik derslere bölünmüş."
        />
        <div className="mt-16 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {TRACKS.map((t) => (
            <Link
              key={t.name}
              href="/app"
              className="group rounded-3xl border border-white/8 bg-white/[0.03] p-7 transition hover:border-white/15 hover:bg-white/[0.05]"
            >
              <div className="flex items-start justify-between">
                <Image
                  src={t.image}
                  alt=""
                  width={176}
                  height={176}
                  className="-ml-2 h-40 w-40 object-contain"
                />
                <span className="rounded-full border border-white/12 px-2.5 py-1 text-xs text-white/55">
                  {t.level}
                </span>
              </div>
              <h3 className="font-display mt-5 text-xl font-bold text-white">
                {t.name}
              </h3>
              <p className="mt-2.5 text-[15px] leading-relaxed text-white/55">
                {t.desc}
              </p>
              <p className="mt-4 text-xs text-white/40">{t.lessons} ders</p>
            </Link>
          ))}
        </div>
      </Section>

      <Section bg="#071026" prev="#0a1838">
        <SectionHeading eyebrow="Rehberler" title="Popüler içerikler" />
        <div className="mx-auto mt-12 grid max-w-4xl gap-3 sm:grid-cols-2">
          {ARTICLES.map((a) => (
            <Link
              key={a}
              href="/blog"
              className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-5 py-4 text-[15px] text-white/80 transition hover:border-white/15"
            >
              <GraduationCap size={20} weight="duotone" className="shrink-0 text-brand" />
              {a}
            </Link>
          ))}
        </div>
      </Section>

      <CtaBand
        title="Bilgi en iyi getiriyi verir"
        subtitle="Öğrenmeye ücretsiz başla — sonra Finovela ile uygulamaya dök."
        prev="#071026"
      />
    </PageShell>
  );
}
