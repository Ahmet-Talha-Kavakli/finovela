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
  hrefLabel = "Chat with Finovela",
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
        bright ? "bg-aurora" : "bg-[#0a1838]",
      )}
    >
      <div className="mx-auto grid max-w-7xl items-center gap-6 px-6 py-20 lg:grid-cols-[1.15fr_1fr] lg:gap-12 lg:py-28">
        {/* metin */}
        <div className={cn("relative z-10", reverse && "lg:order-2")}>
          <p className="text-sm font-semibold uppercase tracking-wider text-[#7fb0ff]">
            {eyebrow}
          </p>
          <h3 className="font-display mt-3 text-[2.6rem] font-bold leading-[1.04] text-white sm:text-5xl">
            {title}{" "}
            {titleAccent && <span className="text-gradient">{titleAccent}</span>}
          </h3>
          <p className="mt-5 max-w-md text-lg text-white/60">{description}</p>

          {bullets && (
            <ul className="mt-8 space-y-5">
              {bullets.map((b) => (
                <li key={b.title} className="flex gap-3.5">
                  <span className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#7fb0ff] to-[#2b5cf0] shadow-[0_0_12px_rgba(59,109,255,0.6)]">
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
              className="mt-9 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-b from-[#5b8cff] to-[#2b5cf0] px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_28px_rgba(59,109,255,0.5)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_38px_rgba(59,109,255,0.65)]"
            >
              {hrefLabel}
              <ArrowRight size={16} weight="bold" />
            </Link>
          )}
        </div>

        {/* görsel — büyük, çerçevesiz, net; glow arkada */}
        <div className={cn("relative", reverse && "lg:order-1")}>
          <div className="absolute left-1/2 top-1/2 -z-10 h-full w-full -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(59,109,255,0.6)_0%,transparent_58%)] blur-2xl" />
          <Image
            src={image}
            alt={title}
            width={900}
            height={900}
            quality={100}
            className="mx-auto w-full max-w-xl [mask-image:radial-gradient(circle,black_64%,transparent_90%)]"
          />
        </div>
      </div>
    </section>
  );
}
