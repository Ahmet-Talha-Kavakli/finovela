"use client";

/**
 * Yaşayan veri primitifleri — ekran asla statik durmasın.
 * LiveValue: gerçek değerin etrafında sürekli mikro-dalgalanan sayı (canlı tik hissi).
 * VelaThought: Vela'nın "o anki düşüncesi" — sürekli yazılıp silinen, dönen satır.
 * Breathe: çocuk öğeyi çok hafif nefes aldıran sarmalayıcı (motion).
 */

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

/** Gerçek değer etrafında sürekli mikro-tik atan sayı. */
export function LiveValue({
  value,
  format,
  jitter = 0.00018,
  className,
}: {
  value: number;
  format: (n: number) => string;
  jitter?: number; // değerin ±oranı kadar dalgalanır
  className?: string;
}) {
  const [display, setDisplay] = useState(value);
  const targetRef = useRef(value);
  targetRef.current = value;

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(value);
      return;
    }
    let raf = 0;
    let phase = 0;
    const tick = () => {
      phase += 0.05;
      const base = targetRef.current;
      // birden çok sinüs → organik, tekrar etmeyen mikro dalgalanma
      const wobble =
        (Math.sin(phase) * 0.6 + Math.sin(phase * 1.7 + 1) * 0.4) * base * jitter;
      setDisplay(base + wobble);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [jitter, value]);

  return <span className={className}>{format(display)}</span>;
}

/** Vela'nın canlı "düşünce" satırı — yazılır, bekler, silinir, sıradakine geçer. */
export function VelaThought({
  thoughts,
  className,
}: {
  thoughts: string[];
  className?: string;
}) {
  const [text, setText] = useState("");
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (thoughts.length === 0) return;
    let mounted = true;
    let timer: ReturnType<typeof setTimeout>;
    const full = thoughts[idx % thoughts.length];

    let i = 0;
    const type = () => {
      if (!mounted) return;
      if (i <= full.length) {
        setText(full.slice(0, i));
        i++;
        timer = setTimeout(type, 22 + Math.random() * 30);
      } else {
        timer = setTimeout(erase, 2600);
      }
    };
    let j = full.length;
    const erase = () => {
      if (!mounted) return;
      if (j >= 0) {
        setText(full.slice(0, j));
        j--;
        timer = setTimeout(erase, 12);
      } else {
        setIdx((v) => v + 1);
      }
    };
    type();
    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [idx, thoughts]);

  return (
    <span className={className}>
      {text}
      <motion.span
        animate={{ opacity: [1, 0.15, 1] }}
        transition={{ duration: 1, repeat: Infinity }}
        className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] bg-current align-middle"
      />
    </span>
  );
}

/** Çok hafif nefes alma — kartlara hayat verir (boşta bile kıpırdar). */
export function Breathe({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      animate={{ scale: [1, 1.006, 1], opacity: [1, 0.985, 1] }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay }}
    >
      {children}
    </motion.div>
  );
}
