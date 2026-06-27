// Didit kimlik doğrulama (KYC) entegrasyonu — gerçek otomatik kimlik+selfie doğrulama.
// Kullanıcı Didit'in hazır ekranında belge+liveness çeker, sonuç webhook ile gelir.
//
// Anahtarlar YOKSA DIDIT_ENABLED=false → onboarding kimlik adımı mevcut "belge yükle
// + inceleniyor" akışına (eski /api/kyc) düşer. Üretim:
//   DIDIT_API_KEY         (X-API-Key header)
//   DIDIT_WORKFLOW_ID     (oluşturduğun doğrulama akışının id'si)
//   DIDIT_WEBHOOK_SECRET  (webhook HMAC imza doğrulaması)
//   DIDIT_BASE_URL        (varsayılan https://verification.didit.me)
//
// Akış: POST {BASE}/v2/session/ {workflow_id, vendor_data} → {session_id, url}.
// Kullanıcı url'ye gider, doğrular; Didit /api/kyc/webhook'a status gönderir.

import { createHmac, timingSafeEqual } from "node:crypto";

const API_KEY = process.env.DIDIT_API_KEY?.trim();
const WORKFLOW_ID = process.env.DIDIT_WORKFLOW_ID?.trim();
const WEBHOOK_SECRET = process.env.DIDIT_WEBHOOK_SECRET?.trim();
const BASE_URL = (process.env.DIDIT_BASE_URL?.trim() || "https://verification.didit.me").replace(/\/$/, "");

export const DIDIT_ENABLED = !!API_KEY && !!WORKFLOW_ID;

type CreateSessionResult =
  | { ok: true; sessionId: string; url: string }
  | { ok: false; error: string };

/**
 * Yeni doğrulama oturumu aç. vendorData = bizim userId (webhook'ta geri gelir),
 * callbackUrl = kullanıcı doğrulamayı bitirince döneceği sayfa.
 */
export async function createVerificationSession(
  vendorData: string,
  callbackUrl?: string,
): Promise<CreateSessionResult> {
  if (!DIDIT_ENABLED) return { ok: false, error: "KYC servisi yapılandırılmamış." };
  try {
    const body: Record<string, string> = {
      workflow_id: WORKFLOW_ID!,
      vendor_data: vendorData,
    };
    if (callbackUrl) body.callback = callbackUrl;

    const res = await fetch(`${BASE_URL}/v2/session/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": API_KEY!,
      },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => null)) as
      | { session_id?: string; url?: string; message?: string; detail?: string }
      | null;

    if ((res.status === 200 || res.status === 201) && data?.session_id && data?.url) {
      return { ok: true, sessionId: data.session_id, url: data.url };
    }
    return { ok: false, error: data?.message ?? data?.detail ?? `Didit hatası (${res.status})` };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Ağ hatası" };
  }
}

/* ── Webhook imza doğrulama ──────────────────────────────────────────────────
   Didit 3 imza başlığı gönderir. En sağlamı "Simple" (alan-bazlı, encoding
   sorunsuz): canonical = "{timestamp}:{session_id}:{status}:{webhook_type}".
   Yedek olarak V2 (sıralı-anahtar JSON HMAC). 300s zaman toleransı. */

function safeEqualHex(a: string, b: string): boolean {
  try {
    const ab = Buffer.from(a, "hex");
    const bb = Buffer.from(b, "hex");
    return ab.length === bb.length && timingSafeEqual(ab, bb);
  } catch {
    return false;
  }
}

function withinWindow(timestamp: number, nowSec: number): boolean {
  return Number.isFinite(timestamp) && Math.abs(nowSec - timestamp) <= 300;
}

/** Stabil JSON (sıralı anahtar) — Python json.dumps(sort_keys=True) karşılığı. */
function stableStringify(obj: unknown): string {
  if (obj === null || obj === undefined) return JSON.stringify(obj);
  if (Array.isArray(obj)) return "[" + obj.map(stableStringify).join(",") + "]";
  if (typeof obj === "object") {
    const keys = Object.keys(obj as Record<string, unknown>).sort();
    return "{" + keys.map((k) => JSON.stringify(k) + ":" + stableStringify((obj as Record<string, unknown>)[k])).join(",") + "}";
  }
  return JSON.stringify(obj);
}

export type DiditWebhookHeaders = {
  v2?: string | null;
  simple?: string | null;
};

/**
 * Webhook'u doğrula. body parse edilmiş JSON, rawValid için header imzaları.
 * Dönüş: true ise istek gerçekten Didit'ten geldi.
 */
export function verifyWebhook(
  body: { created_at?: number; timestamp?: number; session_id?: string; status?: string; webhook_type?: string },
  headers: DiditWebhookHeaders,
): boolean {
  if (!WEBHOOK_SECRET) return false;
  const ts = Number(body.created_at);
  const nowSec = Math.floor(Date.now() / 1000);
  if (!withinWindow(ts, nowSec)) return false;

  // 1) Simple (tercih)
  if (headers.simple) {
    const canonical = [
      String(body.timestamp ?? ts ?? ""),
      String(body.session_id ?? ""),
      String(body.status ?? ""),
      String(body.webhook_type ?? ""),
    ].join(":");
    const expected = createHmac("sha256", WEBHOOK_SECRET).update(canonical, "utf-8").digest("hex");
    if (safeEqualHex(expected, headers.simple)) return true;
  }
  // 2) V2 (sıralı JSON)
  if (headers.v2) {
    const expected = createHmac("sha256", WEBHOOK_SECRET).update(stableStringify(body), "utf-8").digest("hex");
    if (safeEqualHex(expected, headers.v2)) return true;
  }
  return false;
}
