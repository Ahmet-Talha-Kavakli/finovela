// Bağımlılıksız, bellek-içi (in-memory) rate limiter — sliding window.
//
// SINIRLAMA: Bu limiter PROCESS BAŞINA çalışır. Tek instance / tek sunucu için
// yeterlidir ("good enough now"). Çoklu instance (örn. Vercel'de çok bölge,
// yatay ölçek) durumunda her instance kendi sayacını tutacağı için global
// limit gevşer. Çoklu instance gerektiğinde Upstash (Redis) tabanlı bir
// limiter'a geçilmeli — API aynı kalacak şekilde tasarlandı.

type Hit = number[]; // istek zaman damgaları (ms)

// key -> zaman damgaları
const store = new Map<string, Hit>();

// Bellek sızıntısını önlemek için periyodik temizlik.
let lastSweep = 0;
function sweep(now: number, windowMs: number) {
  // En fazla 60 sn'de bir süpür (sıcak yolda ucuz kalsın).
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, hits] of store) {
    const fresh = hits.filter((t) => now - t < windowMs);
    if (fresh.length === 0) store.delete(key);
    else store.set(key, fresh);
  }
}

export type RateLimitConfig = {
  /** Pencere içinde izin verilen maksimum istek sayısı. */
  limit: number;
  /** Kayan pencere uzunluğu (ms). */
  windowMs: number;
};

export type RateLimitResult = {
  ok: boolean;
  /** Bir sonraki isteğin denenebileceği zamana kadar saniye (429 için Retry-After). */
  retryAfterSec: number;
  remaining: number;
};

/**
 * Verilen anahtar için kayan pencere rate limit kontrolü.
 * `ok=false` ise istek reddedilmeli (429).
 */
export function rateLimit(key: string, cfg: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  sweep(now, cfg.windowMs);

  const hits = (store.get(key) ?? []).filter((t) => now - t < cfg.windowMs);

  if (hits.length >= cfg.limit) {
    // En eski isteğin pencereden çıkacağı ana kadar bekle.
    const oldest = hits[0];
    const retryAfterMs = cfg.windowMs - (now - oldest);
    store.set(key, hits); // budanmış listeyi geri yaz
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil(retryAfterMs / 1000)),
      remaining: 0,
    };
  }

  hits.push(now);
  store.set(key, hits);
  return {
    ok: true,
    retryAfterSec: 0,
    remaining: Math.max(0, cfg.limit - hits.length),
  };
}

/**
 * Rate-limit anahtarı üretir: önce userId, yoksa IP (x-forwarded-for / x-real-ip),
 * o da yoksa sabit bir fallback. `scope` ile rotalar birbirinden ayrılır.
 */
export function rateLimitKey(
  scope: string,
  userId: string | null,
  headers: Headers,
): string {
  if (userId) return `${scope}:u:${userId}`;
  const xff = headers.get("x-forwarded-for");
  const ip =
    (xff ? xff.split(",")[0]?.trim() : "") ||
    headers.get("x-real-ip") ||
    "unknown";
  return `${scope}:ip:${ip}`;
}

// Rota başına önceden tanımlı limitler (5 dk pencere).
const FIVE_MIN = 5 * 60 * 1000;

export const RATE_LIMITS = {
  // En pahalı rota (Opus, streaming) — katı.
  chat: { limit: 20, windowMs: FIVE_MIN } satisfies RateLimitConfig,
  // Ucuz Haiku rotaları — gevşek.
  chatTitle: { limit: 60, windowMs: FIVE_MIN } satisfies RateLimitConfig,
  dailyBrief: { limit: 60, windowMs: FIVE_MIN } satisfies RateLimitConfig,
  newsSummary: { limit: 60, windowMs: FIVE_MIN } satisfies RateLimitConfig,
  // Borsa rotaları — harici API + gerçek para; orta-katı.
  exchange: { limit: 15, windowMs: FIVE_MIN } satisfies RateLimitConfig,
  // Emir verme — daha katı (spam/yanlışlık koruması).
  order: { limit: 30, windowMs: FIVE_MIN } satisfies RateLimitConfig,
  // KYC / profil — düşük frekanslı işlemler.
  profile: { limit: 10, windowMs: FIVE_MIN } satisfies RateLimitConfig,
} as const;

/**
 * Standart 429 yanıtı (Türkçe). Retry-After header'ı eklenir.
 */
export function tooManyRequests(retryAfterSec: number): Response {
  return new Response(
    JSON.stringify({ error: "Çok fazla istek. Lütfen biraz bekle." }),
    {
      status: 429,
      headers: {
        "content-type": "application/json",
        "retry-after": String(retryAfterSec),
      },
    },
  );
}
