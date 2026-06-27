import Image from "next/image";
import Link from "next/link";
import { Sparkle, ArrowLeft, ArrowRight, CaretUp } from "@phosphor-icons/react/dist/ssr";
import { CurveDivider } from "@/components/ui/curve-divider";

/**
 * AI Portfolios — RockFlow: parlak mor üst (3D cam küp + metin), altta backtest-return
 * carousel kartları. Vela kristal küp + canlı portfolio kartları.
 */
const PORTFOLIOS = [
  { name: "Yükselen Yıldızlar", author: "Beta", desc: "Merkezinde yapay zeka altyapısı; Broadcom, TSMC ve hesaplama çağının diğer yükselen yıldızlarından oluşan bir kadro.", ret: "+72,40%" },
  { name: "Hoşça Kal Musk", author: "Rocker", desc: "Yapay zeka, elektrikli araç ve kriptonun üç devi ayrışırken, bu sepet ivmenin üzerine biner.", ret: "+58,86%" },
  { name: "ENFP İnovasyon", author: "Pure Delta", desc: "İdealistler için tasarlandı — en yeni teknolojiyi, sosyal etki odaklı isimleri ve yüksek büyüme bahislerini harmanlar.", ret: "+148,19%" },
];

export function AiPortfolios() {
  return (
    <>
      {/* parlak üst */}
      <section className="bg-aurora relative overflow-hidden">
        <CurveDivider color="#071026" />
        <div className="mx-auto grid max-w-[1400px] items-center gap-8 px-6 py-32 lg:grid-cols-2">
          <div className="relative order-2 lg:order-1">
            <div className="absolute left-1/2 top-1/2 -z-10 h-[80%] w-[80%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(91,140,255,0.6)_0%,transparent_60%)] blur-2xl" />
            <Image src="/gen/sec-cubes.png" alt="" width={900} height={900} quality={100} className="mx-auto w-full max-w-lg" />
          </div>
          <div className="order-1 lg:order-2">
            <p className="font-display text-4xl font-bold sm:text-[3rem]">
              <span className="bg-[linear-gradient(91deg,#a5c4ff,#5b8cff)] bg-clip-text text-transparent">AI Portföyler</span>
            </p>
            <h2 className="font-display mt-3 text-[42px] font-bold leading-[1.3] text-white">
              Yatırım Fikirlerinden Saniyeler İçinde Kur
            </h2>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-white/70">
              20'den fazla hazır AI portföye göz at: meme temaları, gelir
              korumaları ya da kantitatif seçkiler — hepsi Finovela AI gücüyle.
              Herhangi birini saniyeler içinde sanal portföyünde dene.
            </p>
            <Link href="/app" className="mt-9 inline-flex h-14 items-center justify-center rounded-full bg-[linear-gradient(90deg,#cfe0ff,#e6f0ff)] px-9 text-lg font-semibold text-black transition hover:brightness-105">
              Finovela ile Sohbet Et
            </Link>
          </div>
        </div>
      </section>

      {/* carousel kartlar — kenarlardan taşan (RockFlow gibi), alt parlak mor */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#071026] via-[#0a1838] to-[#16306b] pb-20">
        <div className="py-16">
          <div className="flex gap-6 overflow-x-auto px-[max(1.5rem,calc((100%-1180px)/2))] pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {PORTFOLIOS.map((p) => (
              <article key={p.name} className="w-[440px] shrink-0 rounded-3xl border border-white/8 bg-[rgba(12,24,52,0.7)] p-8">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="font-display text-2xl font-bold text-white">{p.name}</h3>
                  <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[linear-gradient(90deg,#5b8cff,#2b5cf0)] px-3.5 py-1.5 text-xs font-semibold text-white">
                    <Sparkle size={13} weight="fill" /> AI Portföy
                  </span>
                </div>
                <div className="mt-5 flex items-center gap-2">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-[#5b8cff]/25 text-xs font-bold text-[#7fb0ff]">{p.author[0]}</span>
                  <span className="text-sm font-semibold text-[#7fb0ff]">{p.author}</span>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-white/55">{p.desc}</p>
                <p className="mt-6 text-sm font-semibold text-white/70">1 Yıllık Geriye Dönük Test Getirisi</p>
                <p className="mt-1 flex items-center gap-1 text-2xl font-bold text-[#7fb0ff]">
                  <CaretUp size={18} weight="fill" /> {p.ret}
                </p>
              </article>
            ))}
          </div>
          <div className="mt-8 flex justify-center gap-4">
            <button className="grid h-12 w-12 place-items-center rounded-full border border-white/25 text-white transition hover:bg-white/10"><ArrowLeft size={18} /></button>
            <button className="grid h-12 w-12 place-items-center rounded-full border border-white/25 text-white transition hover:bg-white/10"><ArrowRight size={18} /></button>
          </div>
        </div>
      </section>
    </>
  );
}
