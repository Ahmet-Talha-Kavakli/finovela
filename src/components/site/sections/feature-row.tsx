import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react";

interface Bullet {
  title: string;
  text: string;
}

export function FeatureRow({
  eyebrow,
  title,
  titleAccent,
  description,
  image,
  bullets,
  href,
  hrefLabel = "Chat with Vela",
  reverse,
  bright,
  icon: IconComp,
}: {
  eyebrow: string;
  title: string;
  titleAccent?: string;
  description: string;
  image: string;
  bullets?: Bullet[];
  href?: string;
  hrefLabel?: string;
  reverse?: boolean;
  bright?: boolean; // RockFlow "parlak mor" bölüm (AI Portfolios gibi)
  icon?: Icon;
}) {
  return (
    <section
      className={cn(
        "relative overflow-hidden",
        bright ? "bg-aurora" : "bg-[#1a0a35]",
      )}
    >
      <div className="mx-auto grid max-w-7xl items-center gap-8 px-5 py-20 lg:grid-cols-2 lg:gap-16 lg:py-28">
        {/* metin */}
        <div className={cn("relative z-10", reverse && "lg:order-2")}>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-3 py-1 text-xs font-semibold text-[#d8b4fe] backdrop-blur-sm">
            {IconComp && <IconComp size={14} weight="bold" />}
            {eyebrow}
          </div>
          <h3 className="font-display mt-5 text-4xl font-bold leading-[1.06] text-white sm:text-5xl">
            {title}{" "}
            {titleAccent && <span className="text-gradient">{titleAccent}</span>}
          </h3>
          <p className="mt-5 max-w-md text-lg text-white/65">{description}</p>

          {bullets && (
            <ul className="mt-8 space-y-5">
              {bullets.map((b) => (
                <li key={b.title} className="flex gap-3.5">
                  <span className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#c084fc] to-[#7c3aed] shadow-[0_0_12px_rgba(139,92,255,0.6)]">
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  </span>
                  <span>
                    <span className="font-semibold text-white">{b.title}</span>{" "}
                    <span className="text-white/55">— {b.text}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}

          {href && (
            <Link
              href={href}
              className="mt-9 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-b from-[#a855f7] to-[#7c3aed] px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_28px_rgba(139,92,255,0.5)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_38px_rgba(139,92,255,0.65)]"
            >
              {hrefLabel}
              <ArrowRight size={16} weight="bold" />
            </Link>
          )}
        </div>

        {/* görsel — ÇERÇEVESİZ, mask ile zemine eriyor, glow */}
        <div className={cn("relative", reverse && "lg:order-1")}>
          <div className="absolute left-1/2 top-1/2 -z-10 h-[110%] w-[110%] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(circle,rgba(139,92,255,0.5)_0%,transparent_62%)] blur-3xl" />
          <Image
            src={image}
            alt={title}
            width={820}
            height={820}
            className="mx-auto w-full max-w-lg [mask-image:radial-gradient(circle,black_58%,transparent_82%)]"
          />
        </div>
      </div>
    </section>
  );
}
