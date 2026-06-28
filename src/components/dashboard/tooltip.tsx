"use client";

/**
 * Tooltip — hover/focus'ta beliren ince bilgi kutusu (madde 22).
 * Yer kaplamadan bilgilendirme: bir ikon/etikete sarılır, üstüne gelince çıkar,
 * çıkınca kaybolur. Büyük SaaS deseni — kaliteyi yükseltir.
 *
 * Kullanım:
 *   <Tooltip content="Risk skoru 1-10 arası; düşük = istikrarlı">
 *     <Info size={14} />
 *   </Tooltip>
 *
 * Salt-CSS (JS state yok) → hafif. Erişilebilir: trigger focusable, aria-label.
 */

import { type ReactNode } from "react";

export function Tooltip({
  content,
  children,
  side = "top",
  className = "",
}: {
  content: ReactNode;
  children: ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
}) {
  const pos =
    side === "top"
      ? "bottom-full left-1/2 -translate-x-1/2 mb-2"
      : side === "bottom"
        ? "top-full left-1/2 -translate-x-1/2 mt-2"
        : side === "left"
          ? "right-full top-1/2 -translate-y-1/2 mr-2"
          : "left-full top-1/2 -translate-y-1/2 ml-2";

  return (
    <span className={`vela-tt group/tt relative inline-flex ${className}`} tabIndex={0}>
      {children}
      <span
        role="tooltip"
        className={`vela-tt-bubble pointer-events-none absolute z-[80] ${pos} whitespace-normal`}
      >
        {content}
      </span>
    </span>
  );
}

/** Sadece bilgi-ikonu + tooltip — en yaygın kullanım için kısayol. */
export function InfoHint({
  content,
  side = "top",
}: {
  content: ReactNode;
  side?: "top" | "bottom" | "left" | "right";
}) {
  return (
    <Tooltip content={content} side={side}>
      <span
        className="grid h-[15px] w-[15px] cursor-help place-items-center rounded-full text-[10px] font-semibold transition"
        style={{ background: "var(--ais-surface-2)", color: "var(--ais-fg-faint)" }}
        aria-hidden
      >
        ?
      </span>
    </Tooltip>
  );
}
