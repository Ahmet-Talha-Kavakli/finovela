import Image from "next/image";

/**
 * AI NATIVE — imza bölüm: aurora patlaması zemin + ortada MacBook görseli + play,
 * altta dev "AI NATIVE" yazısı. Finovela mavi diliyle.
 */
export function AiNative() {
  return (
    <section className="relative overflow-hidden bg-[#0a1838]">
      <div className="relative mx-auto max-w-[1400px] px-6 pt-10 pb-0">
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-3xl">
          <Image
            src="/gen/sec-ainative.png"
            alt=""
            fill
            quality={100}
            className="object-cover"
          />
          {/* ortada gerçekçi MacBook görseli + play */}
          <div className="absolute inset-0 grid place-items-center">
            <div className="relative w-[46%] max-w-[560px]">
              <Image
                src="/gen/ainative-macbook.png"
                alt="Finovela masaüstü"
                width={560}
                height={306}
                quality={100}
                className="h-auto w-full object-contain drop-shadow-[0_30px_70px_rgba(59,109,255,0.5)]"
              />
              {/* ekran ortasına oturan play butonu */}
              <button className="absolute left-1/2 top-[42%] grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-[#0a1838] shadow-xl transition hover:scale-105">
                <svg viewBox="0 0 24 24" className="ml-0.5 h-6 w-6 fill-current">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
            </div>
          </div>
          {/* dev AI NATIVE yazısı */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-center pb-[3%]">
            <span className="font-display text-[14vw] font-bold leading-none tracking-tight text-white/95 drop-shadow-[0_0_40px_rgba(91,140,255,0.7)]">
              AI NATIVE
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
