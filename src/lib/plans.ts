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
    // Yeni kademeli kilitler — "her şey herkese ücretsiz olmamalı" (kullanıcı).
    advancedAnalytics: boolean; // derin analiz sayfası (risk/atıf/ısı haritası)
    aiPortfolios: boolean; // yapay zeka üretimi portföyler
    strategyBuilder: boolean; // strateji kurucu + backtest
    optionsAndBonds: boolean; // opsiyon zinciri + tahviller
    pulse: boolean; // Finovela Pulse (canlı sinyal akışı)
  };
};

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Free",
    priceMonthly: 0,
    blurb: "Başlamak için — günlük yapay zeka ve temel araçlar",
    limits: {
      aiChatsPerDay: 15,
      priceAlerts: 3,
      goals: 1,
      automations: 1,
      connectedAccounts: 1,
      webResearch: false,
      fileUpload: false,
      bestModel: false,
      copyTrading: false,
      taxCenter: false,
      advancedAnalytics: false,
      aiPortfolios: false,
      strategyBuilder: false,
      optionsAndBonds: false,
      pulse: false,
    },
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceMonthly: 12,
    blurb: "Günde 200 yapay zeka mesajı, otomasyon ve gelişmiş analiz",
    limits: {
      // "Unlimited değil" — gerçekçi yüksek limit (maliyet kontrolü, kullanıcı isteği).
      aiChatsPerDay: 200,
      priceAlerts: "unlimited",
      goals: "unlimited",
      automations: 20,
      connectedAccounts: 5,
      webResearch: true,
      fileUpload: true,
      bestModel: false,
      copyTrading: true,
      taxCenter: false,
      advancedAnalytics: true,
      aiPortfolios: true,
      strategyBuilder: true,
      optionsAndBonds: true,
      pulse: true,
    },
  },
  unlimited: {
    id: "unlimited",
    name: "Ultra",
    priceMonthly: 39,
    blurb: "Günde 1000 mesaj, en güçlü model, derin araştırma ve vergi merkezi",
    limits: {
      // Ultra da sınırsız DEĞİL — çok yüksek günlük tavan (Opus maliyeti korunur).
      aiChatsPerDay: 1000,
      priceAlerts: "unlimited",
      goals: "unlimited",
      automations: "unlimited",
      connectedAccounts: "unlimited",
      webResearch: true,
      fileUpload: true,
      bestModel: true,
      copyTrading: true,
      taxCenter: true,
      advancedAnalytics: true,
      aiPortfolios: true,
      strategyBuilder: true,
      optionsAndBonds: true,
      pulse: true,
    },
  },
};

export const DEFAULT_PLAN: PlanId = "free";

/**
 * Kredi paketleri — abonelik İSTEMEYEN kullanıcılar için tek-seferlik kredi alımı
 * (kullanıcı isteği: "sadece abonelik değil, kredi de alabilsin"). Krediler AI
 * sohbet/araç kullanımında harcanır; aboneliğin günlük limitine EK havuzdur.
 * Paddle price ID'leri env'den okunur (PADDLE_PRICE_CREDITS_*).
 */
export type CreditPack = {
  id: "small" | "medium" | "large";
  name: string;
  credits: number;
  price: number; // USD
  priceEnvKey: string; // checkout route bu env'den price id çeker
  popular?: boolean;
};

export const CREDIT_PACKS: CreditPack[] = [
  { id: "small", name: "Başlangıç", credits: 500, price: 5, priceEnvKey: "PADDLE_PRICE_CREDITS_SMALL" },
  { id: "medium", name: "Standart", credits: 1500, price: 12, priceEnvKey: "PADDLE_PRICE_CREDITS_MEDIUM", popular: true },
  { id: "large", name: "Büyük", credits: 5000, price: 35, priceEnvKey: "PADDLE_PRICE_CREDITS_LARGE" },
];

/** "free"/"Pro"/"UNLIMITED" gibi serbest girdiyi güvenli PlanId'ye çevir. */
export function normalizePlan(raw: string | null | undefined): PlanId {
  const k = (raw ?? "").toLowerCase();
  return k === "pro" || k === "unlimited" ? k : "free";
}
