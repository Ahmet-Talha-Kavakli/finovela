"use client";

/**
 * Tehlikeli bölge — paper-trading hesabını başlangıç durumuna sıfırlar
 * (nakit + pozisyonlar + emirler seed değerine döner). Test sırasında nakit
 * tükenince "Insufficient cash" alan kullanıcı buradan temiz başlangıç yapar.
 */

import { useState, useEffect } from "react";
import { paperStore } from "@/lib/dashboard/paper-store";
import { cashStore } from "@/lib/dashboard/cash-store";
import { fmtUsd } from "@/lib/dashboard/data";
import { toast } from "@/components/dashboard/toast";
import { useConfirm } from "@/components/dashboard/confirm";
import { SectionCard, Btn } from "@/components/dashboard/ais-kit";
import { ArrowCounterClockwise } from "@phosphor-icons/react";

export function DangerZone() {
  const confirm = useConfirm();
  const [cash, setCash] = useState<number | null>(null);

  // Nakdi SADECE mount sonrası oku → server "—" render eder, client gerçek değeri
  // sonra basar. Render sırasında setState yapmak hydration mismatch veriyordu.
  useEffect(() => {
    try {
      setCash(paperStore.get().cash);
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
    <SectionCard label="Paper hesabı" desc="Sanal işlem bakiyeni ve pozisyonlarını yönet." className="mt-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[12px] text-[var(--ais-fg-faint)]">Kullanılabilir nakit</p>
          <p className="num mt-1 text-[18px] font-medium text-[var(--ais-fg)]">
            {cash !== null ? fmtUsd(cash) : "—"}
          </p>
        </div>
        <Btn variant="ghost" onClick={resetPaper} className="shrink-0">
          <ArrowCounterClockwise size={15} weight="regular" />
          Hesabı sıfırla
        </Btn>
      </div>
    </SectionCard>
  );
}
