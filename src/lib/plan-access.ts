// Sunucu tarafı plan erişim kontrolü — kullanıcının gerçek planını DB'den okur,
// özelliklerin plana göre açık olup olmadığını söyler. API route'larda kullanılır.
//
// Free kullanıcı en güçlü modeli/web araştırmayı/kopya işlemi kullanamaz vb.

import { getUserRow } from "@/lib/db/repo";
import { PLANS, normalizePlan, type Plan, type PlanId } from "@/lib/plans";

/** Kullanıcının gerçek planını DB'den getir (yoksa free). */
export async function getUserPlan(userId: string | null): Promise<{ id: PlanId; plan: Plan }> {
  if (!userId) return { id: "free", plan: PLANS.free };
  try {
    const row = await getUserRow(userId);
    const id = normalizePlan(row?.plan);
    return { id, plan: PLANS[id] };
  } catch {
    return { id: "free", plan: PLANS.free };
  }
}

/** Belirli bir özelliğe (boolean limit) erişim var mı? */
export async function hasFeature(
  userId: string | null,
  feature: "webResearch" | "fileUpload" | "bestModel" | "copyTrading" | "taxCenter",
): Promise<boolean> {
  const { plan } = await getUserPlan(userId);
  return !!plan.limits[feature];
}

type NumericLimitKey =
  | "aiChatsPerDay"
  | "priceAlerts"
  | "goals"
  | "automations"
  | "connectedAccounts";

/** Sayısal limit (sonsuz ise Infinity). */
export async function limitFor(userId: string | null, key: NumericLimitKey): Promise<number> {
  const { plan } = await getUserPlan(userId);
  const v = plan.limits[key];
  return v === "unlimited" ? Infinity : v;
}

/**
 * Yeni bir kaynak (otomasyon/alarm/bağlı hesap) eklenebilir mi?
 * currentCount limite ulaştıysa false döner.
 */
export async function canAddMore(
  userId: string | null,
  key: NumericLimitKey,
  currentCount: number,
): Promise<{ ok: boolean; limit: number }> {
  const limit = await limitFor(userId, key);
  return { ok: currentCount < limit, limit };
}
