// KYC — Didit webhook. Doğrulama durumu değişince Didit buraya POST eder.
// HMAC imzası doğrulanır (sahte istek reddedilir), sonra DB'de KYC durumu güncellenir.
//
// Didit dashboard'da Webhook URL: https://finovela.com/api/kyc/webhook
// İmza: X-Signature-Simple (tercih) / X-Signature-V2. DIDIT_WEBHOOK_SECRET ile.
//
// NOT: Bilinmeyen kullanıcı / sahte imza durumunda bile webhook retry fırtınasını
// önlemek için uygun statü döneriz (imza hatası 401, kullanıcı yok 200-ack).

import { NextResponse } from "next/server";
import { verifyWebhook } from "@/lib/didit";
import { applyDiditStatus } from "@/lib/db/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const raw = await req.text();
  let body: {
    session_id?: string;
    status?: string;
    vendor_data?: string;
    webhook_type?: string;
    created_at?: number;
    timestamp?: number;
  };
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const valid = verifyWebhook(body, {
    simple: req.headers.get("x-signature-simple"),
    v2: req.headers.get("x-signature-v2"),
  });
  if (!valid) {
    console.error("[kyc/webhook] signature verification failed");
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const userId = body.vendor_data;
  const status = body.status;
  if (!userId || !status) {
    // Geçerli imza ama eksik veri — ack ver (retry'ı durdur).
    return NextResponse.json({ ok: true, acknowledged: true });
  }

  try {
    const mapped = await applyDiditStatus(userId, status);
    console.log(`[kyc/webhook] user=${userId} didit=${status} → ${mapped}`);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[kyc/webhook] db update failed:", e);
    // Geçici DB hatası → 500 ki Didit tekrar denesin.
    return NextResponse.json({ ok: false, error: "DB error" }, { status: 500 });
  }
}
