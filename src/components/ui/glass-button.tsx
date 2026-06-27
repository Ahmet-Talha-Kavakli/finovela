"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Apple "Liquid Glass" butonu — kullanıcının referansı (~/Desktop/glass-button-ui).
 * Arkayı backdrop-blur ile bulanıklaştırır, ince ışık-halkası kenar + iç gölge.
 * Koyu (görsel üstü) ve açık zeminde çalışır.
 *
 * href verilirse <Link> olarak, verilmezse <button> olarak render olur.
 */

type Size = "sm" | "md" | "lg" | "xl";
type Tone = "glass" | "solid" | "brand";

const sizes: Record<Size, string> = {
  sm: "h-9 px-5 text-sm",
  md: "h-11 px-7 text-[15px]",
  lg: "h-13 px-9 text-base",
  xl: "h-14 px-10 text-lg",
};

function Decorations({ tone }: { tone: Tone }) {
  return (
    <>
      <span
        aria-hidden
        className={cn(
          "absolute inset-0 rounded-full",
          tone === "glass" && "bg-white/8",
          tone === "solid" && "bg-white/70 dark:bg-white/10",
          tone === "brand" &&
            "bg-gradient-to-b from-[#3b6dff] to-[#1846c8]",
        )}
      />
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset",
          tone === "glass" && "ring-white/25",
          tone === "solid" && "ring-black/10 dark:ring-white/15",
          tone === "brand" && "ring-white/30",
        )}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-3 top-0 h-1/2 rounded-full bg-gradient-to-b from-white/30 to-transparent opacity-70"
      />
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 rounded-full transition-shadow duration-300",
          "shadow-[inset_0_1px_1px_rgba(255,255,255,0.35),inset_0_-1px_2px_rgba(0,0,0,0.25),0_8px_30px_rgba(0,0,0,0.25)]",
          "group-hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.45),inset_0_-1px_2px_rgba(0,0,0,0.25),0_12px_40px_rgba(0,0,0,0.3)]",
        )}
      />
    </>
  );
}

function baseClass(size: Size, tone: Tone, className?: string) {
  return cn(
    "group relative inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-tight",
    "transition-all duration-300 ease-out active:scale-[0.98]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40",
    sizes[size],
    tone === "glass" && "text-white backdrop-blur-xl backdrop-saturate-150",
    tone === "solid" && "text-fg backdrop-blur-xl",
    tone === "brand" &&
      "text-white shadow-[0_8px_30px_rgba(59,109,255,0.5)] hover:shadow-[0_12px_40px_rgba(59,109,255,0.65)]",
    className,
  );
}

type CommonProps = {
  size?: Size;
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
};

type AsButton = CommonProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof CommonProps> & {
    href?: undefined;
  };

type AsLink = CommonProps & { href: string };

export function GlassButton(props: AsButton | AsLink) {
  const { size = "lg", tone = "glass", className, children } = props;

  const inner = (
    <>
      <Decorations tone={tone} />
      <span className="relative z-10 inline-flex items-center gap-2">
        {children}
      </span>
    </>
  );

  if ("href" in props && props.href) {
    return (
      <Link href={props.href} className={baseClass(size, tone, className)}>
        {inner}
      </Link>
    );
  }

  const { href: _h, size: _s, tone: _t, className: _c, children: _ch, ...rest } =
    props as AsButton;
  return (
    <button className={baseClass(size, tone, className)} {...rest}>
      {inner}
    </button>
  );
}
