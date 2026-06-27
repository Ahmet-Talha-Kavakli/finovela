// Finovela Brain — güven bütçesi kuralları (SAF mantık, client+server ortak).
// Otonom işlem yürütülmeden ÖNCE her işlem buradan geçer. Sunucu tarafı
// otonom motor da, client önizlemesi de aynı kuralı kullanır → tek doğru kaynak.

export type Authority = "full" | "semi" | "advisory";

export type BrainLimits = {
  authority: Authority;
  killSwitch: boolean; // true = tüm otonom durur (her şeyden üstün)
  maxTradePct: number; // tek işlemde portföyün max %'si
  maxDailyTrades: number;
  maxPositionPct: number; // tek varlık max ağırlık
  requirePinOver: number; // bu tutar üstü işlemde PIN
};

export const DEFAULT_BRAIN: BrainLimits = {
  authority: "advisory",
  killSwitch: false,
  maxTradePct: 5,
  maxDailyTrades: 5,
  maxPositionPct: 25,
  requirePinOver: 1000,
};

export type BudgetInput = {
  tradeValue: number;
  portfolioValue: number;
  todaysTrades: number;
  resultingPositionPct?: number;
};

export type BudgetCheck = { allowed: boolean; reason?: string; needsPin: boolean };

/** Bir işlem güven bütçesine uyuyor mu? (otonom yürütme öncesi kontrol). */
export function checkBudget(s: BrainLimits, input: BudgetInput): BudgetCheck {
  if (s.killSwitch) return { allowed: false, reason: "Acil durdurma aktif", needsPin: false };
  if (s.authority === "advisory")
    return { allowed: false, reason: "Yetki yok (sadece öneri modu)", needsPin: false };
  const tradePct = input.portfolioValue > 0 ? (input.tradeValue / input.portfolioValue) * 100 : 0;
  if (tradePct > s.maxTradePct)
    return {
      allowed: false,
      reason: `İşlem portföyün %${tradePct.toFixed(1)}'i — limit %${s.maxTradePct}`,
      needsPin: false,
    };
  if (input.todaysTrades >= s.maxDailyTrades)
    return { allowed: false, reason: `Günlük işlem limiti (${s.maxDailyTrades}) doldu`, needsPin: false };
  if (input.resultingPositionPct != null && input.resultingPositionPct > s.maxPositionPct)
    return {
      allowed: false,
      reason: `Pozisyon ağırlığı %${input.resultingPositionPct.toFixed(0)} — limit %${s.maxPositionPct}`,
      needsPin: false,
    };
  const needsPin = s.requirePinOver != null && input.tradeValue >= s.requirePinOver;
  return { allowed: true, needsPin };
}

/** Risk profiline göre güven bütçesi varsayılanları. */
export const RISK_BUDGET: Record<
  "conservative" | "balanced" | "aggressive",
  Pick<BrainLimits, "maxTradePct" | "maxPositionPct" | "maxDailyTrades" | "requirePinOver">
> = {
  conservative: { maxTradePct: 3, maxPositionPct: 15, maxDailyTrades: 3, requirePinOver: 500 },
  balanced: { maxTradePct: 5, maxPositionPct: 25, maxDailyTrades: 5, requirePinOver: 1000 },
  aggressive: { maxTradePct: 10, maxPositionPct: 40, maxDailyTrades: 10, requirePinOver: 2500 },
};
