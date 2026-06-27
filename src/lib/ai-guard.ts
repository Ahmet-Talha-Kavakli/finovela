// AI rotaları için girdi boyutu korumaları — token/maliyet istismarını sınırlar.
// Mantık: makul alanları kırp (truncate), absürt yükleri sert reddet (413).

/** Bir string'i en fazla `max` karaktere kırpar (undefined ise undefined döner). */
export function clampStr(s: string | undefined, max: number): string | undefined {
  if (s == null) return s;
  return s.length > max ? s.slice(0, max) : s;
}

/** Standart 413 yanıtı (Türkçe). */
export function payloadTooLarge(): Response {
  return new Response(JSON.stringify({ error: "İstek çok büyük." }), {
    status: 413,
    headers: { "content-type": "application/json" },
  });
}

// /api/chat sınırları.
export const CHAT_CAPS = {
  /** Tutulacak son mesaj sayısı (en yeniler). */
  maxMessages: 40,
  /** Tek bir mesaj metni için maksimum karakter (üzeri kırpılır). */
  maxMessageChars: 12_000,
  /** Tek bir bağlam alanı (portfolio/memory/goals/brain) için maks karakter. */
  maxFieldChars: 16_000,
  /** Tüm birleşik girdinin sert üst sınırı — üzeri 413 ile reddedilir. */
  maxTotalChars: 60_000,
} as const;

// Haiku rotaları için daha hafif sınırlar.
export const BRIEF_CAPS = {
  maxFieldChars: 8_000,
} as const;

export const NEWS_CAPS = {
  /** En fazla başlık sayısı. */
  maxHeadlines: 15,
  /** Tek başlık için maks karakter. */
  maxHeadlineChars: 400,
  /** topic için maks karakter. */
  maxTopicChars: 400,
} as const;
