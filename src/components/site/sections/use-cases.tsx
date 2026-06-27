"use client";

import { useRef } from "react";
import Image from "next/image";
import {
  ChatTeardropDots,
  CaretLeft,
  CaretRight,
} from "@phosphor-icons/react/dist/ssr";
import { CurveDivider } from "@/components/ui/curve-divider";

/**
 * Use Cases — "Daha Akıllı Yatırım İçin Yapay Zeka Destekli İşlem Araçları" +
 * yatay scroll-snap KARUSEL: telefon kartları (Canlı Web Araştırması / Sosyal
 * & Forum Nabzı / Kopya İşlem / Otomasyon & Alarm) + sol/sağ ok navigasyonu.
 */
const CARDS = [
  {
    title: "Canlı Web Araştırması",
    img: "/gen/uc-social.png",
    text: "Finovela soruyu yanıtlarken interneti canlı tarar; en güncel haberi, bilançoyu ve piyasa hareketini kaynak göstererek önüne getirir — kalabalıktan önce.",
  },
  {
    title: "Sosyal & Forum Nabzı",
    img: "/gen/uc-forum.png",
    text: "X, Reddit ve forumlardaki yükselen hikâyeleri ve duyarlılığı 7/24 dinler; bir sonraki büyük hamleyi sana sade bir özet ve kart olarak iletir.",
  },
  {
    title: "Kopya İşlem",
    img: "/gen/uc-copy.png",
    text: "Finovela en iyi yatırımcıları bulur, tarzına eşler ve dağılımlarını sanal (paper) portföyüne risksiz yansıtır.",
  },
  {
    title: "Otomasyon & Alarm",
    img: "/gen/uc-auto.png",
    text: "Kurallarını söyle: Finovela işlemleri otopilotta yapsın, portföyü dengelesin, fiyat ve haber alarmlarıyla seni uyarsın.",
  },
];

export function UseCases() {
  const trackRef = useRef<HTMLDivElement>(null);

  const scrollByCard = (dir: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    // bir kart genişliği + boşluk kadar kaydır (ilk karttan ölç, yoksa makul fallback)
    const firstCard = track.querySelector<HTMLElement>("[data-uc-card]");
    const gap = 24; // gap-6
    const step = firstCard ? firstCard.offsetWidth + gap : track.clientWidth * 0.8;
    track.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  return (
    <section className="relative overflow-hidden bg-[#071026]">
      <CurveDivider color="#071026" />
      <div className="mx-auto max-w-[1400px] px-6 py-40">
        <div className="flex items-center justify-center gap-2 text-gradient">
          <ChatTeardropDots size={22} weight="fill" />
          <span className="text-base font-bold">Finovela Kullanım Senaryoları</span>
        </div>
        <h2 className="font-display mx-auto mt-5 max-w-3xl text-center text-[36px] font-bold leading-[1.28] text-white">
          Daha Akıllı Yatırım İçin Yapay Zeka Destekli İşlem Araçları
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-center text-lg leading-relaxed text-white/55">
          Canlı web araştırmasından sosyal duyarlılığa, en iyi yatırımcıları
          kopyalamaktan otomasyon ve alarmlara kadar — Finovela hepsini
          uygulanabilir zekâya dönüştürür, tek bir AI sohbetinde.
        </p>

        {/* başlık üstü ok navigasyonu */}
        <div className="mt-12 flex items-center justify-end gap-3">
          <button
            type="button"
            aria-label="Önceki"
            onClick={() => scrollByCard(-1)}
            className="grid h-12 w-12 place-items-center rounded-full border border-white/15 bg-white/[0.04] text-white transition hover:border-[#3b6dff] hover:bg-[#3b6dff]/20 hover:text-[#a5c4ff]"
          >
            <CaretLeft size={20} weight="bold" />
          </button>
          <button
            type="button"
            aria-label="Sonraki"
            onClick={() => scrollByCard(1)}
            className="grid h-12 w-12 place-items-center rounded-full border border-white/15 bg-white/[0.04] text-white transition hover:border-[#3b6dff] hover:bg-[#3b6dff]/20 hover:text-[#a5c4ff]"
          >
            <CaretRight size={20} weight="bold" />
          </button>
        </div>

        {/* yatay kayan KARUSEL — geniş track, sonraki kart "peek" eder */}
        <div
          ref={trackRef}
          className="mt-6 flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {CARDS.map((c) => (
            <article
              key={c.title}
              data-uc-card
              className="group relative w-[78vw] max-w-[400px] shrink-0 snap-start overflow-hidden rounded-3xl border border-white/8 bg-[#0f2148] p-7 sm:w-[60vw] md:w-[44vw] lg:w-[calc((100%-3rem)/3)]"
            >
              {/* kartın üst yarısı görselin koyu zemini ile birebir → kutu/halka görünmez */}
              <div className="relative mx-auto aspect-[3/4] w-[92%]">
                <Image
                  src={c.img}
                  alt={c.title}
                  fill
                  quality={100}
                  className="object-cover"
                />
              </div>
              <h3 className="font-display mt-6 text-3xl font-bold text-white">
                {c.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-white/55">{c.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
