"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { Warning } from "@phosphor-icons/react";
import { useScrollLock } from "@/lib/dashboard/use-scroll-lock";

/**
 * Genel onay diyaloğu — önemli/geri alınamaz eylemler için (Al/Sat, silme vb.).
 * Kullanım: const confirm = useConfirm(); if (await confirm({...})) { ... }
 */
export type ConfirmOptions = {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** "danger" → kırmızı onay butonu (silme/sat), "buy" → yeşil, varsayılan nötr */
  tone?: "danger" | "buy" | "neutral";
};

type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    // Provider yoksa güvenli varsayılan: native confirm (kırılmasın).
    return async (o) =>
      typeof window !== "undefined" ? window.confirm(o.message ?? o.title) : true;
  }
  return ctx;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{
    opts: ConfirmOptions;
    resolve: (v: boolean) => void;
  } | null>(null);

  const confirm = useCallback<ConfirmFn>((opts) => {
    return new Promise<boolean>((resolve) => setState({ opts, resolve }));
  }, []);

  const close = (v: boolean) => {
    state?.resolve(v);
    setState(null);
  };

  useScrollLock(!!state);

  const tone = state?.opts.tone ?? "neutral";
  const confirmBtn =
    tone === "danger"
      ? "bg-[#ff5c5c] text-white hover:bg-[#ff5c5c]/90"
      : tone === "buy"
        ? "bg-[#3ecf8e] text-black hover:bg-[#3ecf8e]/90"
        : "bg-white text-black hover:bg-white/90";

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && (
        <div
          className="vela-modal-backdrop fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4 backdrop-blur-md"
          onClick={() => close(false)}
        >
          <div
            className="vela-modal-card w-full max-w-sm rounded-2xl border border-white/[0.1] bg-[#161618] p-6 shadow-2xl shadow-black/60"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <span
                className={
                  "mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full " +
                  (tone === "danger"
                    ? "bg-[#ff5c5c]/15 text-[#ff5c5c]"
                    : tone === "buy"
                      ? "bg-[#3ecf8e]/15 text-[#3ecf8e]"
                      : "bg-white/10 text-white")
                }
              >
                <Warning size={18} weight="fill" />
              </span>
              <div className="min-w-0">
                <h3 className="font-display text-base font-bold text-white">{state.opts.title}</h3>
                {state.opts.message && (
                  <p className="mt-1.5 text-sm leading-relaxed text-white/60">{state.opts.message}</p>
                )}
              </div>
            </div>
            <div className="mt-6 flex gap-2.5">
              <button
                onClick={() => close(false)}
                className="h-10 flex-1 rounded-xl border border-white/12 text-sm font-semibold text-white/80 transition hover:bg-white/[0.05]"
              >
                {state.opts.cancelLabel ?? "Vazgeç"}
              </button>
              <button
                onClick={() => close(true)}
                className={"h-10 flex-1 rounded-xl text-sm font-semibold transition " + confirmBtn}
              >
                {state.opts.confirmLabel ?? "Onayla"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
