import Link from "next/link";
import Image from "next/image";
import { CurveDivider } from "@/components/ui/curve-divider";

/**
 * Alt sayfalar için ortak yapı taşları — landing diliyle birebir.
 * PageHero (eyebrow + başlık + alt metin + CTA + ŞEFFAF görsel),
 * Section (kavisli geçişli), FeatureGrid, RichFeatureGrid (2x2 ayraçlı),
 * ImageSplit (görsel+metin), FaqList, CtaBand.
 *
 * KURAL: her sayfada/bölümde görsel var; görseller ŞEFFAF (white→keyed),
 * zemine kaynaşık, ASLA kutu/kare-foto gibi durmaz.
 */

/* ---- Sayfa hero'su — görselli (görsel sağda yüzer, zemine kaynaşık) ---- */
export function PageHero({
  eyebrow,
  title,
  subtitle,
  image,
  children,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  image?: string; // şeffaf PNG → sağda yüzer
  children?: React.ReactNode;
}) {
  // görsel yoksa eski ortalanmış düzen
  if (!image) {
    return (
      <section className="relative overflow-hidden bg-[radial-gradient(120%_120%_at_50%_-10%,#16306b_0%,#0c1d40_55%,#0a1838_100%)]">
        <div className="mx-auto max-w-[1100px] px-6 pb-28 pt-52 text-center">
          {eyebrow && (
            <span className="text-gradient text-base font-bold">{eyebrow}</span>
          )}
          <h1 className="font-display mx-auto mt-5 max-w-4xl text-[clamp(40px,6vw,68px)] font-bold leading-[1.08] text-white">
            {title}
          </h1>
          {subtitle && (
            <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-white/60">
              {subtitle}
            </p>
          )}
          {children && (
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              {children}
            </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden bg-[radial-gradient(120%_120%_at_70%_-10%,#16306b_0%,#0c1d40_55%,#0a1838_100%)]">
      <div className="mx-auto grid max-w-[1300px] items-center gap-8 px-6 pb-28 pt-48 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="text-center lg:text-left">
          {eyebrow && (
            <span className="text-gradient text-base font-bold">{eyebrow}</span>
          )}
          <h1 className="font-display mt-5 text-[clamp(38px,5.2vw,62px)] font-bold leading-[1.08] text-white">
            {title}
          </h1>
          {subtitle && (
            <p className="mx-auto mt-7 max-w-xl text-lg leading-relaxed text-white/60 lg:mx-0">
              {subtitle}
            </p>
          )}
          {children && (
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
              {children}
            </div>
          )}
        </div>
        {/* şeffaf görsel — zemine kaynaşık, kutu YOK */}
        <div className="relative mx-auto aspect-square w-full max-w-[460px]">
          <div className="absolute inset-[12%] -z-10 rounded-full bg-[radial-gradient(circle,rgba(59,109,255,0.5),transparent_65%)] blur-3xl" />
          <Image
            src={image}
            alt=""
            fill
            priority
            quality={100}
            className="object-contain drop-shadow-[0_20px_50px_rgba(43,92,240,0.4)]"
          />
        </div>
      </div>
    </section>
  );
}

/* ---- Kavisli geçişli bölüm ---- */
export function Section({
  bg = "#0a1838",
  prev,
  className = "",
  children,
}: {
  bg?: string;
  prev?: string; // bir önceki bölümün rengi → yarım daire geçiş
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`relative overflow-hidden ${className}`}
      style={{ background: bg }}
    >
      {prev && <CurveDivider color={prev} />}
      <div className="mx-auto max-w-[1400px] px-6 py-32">{children}</div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  center = true,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  center?: boolean;
}) {
  return (
    <div className={center ? "mx-auto max-w-3xl text-center" : "max-w-2xl"}>
      {eyebrow && (
        <span className="text-gradient text-base font-bold">{eyebrow}</span>
      )}
      <h2 className="font-display mt-4 text-[clamp(30px,4vw,44px)] font-bold leading-[1.18] text-white">
        {title}
      </h2>
      {subtitle && (
        <p
          className={`mt-5 text-lg leading-relaxed text-white/60 ${center ? "mx-auto max-w-2xl" : ""}`}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

/* ---- Özellik kartı grid'i ---- */
export type Feature = {
  icon: React.ComponentType<{ size?: number; weight?: "duotone" | "fill" | "bold" | "regular"; className?: string }>;
  title: string;
  desc: string;
  /** Görsel: A=köşe cam ikon-objesi, B=üst banner UI mockup. Yoksa Phosphor ikon. */
  image?: string;
};

export function FeatureGrid({
  items,
  cols = 3,
  cardStyle = "A",
}: {
  items: Feature[];
  cols?: 2 | 3 | 4;
  /** A = köşe cam ikon görseli; B = üstte tam genişlik UI mockup banner. */
  cardStyle?: "A" | "B";
}) {
  const colClass =
    cols === 4
      ? "md:grid-cols-2 lg:grid-cols-4"
      : cols === 2
        ? "md:grid-cols-2"
        : "md:grid-cols-2 lg:grid-cols-3";
  return (
    <div className={`mt-16 grid gap-5 ${colClass}`}>
      {items.map((f) => (
        <div
          key={f.title}
          className="group overflow-hidden rounded-3xl border border-white/8 bg-white/[0.03] transition hover:border-white/15 hover:bg-white/[0.05]"
        >
          {/* B: üstte tam genişlik UI mockup banner */}
          {cardStyle === "B" && f.image && (
            <div className="relative aspect-[16/9] w-full border-b border-white/8 bg-[#0a1838]">
              <Image src={f.image} alt="" fill className="object-cover" />
            </div>
          )}
          <div className="p-7">
            {/* A: köşe cam ikon görseli; görsel yoksa Phosphor ikon (her iki stilde fallback) */}
            {cardStyle === "A" && f.image ? (
              <Image src={f.image} alt="" width={144} height={144} className="-ml-1 h-32 w-32 object-contain" />
            ) : cardStyle === "A" || !f.image ? (
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand/15 text-brand">
                <f.icon size={24} weight="duotone" />
              </span>
            ) : null}
            <h3 className="font-display mt-5 text-xl font-bold text-white">{f.title}</h3>
            <p className="mt-2.5 text-[15px] leading-relaxed text-white/55">{f.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---- 2x2 ayraçlı zengin grid (RockFlow "No Expertise Required" stili) ---- */
export type RichItem = {
  icon: React.ComponentType<{ size?: number; weight?: "thin" | "duotone" | "fill" | "bold"; className?: string }>;
  title: string;
  accent: string;
  text: string;
};

export function RichFeatureGrid({ items }: { items: RichItem[] }) {
  return (
    <div className="mt-16 grid grid-cols-1 text-left sm:grid-cols-2">
      {items.map((it, i) => (
        <div
          key={it.title}
          className={[
            "px-0 py-12 sm:px-12",
            i % 2 === 1 && "sm:border-l sm:border-white/10",
            i >= 2 && "sm:border-t sm:border-white/10",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <it.icon size={56} weight="thin" className="text-white/85" />
          <h3 className="font-display mt-7 text-[26px] font-bold leading-[1.25] text-white">
            {it.title}
          </h3>
          <p className="text-gradient mt-4 text-base font-semibold">
            {it.accent}
          </p>
          <p className="mt-4 max-w-md text-base leading-relaxed text-white/55">
            {it.text}
          </p>
        </div>
      ))}
    </div>
  );
}

/* ---- Görsel + metin yan yana (görsel ŞEFFAF, zemine kaynaşık) ---- */
export function ImageSplit({
  image,
  reverse = false,
  eyebrow,
  title,
  subtitle,
  bullets,
  children,
}: {
  image: string;
  reverse?: boolean;
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  bullets?: string[];
  children?: React.ReactNode;
}) {
  return (
    <div className="grid items-center gap-12 lg:grid-cols-2">
      <div className={reverse ? "lg:order-2" : ""}>
        <SectionHeading
          center={false}
          eyebrow={eyebrow}
          title={title}
          subtitle={subtitle}
        />
        {bullets && (
          <ul className="mt-8 space-y-3">
            {bullets.map((b) => (
              <li key={b} className="flex items-start gap-3 text-[15px] text-white/75">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                {b}
              </li>
            ))}
          </ul>
        )}
        {children}
      </div>
      <div className={`relative mx-auto aspect-square w-full max-w-[440px] ${reverse ? "lg:order-1" : ""}`}>
        <div className="absolute inset-[14%] -z-10 rounded-full bg-[radial-gradient(circle,rgba(59,109,255,0.45),transparent_65%)] blur-3xl" />
        <Image
          src={image}
          alt=""
          fill
          quality={100}
          className="object-contain drop-shadow-[0_20px_50px_rgba(43,92,240,0.35)]"
        />
      </div>
    </div>
  );
}

/* ---- SSS ---- */
export function FaqList({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="mx-auto mt-14 max-w-3xl divide-y divide-white/8">
      {items.map((it) => (
        <details key={it.q} className="group py-5">
          <summary className="flex w-full cursor-pointer list-none items-center justify-between gap-4 text-left text-lg font-semibold text-white [&::-webkit-details-marker]:hidden">
            <span className="min-w-0 flex-1">{it.q}</span>
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-white/15 text-xl leading-none text-white/60 transition-transform duration-200 group-open:rotate-45">
              +
            </span>
          </summary>
          <p className="mt-3 max-w-2xl pr-11 text-[15px] leading-relaxed text-white/55">
            {it.a}
          </p>
        </details>
      ))}
    </div>
  );
}

/* ---- Alt CTA bandı ---- */
export function CtaBand({
  title,
  subtitle,
  prev = "#0a1838",
}: {
  title: React.ReactNode;
  subtitle?: string;
  prev?: string;
}) {
  return (
    <section className="relative overflow-hidden bg-[radial-gradient(120%_120%_at_50%_120%,#2b5cf0_0%,#16306b_45%,#0a1838_100%)]">
      <CurveDivider color={prev} />
      <div className="mx-auto max-w-[900px] px-6 py-36 text-center">
        <h2 className="font-display text-[clamp(32px,5vw,52px)] font-bold leading-[1.1] text-white">
          {title}
        </h2>
        {subtitle && (
          <p className="mx-auto mt-6 max-w-xl text-lg text-white/65">
            {subtitle}
          </p>
        )}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/app"
            className="inline-flex h-14 items-center justify-center rounded-full bg-[linear-gradient(90deg,#cfe0ff,#e6f0ff)] px-9 text-lg font-semibold text-black transition hover:brightness-105"
          >
            Finovela ile sohbet et
          </Link>
          <Link
            href="/pricing"
            className="inline-flex h-14 items-center justify-center rounded-full border border-white/30 px-9 text-lg font-semibold text-white transition hover:bg-white/10"
          >
            Fiyatlandırmayı gör
          </Link>
        </div>
      </div>
    </section>
  );
}
