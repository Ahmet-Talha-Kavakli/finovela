"use client";

/**
 * Hafif toast sistemi — AI Studio sade, framer-motion'lı.
 * Global store deseni (provider gerekmez): toast.show(...) her yerden çağrılır,
 * <ToastHost /> layout'ta bir kez render edilir.
 */

import { useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, WarningCircle, Info, X } from "@phosphor-icons/react";

type ToastTone = "success" | "error" | "info";
type ToastItem = { id: number; tone: ToastTone; title: string; desc?: string };

let items: ToastItem[] = [];
let nextId = 1;
const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((l) => l());
}

export const toast = {
  show(tone: ToastTone, title: string, desc?: string) {
    const id = nextId++;
    items = [...items, { id, tone, title, desc }];
    emit();
    setTimeout(() => toast.dismiss(id), 3600);
    return id;
  },
  success(title: string, desc?: string) {
    return toast.show("success", title, desc);
  },
  error(title: string, desc?: string) {
    return toast.show("error", title, desc);
  },
  info(title: string, desc?: string) {
    return toast.show("info", title, desc);
  },
  dismiss(id: number) {
    items = items.filter((t) => t.id !== id);
    emit();
  },
};

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

const TONE = {
  success: { icon: CheckCircle, color: "#81c995" },
  error: { icon: WarningCircle, color: "#f28b82" },
  info: { icon: Info, color: "#8ab4f8" },
};

export function ToastHost() {
  const list = useSyncExternalStore(
    subscribe,
    () => items,
    () => items,
  );
  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[200] flex flex-col items-end gap-2">
      <AnimatePresence>
        {list.map((t) => {
          const meta = TONE[t.tone];
          const Icon = meta.icon;
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="pointer-events-auto flex min-w-[260px] max-w-sm items-start gap-3 rounded-xl border px-3.5 py-3"
              style={{ background: "#101012", borderColor: "rgba(255,255,255,0.10)" }}
            >
              <Icon size={18} weight="regular" style={{ color: meta.color, marginTop: 1 }} />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-[#e6e6e9]">{t.title}</p>
                {t.desc && <p className="mt-0.5 text-[12px] text-[#9a9aa0]">{t.desc}</p>}
              </div>
              <button
                onClick={() => toast.dismiss(t.id)}
                className="text-[#6a6a70] transition hover:text-[#e6e6e9]"
              >
                <X size={14} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
