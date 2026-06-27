"use client";

/**
 * Vela marka atmosferi — landing'in mor-mavi diline bağlı, yaşayan ama AĞIRBAŞLI.
 * Canvas: yumuşak sürüklenen marka ışık alanları (#ffc2fd / #9ba7ff / #cdbaf2) +
 * çok ince hareketli ızgara. Dağınık parçacık YOK — premium, sahnelenmiş his.
 * Portföy yönüne göre alt ton yeşil/kırmızıya kayar.
 */

import { useEffect, useRef } from "react";

export function LivingBackdrop({ tone = "up" }: { tone?: "up" | "down" }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const toneRef = useRef(tone);
  toneRef.current = tone;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    let w = 0;
    let h = 0;
    function resize() {
      const rect = canvas!.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = Math.floor(w * dpr);
      canvas!.height = Math.floor(h * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    let t = 0;
    function draw() {
      const up = toneRef.current === "up";
      ctx!.clearRect(0, 0, w, h);

      // İnce hareketli ızgara — derinlik perspektifi (çok soluk).
      const gridGap = 46;
      const off = (t * 0.12) % gridGap;
      ctx!.strokeStyle = "rgba(169,180,255,0.04)";
      ctx!.lineWidth = 1;
      ctx!.beginPath();
      for (let x = -gridGap + off; x < w; x += gridGap) {
        ctx!.moveTo(x, 0);
        ctx!.lineTo(x, h);
      }
      for (let y = -gridGap + off; y < h; y += gridGap) {
        ctx!.moveTo(0, y);
        ctx!.lineTo(w, y);
      }
      ctx!.stroke();

      // Marka ışık alanları — landing gradient'i (mor-pembe → periwinkle → lila).
      const blobs = [
        { x: w * (0.18 + 0.05 * Math.sin(t * 0.0004)), y: h * (0.0 + 0.04 * Math.cos(t * 0.0005)), r: Math.max(w, h) * 0.5, c: "155,167,255", o: 0.20 },
        { x: w * (0.86 + 0.04 * Math.cos(t * 0.00033)), y: h * (-0.05 + 0.05 * Math.sin(t * 0.0006)), r: Math.max(w, h) * 0.42, c: "255,194,253", o: 0.12 },
        { x: w * (0.55 + 0.07 * Math.sin(t * 0.00028)), y: h * (0.5 + 0.05 * Math.cos(t * 0.0004)), r: Math.max(w, h) * 0.55, c: up ? "120,210,160" : "255,120,120", o: 0.06 },
      ];
      for (const b of blobs) {
        const g = ctx!.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
        g.addColorStop(0, `rgba(${b.c},${b.o})`);
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx!.fillStyle = g;
        ctx!.fillRect(0, 0, w, h);
      }
    }

    function frame() {
      t += 16;
      draw();
      rafRef.current = requestAnimationFrame(frame);
    }
    if (!reduce) rafRef.current = requestAnimationFrame(frame);
    else draw();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 -z-10 h-full w-full" aria-hidden />;
}
