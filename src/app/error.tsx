"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect } from "react";
import { ArrowClockwise, House } from "@phosphor-icons/react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Hata izleme servisine bağlanacaksa burada raporlanır.
    console.error(error);
  }, [error]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(120%_120%_at_50%_-10%,#16306b_0%,#0c1d40_55%,#0a1838_100%)] px-6 py-24">
      <div className="w-full max-w-lg text-center">
        {/* görsel — cam kopuk obje; yoksa zarif boşluk kalır */}
        <div className="relative mx-auto aspect-square w-full max-w-[280px]">
          <div className="absolute inset-[16%] -z-10 rounded-full bg-[radial-gradient(circle,rgba(59,109,255,0.45),transparent_65%)] blur-3xl" />
          <Image
            src="/gen/error-illustration.png"
            alt=""
            fill
            quality={100}
            className="object-contain drop-shadow-[0_20px_50px_rgba(43,92,240,0.4)]"
          />
        </div>

        <p className="text-gradient mt-2 text-sm font-bold tracking-wide">
          HATA
        </p>
        <h1 className="font-display mt-3 text-[clamp(28px,5vw,42px)] font-bold leading-[1.1] text-white">
          Bir şeyler ters gitti
        </h1>
        <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-white/60">
          Beklenmeyen bir sorun oluştu. Bağlantı bir an için koptu — tekrar
          deneyebilir ya da ana sayfaya dönebilirsin.
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={() => reset()}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[linear-gradient(90deg,#cfe0ff,#e6f0ff)] px-7 text-base font-semibold text-black transition hover:brightness-105"
          >
            <ArrowClockwise size={18} weight="bold" />
            Tekrar dene
          </button>
          <Link
            href="/"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/30 px-7 text-base font-semibold text-white transition hover:bg-white/10"
          >
            <House size={18} weight="bold" />
            Ana sayfaya dön
          </Link>
        </div>

        {error?.digest ? (
          <p className="mt-7 text-xs text-white/35">Referans: {error.digest}</p>
        ) : null}
      </div>
    </div>
  );
}
