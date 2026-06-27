"use client";

import Image from "next/image";
import Link from "next/link";

/**
 * Hero — RockFlow birebir kopya (rockflow.ai/bobby):
 * tam-genişlik sahne zemin (yelken + dağ + kayan yıldız),
 * sol-ortada metin: "Vela" gradient → "Your 24/7 AI Investing Assistant" beyaz,
 * "Try Vela Free Now: ..." satırı, açık/beyaz "Chat With Vela" pill.
 */
export function Hero() {
  return (
    <section className="relative h-screen min-h-[760px] max-h-[1000px] overflow-hidden bg-[#0a1838]">
      {/* tam-genişlik sahne zemin */}
      <div className="absolute inset-0">
        <Image
          src="/gen/hero-scene.png"
          alt=""
          fill
          priority
          quality={100}
          className="object-cover object-center"
        />
        {/* üst PARLAK MOR (RockFlow nav bölgesi) — parlak menekşe, yumuşak iniş */}
        <div className="absolute inset-x-0 top-0 h-[58%] bg-gradient-to-b from-[#3b6dff] via-[#16306b]/45 to-transparent" />
        {/* sol HAFİF koyu degrade — metin okunurluğu (RockFlow havadar, çok hafif) */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0c1d40]/85 via-[#0c1d40]/30 to-transparent" />
        {/* alt LİLA SİS (RockFlow dağ üstü açık pus) — belirgin açık lavanta */}
        <div className="absolute inset-x-0 bottom-0 h-[50%] bg-gradient-to-t from-[#cfe0ff]/55 via-[#5b8cff]/22 to-transparent" />
        {/* en alt yumuşak geçiş — açık lavandadan zemine */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-[#0a1838]" />
      </div>

      {/* metin — sol, dikey ORTALI (RockFlow birebir ölçüldü) */}
      <div className="relative mx-auto flex h-full max-w-[1400px] items-center px-8 pt-[96px]">
        <div className="max-w-none">
          {/* Marka kelimesi — 52px/700, gradient #a5c4ff → #5b8cff (RockFlow ölçüldü) */}
          <p className="font-display text-[52px] font-bold leading-[72px]">
            <span className="bg-[linear-gradient(91deg,#a5c4ff_21.75%,#5b8cff_83.42%)] bg-clip-text text-transparent">
              Finovela
            </span>
          </p>
          {/* Başlık — 52px/700, line-height 72px, TEK SATIR (RockFlow ölçüldü) */}
          <h1 className="font-display whitespace-nowrap text-[52px] font-bold leading-[72px] text-white">
            7/24 Yapay Zeka Yatırım Araştırma Asistanın
          </h1>

          {/* Alt satır — 16px/700, beyaz (RockFlow ölçüldü) */}
          <p className="mt-8 max-w-[560px] text-base font-bold leading-6 text-white">
            Claude destekli sohbet: piyasayı webden canlı tarar, yüklediğin
            grafikleri okur, fikrini sanal portföyde test eder ve içgörü sunar.
            Risksiz dene — ücretsiz.
          </p>

          {/* uyumluluk rozeti — zarif, göze batmadan görünür */}
          <p className="mt-5 max-w-[560px] text-xs font-medium leading-5 text-white/60">
            Yazılım &amp; eğitim aracı — yatırım danışmanlığı değil · paranı asla
            tutmayız
          </p>

          {/* CTA — 18px/600, h56, gradient #cfe0ff → #e6f0ff, SİYAH metin (RockFlow ölçüldü) */}
          <div className="mt-10">
            <Link
              href="/app"
              className="inline-flex h-14 items-center justify-center rounded-full bg-[linear-gradient(90deg,#cfe0ff_0%,#e6f0ff_100%)] px-9 text-lg font-semibold text-black shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-2px_rgba(0,0,0,0.1)] transition hover:brightness-105"
            >
              Finovela ile Sohbet Et
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
