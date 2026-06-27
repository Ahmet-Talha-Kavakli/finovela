// [KULLANIM DIŞI] Stripe entegrasyonu — ödeme sistemi Paddle'a taşındı (src/lib/paddle.ts).
// Bu dosya geriye uyum için bırakıldı; hiçbir yerden import EDİLMEMELİ.
// STRIPE_SECRET_KEY tanımlı olmadığından STRIPE_ENABLED daima false kalır.

import Stripe from "stripe";
import type { PlanId } from "@/lib/plans";

const SECRET = process.env.STRIPE_SECRET_KEY?.trim();

export const STRIPE_ENABLED = !!SECRET && !SECRET.includes("YOUR_") && !SECRET.includes("placeholder");

let _stripe: Stripe | null = null;

/** Stripe istemcisi (yalnızca STRIPE_ENABLED ise). */
export function getStripe(): Stripe {
  if (!STRIPE_ENABLED) throw new Error("Stripe yapılandırılmamış (STRIPE_SECRET_KEY yok).");
  if (!_stripe) _stripe = new Stripe(SECRET!);
  return _stripe;
}

/** Ücretli plan → Stripe Price ID (env'den). */
export function priceIdForPlan(plan: PlanId): string | null {
  if (plan === "pro") return process.env.STRIPE_PRICE_PRO?.trim() || null;
  if (plan === "unlimited") return process.env.STRIPE_PRICE_UNLIMITED?.trim() || null;
  return null; // free ücretsiz
}

/** Stripe Price ID → PlanId (webhook'ta plan saptamak için). */
export function planForPriceId(priceId: string | null | undefined): PlanId | null {
  if (!priceId) return null;
  if (priceId === process.env.STRIPE_PRICE_PRO?.trim()) return "pro";
  if (priceId === process.env.STRIPE_PRICE_UNLIMITED?.trim()) return "unlimited";
  return null;
}
