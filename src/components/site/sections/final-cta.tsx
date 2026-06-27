import Link from "next/link";
import { CurveDivider } from "@/components/ui/curve-divider";

/**
 * Son CTA — RockFlow: "Ready to Trade with a Genius in Your Pocket?" + CTA,
 * altta perspektif grid zemin (mor parlama horizon).
 */
export function FinalCta() {
  return (
    <section className="relative overflow-hidden bg-[#0a1838]">
      <CurveDivider color="#071026" />
      {/* perspektif grid horizon */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[55%]">
        <div
          className="absolute inset-0 opacity-60 [mask-image:linear-gradient(to_top,black,transparent)]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(91,140,255,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(91,140,255,0.35) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
            transform: "perspective(420px) rotateX(60deg)",
            transformOrigin: "bottom",
          }}
        />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[radial-gradient(ellipse_at_bottom,rgba(91,140,255,0.7)_0%,transparent_65%)]" />
      </div>

      <div className="relative mx-auto max-w-3xl px-6 py-40 text-center">
        <h2 className="font-display text-[42px] font-bold leading-[1.3] text-white">
          Cebinde Bir Dahiyle İşlem Yapmaya Hazır mısın?
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-white/65">
          Zor işi Finovela&apos;ya bırakan binlerce yatırımcıya katıl. Yeni
          başlayanlar için en iyi AI yatırım yardımcısıyla başla — denemesi
          ücretsiz.
        </p>
        <div className="mt-10 flex justify-center">
          <Link
            href="/app"
            className="inline-flex h-14 items-center justify-center rounded-full bg-[linear-gradient(90deg,#cfe0ff,#e6f0ff)] px-10 text-lg font-semibold text-black shadow-[0_8px_30px_rgba(91,140,255,0.4)] transition hover:brightness-105"
          >
            Finovela ile Sohbet Et
          </Link>
        </div>
      </div>
    </section>
  );
}
