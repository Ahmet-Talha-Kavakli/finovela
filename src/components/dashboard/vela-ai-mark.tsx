"use client";

/**
 * Finovela AI işareti (marka) + düşünme/yazma animasyonu.
 * İki render modu:
 *  - video=true → gerçek 3D holografik sparkle videosu (siyah zemin, 4 köşeli).
 *    Büyük yerlerde (boş chat ekranı, "düşünüyor" göstergesi) kullanılır.
 *  - video=false (varsayılan) → statik /vela-mark.png + CSS nabız/halka.
 *    Küçük yerlerde (sidebar 36px) hafif kalsın diye.
 */

import { motion } from "framer-motion";
import Image from "next/image";

type State = "idle" | "thinking" | "writing";

// Hangi durumda hangi video. thinking/writing → halkalı "düşünüyor" videosu.
const VIDEO_SRC: Record<State, string> = {
  idle: "/gen/ai-mark-think.mp4",
  thinking: "/gen/ai-mark-think.mp4",
  writing: "/gen/ai-mark-think.mp4",
};

export function VelaAiMark({
  size = 36,
  state = "idle",
  video = false,
}: {
  size?: number;
  state?: State;
  /** true ise gerçek 3D video render edilir (büyük/öne çıkan yerlerde). */
  video?: boolean;
}) {
  const active = state === "thinking" || state === "writing";

  // ── VİDEO MODU ── gerçek 3D sparkle.
  // Video arka planı #111 (saf siyah değil) → daire kenarı belli olmasın diye
  // yuvarlak kırpma YOK; bunun yerine yumuşak radyal maske ile kenarlar eritilir
  // ve sparkle tam görünür (kesilmez). `screen` blend, koyu zemini şeffaflaştırır.
  if (video) {
    return (
      <span
        className="relative grid shrink-0 place-items-center"
        style={{ width: size, height: size }}
      >
        <video
          src={VIDEO_SRC[state]}
          autoPlay
          loop
          muted
          playsInline
          className="h-full w-full object-contain"
          style={{
            // 'screen' blend: koyu (#111) zemin arka planla kaynaşır, parlak sparkle kalır.
            // contrast ile #111 artığı tam siyaha (=> screen'de görünmez) bastırılır.
            mixBlendMode: "screen",
            filter: active
              ? "saturate(1.15) brightness(1.08) contrast(1.18)"
              : "saturate(1.04) contrast(1.15)",
            transform: "scale(1.06)",
            // köşelerde kalan minik kutu izini de yumuşakça erit (sparkle merkezde tam kalır)
            WebkitMaskImage: "radial-gradient(circle at center, #000 68%, transparent 88%)",
            maskImage: "radial-gradient(circle at center, #000 68%, transparent 88%)",
          }}
        />
      </span>
    );
  }

  // ── STATİK MOD ── PNG + CSS animasyon (küçük yerlerde hafif)
  return (
    <span className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      {state === "thinking" && (
        <motion.span
          className="absolute inset-0 rounded-full"
          style={{
            background: "conic-gradient(from 0deg, transparent 0%, #9ba7ff 30%, #ffc2fd 55%, transparent 75%)",
            WebkitMask: "radial-gradient(circle, transparent 58%, #000 60%)",
            mask: "radial-gradient(circle, transparent 58%, #000 60%)",
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
        />
      )}

      <motion.span
        className="relative grid place-items-center"
        style={{
          width: size * 1.08,
          height: size * 1.08,
          filter: active
            ? "drop-shadow(0 0 12px rgba(123,108,255,0.6))"
            : "drop-shadow(0 0 6px rgba(123,108,255,0.28))",
        }}
        animate={
          state === "writing"
            ? { scale: [1, 1.09, 1] }
            : state === "idle"
              ? { scale: [1, 1.04, 1] }
              : { scale: 1 }
        }
        transition={{ duration: state === "writing" ? 1 : 3.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <Image
          src="/vela-mark.png"
          alt="Finovela"
          width={Math.round(size * 1.08)}
          height={Math.round(size * 1.08)}
          className="h-full w-full object-contain"
          priority
        />
      </motion.span>
    </span>
  );
}

/** Claude'daki gibi "düşünüyor" shimmer metni. tone="light" → koyu metin (açık zemin). */
export function ThinkingShimmer({
  label = "Finovela düşünüyor",
  tone = "dark",
}: {
  label?: string;
  tone?: "dark" | "light";
}) {
  return (
    <span
      className="bg-clip-text text-sm font-medium text-transparent"
      style={{
        backgroundImage:
          tone === "light"
            ? "linear-gradient(90deg, rgba(26,26,26,0.35) 0%, rgba(26,26,26,0.95) 50%, rgba(26,26,26,0.35) 100%)"
            : "linear-gradient(90deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,0.35) 100%)",
        backgroundSize: "200% 100%",
        animation: "vela-shimmer 1.6s linear infinite",
      }}
    >
      {label}…
    </span>
  );
}
