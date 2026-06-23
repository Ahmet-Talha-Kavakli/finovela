"use client";

import Image from "next/image";
import { GlassButton } from "@/components/ui/glass-button";
import { ChatCircleDots, PlayCircle } from "@phosphor-icons/react";

/**
 * Hero — RockFlow birebir kurgu: tam-genişlik sinematik SAHNE zemin
 * (dalga silüeti + yıldızlı mor gök + kayan yıldız + ışıklı yelken),
 * metin sol-üstte, sahne tüm alana yayılır.
 * "Ananas" mantığı: aynı kompozisyon, farklı özne (yelken = Vela).
 */
export function Hero() {
  return (
    <section className="relative -mt-[76px] min-h-[760px] overflow-hidden bg-[#1a0a35] pt-[76px]">
      {/* tam-genişlik sinematik sahne zemini */}
      <div className="absolute inset-0">
        <Image
          src="/gen/hero-scene.png"
          alt=""
          fill
          priority
          className="object-cover object-right"
        />
        {/* sol koyu degrade — metin okunurluğu (RockFlow gibi) */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#1a0a35] via-[#1a0a35]/70 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-[#1a0a35]" />
      </div>

      <div className="relative mx-auto flex min-h-[684px] max-w-7xl items-center px-5">
        <div className="max-w-xl py-16">
          <p className="font-display text-3xl font-bold text-[#c084fc] sm:text-4xl">
            Vela
          </p>
          <h1 className="font-display mt-2 text-[3.25rem] font-bold leading-[1.0] text-white sm:text-6xl lg:text-7xl">
            Your 24/7 AI
            <br />
            investing assistant
          </h1>
          <p className="mt-6 max-w-md text-lg text-white/70">
            Create an AI portfolio in one sentence. Trade in one click. Vela
            builds the strategy, automates every buy and sell, and runs it
            around the clock — so you don&apos;t have to.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <GlassButton size="xl" tone="brand" href="/app">
              <ChatCircleDots size={20} weight="fill" />
              Chat with Vela
            </GlassButton>
            <button className="inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-3.5 text-[15px] font-medium text-white/85 backdrop-blur-md transition hover:bg-white/5">
              <PlayCircle size={22} weight="duotone" />
              Watch demo
            </button>
          </div>

          <p className="mt-5 text-xs text-white/45">
            Free to start · Paper-trading demo · No real money required
          </p>
        </div>
      </div>
    </section>
  );
}
