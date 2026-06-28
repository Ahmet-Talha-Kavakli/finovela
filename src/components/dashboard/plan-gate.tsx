"use client";

/**
 * PlanGate — bir özelliği/sayfayı plan-bazlı kilitler. Büyük SaaS deseni:
 * içerik GÖRÜNÜR ama blur'lanır, üstüne kilit + "Yükselt" overlay'i biner.
 *
 * Plan açıksa children olduğu gibi render edilir (blur yok).
 *
 * Kullanım (client):
 *   <PlanGate feature="copyTrading"><CopyContent /></PlanGate>
 * Plan parametresi verilmezse useUsage ile istemcide çekilir.
 */

import { useEffect } from "react";
import { PLANS, type PlanId } from "@/lib/plans";
import { useUsage } from "@/lib/dashboard/use-usage";
import { openUpgrade } from "@/components/dashboard/upgrade-modal";
import { Lock, Sparkles } from "lucide-react";

type Feature =
  | "webResearch"
  | "copyTrading"
  | "taxCenter"
  | "bestModel"
  | "fileUpload"
  | "advancedAnalytics"
  | "aiPortfolios"
  | "strategyBuilder"
  | "optionsAndBonds"
  | "pulse";

const FEATURE_LABEL: Record<Feature, string> = {
  webResearch: "Web araştırması",
  copyTrading: "Kopya İşlem",
  taxCenter: "Vergi Merkezi",
  bestModel: "En güçlü model",
  fileUpload: "Dosya yükleme",
  advancedAnalytics: "Gelişmiş Analizler",
  aiPortfolios: "Yapay Zeka Portföyleri",
  strategyBuilder: "Strateji Kurucu",
  optionsAndBonds: "Opsiyon & Tahvil",
  pulse: "Finovela Pulse",
};

/** Bu özelliği açan en düşük planın adını bul (UI metni için). */
function requiredPlanLabel(feature: Feature): string {
  const order: PlanId[] = ["pro", "unlimited"];
  for (const id of order) {
    if (PLANS[id].limits[feature]) return PLANS[id].name;
  }
  return "Unlimited";
}

export function PlanGate({
  feature,
  plan,
  children,
}: {
  feature: Feature;
  plan?: PlanId; // verilmezse istemcide çekilir
  children: React.ReactNode;
}) {
  const usage = useUsage();
  const effectivePlan: PlanId = plan ?? usage.plan;
  const unlocked = !!PLANS[effectivePlan].limits[feature];

  // Plan henüz yükleniyorsa (plan prop yok + fetch sürüyor) içeriği blur'la ki
  // kısa süreliğine kilitli içerik açıkta görünmesin; ama overlay'i gizle.
  const resolving = !plan && usage.loading;

  // Kilitliyken sayfa scroll'unu kapat — modal sabit ortada, aşağı/yukarı kaydırılamaz
  // (kullanıcı isteği, madde 12). Açılınca/unmount'ta geri aç.
  const locked = !unlocked && !resolving;
  useEffect(() => {
    if (!locked) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [locked]);

  if (unlocked) return <>{children}</>;

  const reqPlan = requiredPlanLabel(feature);
  const label = FEATURE_LABEL[feature];

  return (
    <div className="relative">
      {/* Kilitli içerik — blur + etkileşim kapalı */}
      <div
        aria-hidden
        className="pointer-events-none select-none blur-[6px]"
        style={{ filter: "blur(6px)", opacity: 0.55 }}
      >
        {children}
      </div>

      {/* Kilit overlay — FIXED, viewport ortasında sabit, kapatılamaz (madde 12).
          Arka plan blur + hafif karartma; kart ortada asılı kalır, scroll kilitli. */}
      {!resolving && (
        <div
          className="ais ais-light fixed inset-0 z-[70] grid place-items-center px-6"
          style={{
            background: "rgba(17,17,20,0.22)",
            backdropFilter: "blur(3px)",
            WebkitBackdropFilter: "blur(3px)",
          }}
        >
          <div
            className="max-w-sm rounded-2xl border bg-[var(--ais-surface)] p-7 text-center shadow-[0_32px_80px_-24px_rgba(0,0,0,0.45)]"
            style={{ borderColor: "var(--ais-line)", animation: "support-pop 0.2s ease-out" }}
          >
            <span
              className="mx-auto grid h-12 w-12 place-items-center rounded-xl"
              style={{ background: "var(--ais-accent-bg)", color: "var(--ais-accent)" }}
            >
              <Lock size={22} />
            </span>
            <h3 className="mt-4 text-[16px] font-semibold text-[var(--ais-fg)]">
              {label} {reqPlan}&apos;a özel
            </h3>
            <p className="mx-auto mt-1.5 max-w-xs text-[13px] leading-relaxed text-[var(--ais-fg-muted)]">
              Bu özelliği kullanmak için Finovela {reqPlan} planına yükselt. İçerik önizleme amaçlı bulanıklaştırıldı.
            </p>
            <button
              onClick={() => openUpgrade({ reason: "feature", feature })}
              className="mx-auto mt-5 flex items-center justify-center gap-1.5 rounded-lg px-5 py-2.5 text-[13px] font-semibold text-white transition"
              style={{ background: "var(--ais-accent)" }}
            >
              <Sparkles size={15} />
              {reqPlan}&apos;a yükselt
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
