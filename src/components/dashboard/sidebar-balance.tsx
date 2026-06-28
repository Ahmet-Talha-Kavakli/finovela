"use client";

/**
 * SidebarBalance — sidebar'da canlı paper bakiye. Tıklayınca toplam ↔ nakit
 * arasında geçer. Koyu sidebar temasına uygun (beyaz metin, ince kart).
 * Daraltılmış modda yalnız küçük bir nokta + değer gizli (yer yok).
 */

import { useState } from "react";
import { useLivePortfolio } from "@/lib/dashboard/use-portfolio";
import { fmtUsd } from "@/lib/dashboard/data";
import { Wallet, Eye } from "lucide-react";

export function SidebarBalance({ collapsed }: { collapsed: boolean }) {
  const pf = useLivePortfolio();
  const [mode, setMode] = useState<"total" | "cash">("total");

  const value = mode === "total" ? pf.summary.total : pf.summary.cash;
  const label = mode === "total" ? "Toplam bakiye" : "Nakit";

  if (collapsed) {
    return (
      <button
        onClick={() => setMode((m) => (m === "total" ? "cash" : "total"))}
        title={`${label}: ${fmtUsd(value)}`}
        className="mx-auto mt-4 grid h-11 w-11 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-white/70 transition hover:bg-white/[0.06]"
      >
        <Wallet size={18} />
      </button>
    );
  }

  return (
    <button
      onClick={() => setMode((m) => (m === "total" ? "cash" : "total"))}
      title="Toplam ↔ Nakit"
      className="mt-4 flex w-full items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2.5 text-left transition hover:bg-white/[0.06]"
    >
      <span className="min-w-0">
        <span className="flex items-center gap-1.5 text-[11px] font-medium text-white/40">
          <Wallet size={12} /> {label}
        </span>
        <span className="num mt-0.5 block text-[15px] font-semibold text-white">
          {fmtUsd(value)}
        </span>
      </span>
      <Eye size={15} className="shrink-0 text-white/30" />
    </button>
  );
}
