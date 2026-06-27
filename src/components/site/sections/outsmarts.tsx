import Image from "next/image";
import Link from "next/link";
import { CurveDivider } from "@/components/ui/curve-divider";

/**
 * "Why Vela Outsmarts the Market" — RockFlow parlak mor bölüm:
 * sol metin + CTA, sağ 3D kristal beyin/çip görseli.
 */
export function Outsmarts() {
  return (
    <section className="relative overflow-hidden bg-[radial-gradient(110%_110%_at_72%_48%,#122a5a_0%,#16306b_40%,#0a1838_100%)]">
      <CurveDivider color="#16306b" />
      <div className="mx-auto grid max-w-[1400px] items-center gap-8 px-6 py-40 lg:grid-cols-2">
        <div>
          <h2 className="font-display text-[42px] font-bold leading-[1.3] text-white">
            Finovela Piyasayı Neden Geride Bırakır
          </h2>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-white/75">
            Finovela&apos;nın beyni Claude&apos;dur: webde canlı araştırma yapıp
            kaynak gösterir, teknik (RSI, MACD, Bollinger) ve davranışsal
            sinyalleri birlikte okur, kararını Finovela Skoru&apos;na döker. Her
            fikri gerçek para riski olmadan sanal işlemle test edebilirsin.
          </p>
          <Link
            href="/app"
            className="mt-9 inline-flex h-14 items-center justify-center rounded-full bg-[linear-gradient(90deg,#cfe0ff,#e6f0ff)] px-9 text-lg font-semibold text-black transition hover:brightness-105"
          >
            Finovela ile Sohbet Et
          </Link>
        </div>
        <div className="relative">
          {/* görsel ŞEFFAF zeminli — zemine kaynaşır, kutu/kenar YOK */}
          <Image
            src="/gen/sec-brain.png"
            alt=""
            width={1000}
            height={750}
            quality={100}
            className="mx-auto w-full max-w-xl"
          />
        </div>
      </div>
    </section>
  );
}
