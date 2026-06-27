"use client";

// Dürüst uyarı — sosyal/kopya özellikleri henüz gerçek kullanıcı topluluğuna
// bağlı değil. Profiller/gönderiler örnek niteliğinde. Kullanıcı yanılmasın diye
// sayfanın üstünde GÖRÜNÜR şekilde gösterilir (sadece açıklamada gizli kalmasın).

import { Info } from "@phosphor-icons/react";
import { AIS_WARN } from "@/components/dashboard/ais-kit";

export function DemoCommunityNotice({ kind }: { kind: "feed" | "copy" }) {
  const text =
    kind === "copy"
      ? "Aşağıdaki yatırımcı profilleri ve getiriler örnek/tanıtım amaçlıdır. Gerçek kopya-işlem topluluğu yakında açılacak — o zamana kadar gerçek kişileri kopyalayamazsın."
      : "Bu akıştaki kullanıcılar ve gönderiler örnek niteliğindedir. Gerçek yatırımcı topluluğu yakında açılacak; etkileşimlerin şimdilik yalnızca bu cihazda saklanır.";
  return (
    <div
      className="mb-4 flex items-start gap-2.5 rounded-xl border p-3.5"
      style={{ borderColor: `${AIS_WARN}40`, background: `${AIS_WARN}0f` }}
    >
      <Info size={17} weight="fill" className="mt-px shrink-0" style={{ color: AIS_WARN }} />
      <p className="text-[12.5px] leading-relaxed text-[var(--ais-fg-muted)]">{text}</p>
    </div>
  );
}
