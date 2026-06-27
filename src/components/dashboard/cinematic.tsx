"use client";

/**
 * Sinematik (Apple/Arc) tasarım primitifleri.
 * Atmosfer (aurora glow arka plan) + cam yüzey kartlar + bölüm başlığı.
 * Yeni nesil anasayfa ve ileride diğer sayfalar bunları kullanır.
 */

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

/** Sayfa arkasında yavaşça süzülen sıcak/soğuk aurora glow katmanı. */
export function Atmosphere() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="vela-aurora-a" />
      <div className="vela-aurora-b" />
      <div className="vela-aurora-c" />
      {/* üstte hafif vinyet — derinlik */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0a0a0a]" />
    </div>
  );
}

/** Sahnelenen, spring'li cam kart — scroll'da gelir, hover'da yükselir. */
export function MotionGlass({
  className,
  children,
  delay = 0,
  glow = false,
  style,
}: {
  className?: string;
  children: React.ReactNode;
  delay?: number;
  glow?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <motion.div
      style={style}
      initial={{ opacity: 0, y: 24, scale: 0.985 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -3, transition: { type: "spring", stiffness: 400, damping: 25 } }}
      className={cn(
        "vela-glass relative overflow-hidden rounded-3xl p-6",
        glow && "vela-edge-glow",
        className,
      )}
    >
      {children}
    </motion.div>
  );
}

/** Cam yüzey kart — katmanlı kenar + derinlik gölgesi. */
export function GlassCard({
  className,
  children,
  hover = false,
  glow = false,
  style,
}: {
  className?: string;
  children: React.ReactNode;
  hover?: boolean;
  glow?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={style}
      className={cn(
        "vela-glass rounded-3xl p-6",
        hover && "vela-glass-hover",
        glow && "vela-edge-glow",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** İnce, soft bölüm başlığı (uppercase, tracking). */
export function SectionLabel({
  children,
  action,
  className,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-5 flex items-center justify-between", className)}>
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">
        {children}
      </h2>
      {action}
    </div>
  );
}
