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
import Link from "next/link";
import { PLANS, type PlanId } from "@/lib/plans";
import { useUsage } from "@/lib/dashboard/use-usage";
import { openPlanPicker } from "@/components/dashboard/plan-picker";
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

/** Bu özelliği açan en düşük planın ID'sini bul. */
function requiredPlanId(feature: Feature): PlanId {
  const order: PlanId[] = ["pro", "unlimited"];
  for (const id of order) {
    if (PLANS[id].limits[feature]) return id;
  }
  return "unlimited";
}

/** Bu özelliği açan en düşük planın adını bul (UI metni için). */
function requiredPlanLabel(feature: Feature): string {
  return PLANS[requiredPlanId(feature)].name;
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

      {/* Kilit overlay — FIXED, içerik alanının ortasında (SIDEBAR HARİÇ — kullanıcı
          geri gidebilsin). Kapatılamaz, scroll kilitli (madde 12). Sidebar serbest:
          overlay sol kenarı sidebar genişliği kadar içeride başlar (lg). */}
      {!resolving && (
        <div
          className="ais ais-light fixed inset-x-0 bottom-0 top-16 z-[55] grid place-items-center px-6 lg:left-[var(--vela-sidebar-w,248px)]"
          style={{
            background: "rgba(17,17,20,0.20)",
            backdropFilter: "blur(3px)",
            WebkitBackdropFilter: "blur(3px)",
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl border bg-[var(--ais-surface)] p-9 text-center shadow-[0_32px_80px_-24px_rgba(0,0,0,0.45)]"
            style={{ borderColor: "var(--ais-line)", animation: "support-pop 0.2s ease-out" }}
          >
            <span
              className="mx-auto grid h-12 w-12 place-items-center rounded-xl"
              style={{ background: "var(--ais-accent-bg)", color: "var(--ais-accent)" }}
            >
              <Lock size={22} />
            </span>
            <h3 className="mt-4 text-[17px] font-semibold text-[var(--ais-fg)]">
              {label} {reqPlan}&apos;a özel
            </h3>
            <p className="mx-auto mt-2 max-w-xs text-[13.5px] leading-relaxed text-[var(--ais-fg-muted)]">
              Bu özelliği kullanmak için Finovela {reqPlan} planına yükselt. İçerik önizleme amaçlı bulanıklaştırıldı.
            </p>
            {/* Didit accent buton → genel Plan Seç modalı (açık-kartta okunur). */}
            <div className="mt-6">
              <button
                onClick={() => openPlanPicker({ reason: "feature", feature })}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg px-5 py-2.5 text-[13px] font-semibold text-white transition hover:opacity-90"
                style={{ background: "var(--ais-accent)" }}
              >
                <Sparkles size={15} />
                {reqPlan}&apos;a yükselt
              </button>
            </div>
            {/* Geri dön — kullanıcı kilitli sayfada kapana kısılmasın. */}
            <Link
              href="/dashboard"
              className="mt-4 inline-block text-[12.5px] font-medium text-[var(--ais-fg-muted)] transition hover:text-[var(--ais-fg)]"
            >
              ← Panele dön
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
