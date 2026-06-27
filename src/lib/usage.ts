// Günlük kullanım sayacı — plan limitlerini (aiChatsPerDay vb.) gerçekten enforce eder.
// usage_daily tablosuna yazar; her gün (UTC) doğal sıfırlanır (yeni gün = yeni satır).
// Sunucu-tarafı: API route'larda checkAndIncrement(...) çağrılır.

import { eq } from "drizzle-orm";
import { db, schema, ready } from "./db/index";
import { limitFor } from "./plan-access";

export type UsageKind = "aiChat";

/** UTC bugünün YYYY-MM-DD anahtarı. */
function todayKey(): string {
  // ISO string'in tarih kısmı UTC'dir — sunucu saat diliminden bağımsız, tutarlı.
  return new Date().toISOString().slice(0, 10);
}

/** Bugünkü kullanım sayısını oku (yoksa 0). */
export async function getUsage(userId: string, kind: UsageKind): Promise<number> {
  if (!ready || !userId) return 0;
  const id = `${userId}:${todayKey()}:${kind}`;
  try {
    const row = await db
      .select()
      .from(schema.usageDaily)
      .where(eq(schema.usageDaily.id, id))
      .get();
    return row?.count ?? 0;
  } catch {
    return 0;
  }
}

/**
 * Limit kontrolü + artırım (atomik-ish). Limit aşılmadıysa sayacı 1 artırır ve
 * { ok:true, used, limit, remaining } döner. Aşıldıysa { ok:false } döner ve artırmaz.
 * Limit Infinity (sınırsız plan) ise her zaman ok, sayaç yine de tutulur (analitik).
 */
export async function checkAndIncrement(
  userId: string | null,
  kind: UsageKind,
  limitKey: "aiChatsPerDay",
): Promise<{ ok: boolean; used: number; limit: number; remaining: number }> {
  const limit = await limitFor(userId, limitKey);
  // userId yoksa (demo/anon) limit uygulanmaz ama makul bir tavan koyalım.
  if (!userId || !ready) {
    return { ok: true, used: 0, limit, remaining: limit === Infinity ? Infinity : limit };
  }
  const used = await getUsage(userId, kind);
  if (used >= limit) {
    return { ok: false, used, limit, remaining: 0 };
  }
  // Artır (upsert).
  const id = `${userId}:${todayKey()}:${kind}`;
  const now = Date.now();
  try {
    const existing = await db
      .select()
      .from(schema.usageDaily)
      .where(eq(schema.usageDaily.id, id))
      .get();
    if (existing) {
      await db
        .update(schema.usageDaily)
        .set({ count: existing.count + 1, updatedAt: now })
        .where(eq(schema.usageDaily.id, id))
        .run();
    } else {
      await db
        .insert(schema.usageDaily)
        .values({ id, userId, day: todayKey(), kind, count: 1, updatedAt: now })
        .run();
    }
  } catch {
    // DB yazılamazsa kullanıcıyı engelleme (graceful) — sadece sayaç kaçar.
    return { ok: true, used, limit, remaining: limit === Infinity ? Infinity : limit - used };
  }
  const newUsed = used + 1;
  return {
    ok: true,
    used: newUsed,
    limit,
    remaining: limit === Infinity ? Infinity : Math.max(0, limit - newUsed),
  };
}

/** Salt-okur özet — UI'da kredi halkası/sayaç göstermek için. */
export async function usageSummary(
  userId: string | null,
): Promise<{ aiChat: { used: number; limit: number; remaining: number } }> {
  const limit = await limitFor(userId, "aiChatsPerDay");
  const used = userId ? await getUsage(userId, "aiChat") : 0;
  return {
    aiChat: {
      used,
      limit,
      remaining: limit === Infinity ? Infinity : Math.max(0, limit - used),
    },
  };
}

// İstemci tarafında JSON serialize için Infinity → -1 dönüştürücü.
export function serializeLimit(n: number): number {
  return n === Infinity ? -1 : n;
}
