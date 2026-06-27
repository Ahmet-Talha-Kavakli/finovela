"use client";

/**
 * Üst-kalite sayı animasyonları (bağımlılıksız, rAF tabanlı).
 * AnimatedNumber: değer değiştikçe yumuşak sayar (count-up/down).
 * LiveDot: canlı veri tazelenirken nabız atan nokta.
 */

import { useEffect, useRef, useState } from "react";

export function AnimatedNumber({
  value,
  format,
  duration = 600,
  className,
}: {
  value: number;
  format?: (n: number) => string;
  duration?: number;
  className?: string;
}) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef(0);

  useEffect(() => {
    const from = fromRef.current;
    const to = value;
    if (from === to) return;
    if (typeof window === "undefined") {
      setDisplay(to);
      fromRef.current = to;
      return;
    }
    startRef.current = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - startRef.current) / duration);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (to - from) * eased);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      fromRef.current = to;
    };
  }, [value, duration]);

  return <span className={className}>{format ? format(display) : Math.round(display).toLocaleString("en-US")}</span>;
}

export function LiveDot({ color = "#3ecf8e", label }: { color?: string; label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="relative inline-flex h-2 w-2">
        <span
          className="vela-tick absolute inline-flex h-full w-full rounded-full"
          style={{ background: color }}
        />
        <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: color }} />
      </span>
      {label && <span className="text-[11px] font-medium text-white/45">{label}</span>}
    </span>
  );
}
