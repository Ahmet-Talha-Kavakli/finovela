"use client";

/**
 * Grafik çerçevesi — sağ üstte "tam ekran" butonu. Tıklayınca grafik
 * blur'lu bir modal'da büyük gösterilir, kapatılabilir (Esc / dış tık / X).
 * Kullanım:
 *   <ChartFrame title="Performans" render={(big) => <AreaChart data={d} height={big ? 480 : 240} />} />
 * `render(big)` — big=true tam ekranda; yükseklik vb. ayarlamak için kullan.
 */

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowsOut, X } from "@phosphor-icons/react";
import { useScrollLock } from "@/lib/dashboard/use-scroll-lock";

export function ChartFrame({
  title,
  render,
  className,
  light,
}: {
  title?: string;
  render: (fullscreen: boolean) => React.ReactNode;
  className?: string;
  /** Açık tema (Didit) — fullscreen modal beyaz zemin + açık token'larla açılır. */
  light?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useScrollLock(open);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <div className={className ? `group relative ${className}` : "group relative"}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          title="Tam ekran"
          aria-label="Grafiği tam ekran aç"
          className="absolute -top-9 right-0 z-10 inline-flex items-center gap-1.5 rounded-lg border border-[var(--ais-line)] bg-[var(--ais-surface)] px-2.5 py-1 text-[11.5px] font-medium text-[var(--ais-fg-muted)] opacity-0 transition hover:border-[var(--ais-line-strong)] hover:text-[var(--ais-fg)] group-hover:opacity-100"
        >
          <ArrowsOut size={13} weight="regular" /> Büyüt
        </button>
        {render(false)}
      </div>

      {open && mounted && createPortal(
        <div
          className={`${light ? "ais ais-light" : "ais"} fixed inset-0 z-[200] flex items-center justify-center p-6`}
          style={{
            backgroundColor: light ? "rgba(17,17,20,0.32)" : "rgba(0,0,0,0.82)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
          onClick={() => setOpen(false)}
        >
          <div
            className="relative z-10 flex max-h-[86vh] w-full max-w-5xl flex-col rounded-2xl border p-5"
            style={{
              backgroundColor: light ? "var(--ais-surface)" : "#161618",
              borderColor: light ? "var(--ais-line)" : "rgba(255,255,255,0.1)",
              boxShadow: light
                ? "0 32px 80px -20px rgba(0,0,0,0.45)"
                : "0 24px 64px -16px rgba(0,0,0,0.6)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[14px] font-medium text-[var(--ais-fg)]">{title ?? "Grafik"}</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                title="Kapat (Esc)"
                className="grid h-8 w-8 place-items-center rounded-lg text-[var(--ais-fg-muted)] transition hover:bg-[var(--ais-surface-2)] hover:text-[var(--ais-fg)]"
              >
                <X size={16} />
              </button>
            </div>
            <div className="min-h-0 flex-1">{render(true)}</div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
