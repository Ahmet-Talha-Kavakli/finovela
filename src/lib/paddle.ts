// Paddle entegrasyonu — sunucu tarafı yapılandırma + yardımcılar.
// Anahtar (PADDLE_API_KEY) YOKSA PADDLE_ENABLED=false olur ve ödeme akışı
// zarifçe devre dışı kalır (uygulama çalışmaya devam eder).
//
// Gerekli env değişkenleri:
//   PADDLE_API_KEY               — sunucu API anahtarı (gizli)
//   PADDLE_WEBHOOK_SECRET        — webhook imza doğrulama gizli anahtarı (ntfset_...)
//   NEXT_PUBLIC_PADDLE_CLIENT_TOKEN — Paddle.js client-side token (overlay checkout)
//   PADDLE_PRICE_PRO             — Pro planı için price ID (pri_...)
//   PADDLE_PRICE_UNLIMITED       — Unlimited planı için price ID (pri_...)
//   PADDLE_ENV                   — "sandbox" → sandbox-api.paddle.com; aksi: live (api.paddle.com)

import { createHmac, timingSafeEqual } from "node:crypto";
import type { PlanId } from "@/lib/plans";

const API_KEY = process.env.PADDLE_API_KEY?.trim();

/** Paddle yapılandırılmış mı? (anahtar var + placeholder değil) */
export const PADDLE_ENABLED =
  !!API_KEY && !API_KEY.includes("YOUR_") && !API_KEY.includes("placeholder");

/** Ortam: sandbox veya live (varsayılan). */
export const PADDLE_ENV: "sandbox" | "live" =
  process.env.PADDLE_ENV?.trim().toLowerCase() === "sandbox" ? "sandbox" : "live";

/** Paddle REST API kök adresi (ortama göre). */
export const PADDLE_API_BASE =
  PADDLE_ENV === "sandbox" ? "https://sandbox-api.paddle.com" : "https://api.paddle.com";

/** Client-side (Paddle.js) token — overlay checkout için. */
export const PADDLE_CLIENT_TOKEN = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN?.trim() || "";

/** Ücretli plan → Paddle Price ID (env'den). free → null. */
export function priceIdForPlan(plan: PlanId): string | null {
  if (plan === "pro") return process.env.PADDLE_PRICE_PRO?.trim() || null;
  if (plan === "unlimited") return process.env.PADDLE_PRICE_UNLIMITED?.trim() || null;
  return null;
}

/** Paddle Price ID → PlanId (webhook'ta plan saptamak için). */
export function planForPriceId(priceId: string | null | undefined): PlanId | null {
  if (!priceId) return null;
  if (priceId === process.env.PADDLE_PRICE_PRO?.trim()) return "pro";
  if (priceId === process.env.PADDLE_PRICE_UNLIMITED?.trim()) return "unlimited";
  return null;
}

/**
 * Paddle REST API'sine kimlik doğrulamalı istek (Bearer PADDLE_API_KEY).
 * @throws PADDLE_ENABLED değilse veya istek başarısızsa.
 */
export async function paddleFetch<T = unknown>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  if (!PADDLE_ENABLED) throw new Error("Paddle yapılandırılmamış (PADDLE_API_KEY yok).");
  const res = await fetch(`${PADDLE_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const text = await res.text();
  const json = text ? JSON.parse(text) : {};
  if (!res.ok) {
    const msg = (json as { error?: { detail?: string } })?.error?.detail ?? res.statusText;
    throw new Error(`Paddle API ${res.status}: ${msg}`);
  }
  return json as T;
}

/**
 * Paddle webhook imzasını doğrula.
 * Header biçimi: "ts=<unix>;h1=<hmac_sha256_hex>"
 * İmzalanan içerik: `${ts}:${rawBody}` (HMAC-SHA256, PADDLE_WEBHOOK_SECRET).
 * @returns imza geçerliyse true.
 */
export function verifyPaddleSignature(rawBody: string, signatureHeader: string | null): boolean {
  const secret = process.env.PADDLE_WEBHOOK_SECRET?.trim();
  if (!secret || !signatureHeader) return false;

  // "ts=..;h1=.." → parçala
  const parts = Object.fromEntries(
    signatureHeader.split(";").map((p) => {
      const i = p.indexOf("=");
      return [p.slice(0, i).trim(), p.slice(i + 1).trim()];
    }),
  ) as { ts?: string; h1?: string };

  if (!parts.ts || !parts.h1) return false;

  const expected = createHmac("sha256", secret).update(`${parts.ts}:${rawBody}`).digest("hex");
  try {
    const a = Buffer.from(expected, "hex");
    const b = Buffer.from(parts.h1, "hex");
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
