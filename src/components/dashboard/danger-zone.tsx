"use client";

/**
 * Tehlikeli bölge — paper-trading hesabını başlangıç durumuna sıfırlar
 * (nakit + pozisyonlar + emirler seed değerine döner). Test sırasında nakit
 * tükenince "Insufficient cash" alan kullanıcı buradan temiz başlangıç yapar.
 * Tasarım dili: Didit açık tema (kutusuz, border-t ayraçlı bölüm, token renk).
 */

import { useState, useEffect } from "react";
import { paperStore } from "@/lib/dashboard/paper-store";
import { cashStore } from "@/lib/dashboard/cash-store";
import { fmtUsd } from "@/lib/dashboard/data";
import { toast } from "@/components/dashboard/toast";
import { useConfirm } from "@/components/dashboard/confirm";
import { RotateCcw } from "lucide-react";

export function DangerZone() {
  const confirm = useConfirm();
  const [cash, setCash] = useState<number | null>(null);

  // Nakdi SADECE mount sonrası oku → server "—" render eder, client gerçek değeri
  // sonra basar. Render sırasında setState yapmak hydration mismatch veriyordu.
  useEffect(() => {
    try {
      setCash(paperStore.get().cash); // eslint-disable-line react-hooks/set-state-in-effect
    } catch {
      /* yoksay */
    }
  }, []);

  async function resetPaper() {
    const ok = await confirm({
      title: "Paper hesabını sıfırla",
      message:
        "Tüm sanal pozisyonların, emirlerin ve nakit bakiyen başlangıç durumuna döner. Bu işlem geri alınamaz.",
      confirmLabel: "Sıfırla",
      cancelLabel: "Vazgeç",
      tone: "danger",
    });
    if (!ok) return;
    paperStore.reset();
    try {
      cashStore.reset?.();
    } catch {
      /* cash-store reset opsiyonel */
    }
    setCash(paperStore.get().cash);
    toast.success("Paper hesabı sıfırlandı", "Nakit ve pozisyonlar başlangıç durumuna döndü.");
  }

  return (
    <section className="mt-10 border-t pt-8" style={{ borderColor: "var(--ais-line)" }}>
      <div className="mb-5">
        <h2 className="d-section">Paper hesabı</h2>
        <p className="mt-1 text-[12.5px] text-[var(--ais-fg-muted)]">
          Sanal işlem bakiyeni ve pozisyonlarını yönet.
        </p>
      </div>
      <div
        className="flex flex-wrap items-center justify-between gap-4 rounded-xl border p-5"
        style={{ borderColor: "var(--ais-line)", background: "var(--ais-surface)" }}
      >
        <div>
          <p className="text-[12px] text-[var(--ais-fg-faint)]">Kullanılabilir nakit</p>
          <p className="num mt-1 text-[18px] font-medium text-[var(--ais-fg)]">
            {cash !== null ? fmtUsd(cash) : "—"}
          </p>
        </div>
        <button
          onClick={resetPaper}
          className="flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-[12.5px] font-medium transition"
          style={{ borderColor: "rgba(217,48,37,0.30)", color: "#d93025" }}
        >
          <RotateCcw size={15} />
          Hesabı sıfırla
        </button>
      </div>
    </section>
  );
}
