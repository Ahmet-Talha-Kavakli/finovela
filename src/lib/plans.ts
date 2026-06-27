// Finovela abonelik planları — TEK KAYNAK. Hem pazarlama (pricing), hem dashboard
// (settings/billing), hem sunucu-tarafı limit/yetki kontrolü buradan okur.
// Fiyatlandırma sayfasındaki içerikle tutarlı tutulmalı.

export type PlanId = "free" | "pro" | "unlimited";

export type Plan = {
  id: PlanId;
  name: string; // kullanıcıya görünen ad
  priceMonthly: number; // USD/ay (0 = ücretsiz)
  blurb: string; // kısa açıklama
  limits: {
    aiChatsPerDay: number | "unlimited";
    priceAlerts: number | "unlimited";
    goals: number | "unlimited";
    automations: number | "unlimited";
    connectedAccounts: number | "unlimited";
    webResearch: boolean;
    fileUpload: boolean;
    bestModel: boolean; // en güçlü AI modeline erişim (Finovela 1.2)
    copyTrading: boolean;
    taxCenter: boolean;
  };
};

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Free",
    priceMonthly: 0,
    blurb: "Başlamak için — günlük yapay zeka ve temel araçlar",
    limits: {
      aiChatsPerDay: 20,
      priceAlerts: 3,
      goals: 1,
      automations: 1,
      connectedAccounts: 1,
      webResearch: false,
      fileUpload: false,
      bestModel: false,
      copyTrading: false,
      taxCenter: false,
    },
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceMonthly: 12,
    blurb: "Sınırsız yapay zeka, otomasyon ve veri",
    limits: {
      aiChatsPerDay: "unlimited",
      priceAlerts: "unlimited",
      goals: "unlimited",
      automations: "unlimited",
      connectedAccounts: 5,
      webResearch: true,
      fileUpload: true,
      bestModel: false,
      copyTrading: true,
      taxCenter: false,
    },
  },
  unlimited: {
    id: "unlimited",
    name: "Unlimited",
    priceMonthly: 39,
    blurb: "En güçlü model, derin araştırma ve vergi merkezi",
    limits: {
      aiChatsPerDay: "unlimited",
      priceAlerts: "unlimited",
      goals: "unlimited",
      automations: "unlimited",
      connectedAccounts: "unlimited",
      webResearch: true,
      fileUpload: true,
      bestModel: true,
      copyTrading: true,
      taxCenter: true,
    },
  },
};

export const DEFAULT_PLAN: PlanId = "free";

/** "free"/"Pro"/"UNLIMITED" gibi serbest girdiyi güvenli PlanId'ye çevir. */
export function normalizePlan(raw: string | null | undefined): PlanId {
  const k = (raw ?? "").toLowerCase();
  return k === "pro" || k === "unlimited" ? k : "free";
}
