"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";

export interface Testimonial {
  text: string;
  name: string;
  role: string;
  color: string;
}

/**
 * Stagger testimonials — kartlar üst üste hafif kaydırılıp döndürülerek dizilir;
 * ileri/geri ile sonsuz döner (modulo). 21st.dev stagger-testimonials davranışının
 * Vela için yazılmış muadili.
 */
export function StaggerTestimonials({ items }: { items: Testimonial[] }) {
  const [index, setIndex] = useState(0);
  const n = items.length;

  const go = (dir: number) => setIndex((i) => (i + dir + n) % n);

  // gösterilecek 3 kart: merkez + 2 yanı
  const positions = [-1, 0, 1];

  return (
    <div className="relative">
      <div className="relative mx-auto flex h-[360px] max-w-3xl items-center justify-center">
        <AnimatePresence initial={false}>
          {positions.map((pos) => {
            const i = (index + pos + n) % n;
            const t = items[i];
            const isCenter = pos === 0;
            return (
              <motion.article
                key={`${i}-${pos}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{
                  opacity: isCenter ? 1 : 0.35,
                  scale: isCenter ? 1 : 0.86,
                  x: `${pos * 58}%`,
                  rotate: pos * 4,
                  zIndex: isCenter ? 10 : 5,
                }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 260, damping: 30 }}
                className="absolute w-[420px] rounded-3xl border border-white/10 bg-[rgba(12,24,52,0.85)] p-8 shadow-2xl backdrop-blur-sm"
              >
                <p className="text-lg leading-relaxed text-white/85">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="mt-7 flex items-center gap-3">
                  <span
                    className="grid h-11 w-11 place-items-center rounded-full text-sm font-bold text-white"
                    style={{ background: t.color }}
                  >
                    {t.name[0]}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-white">{t.name}</span>
                    <span className="block text-xs text-white/45">{t.role}</span>
                  </span>
                </div>
              </motion.article>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="mt-8 flex justify-center gap-4">
        <button
          onClick={() => go(-1)}
          aria-label="Previous"
          className="grid h-12 w-12 place-items-center rounded-full border border-white/25 text-white transition hover:bg-white/10"
        >
          <CaretLeft size={18} weight="bold" />
        </button>
        <button
          onClick={() => go(1)}
          aria-label="Next"
          className="grid h-12 w-12 place-items-center rounded-full border border-white/25 text-white transition hover:bg-white/10"
        >
          <CaretRight size={18} weight="bold" />
        </button>
      </div>
    </div>
  );
}
