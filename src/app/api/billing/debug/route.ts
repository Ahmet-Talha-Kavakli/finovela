// GEÇİCİ teşhis endpoint'i — Paddle env'lerinin canlıda OKUNUP okunmadığını söyler.
// Değerleri ASLA döndürmez; sadece var/yok + uzunluk + ilk-birkaç-karakter (maskeli).
// Teşhis bitince SİLİNECEK.

import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function mask(v: string | undefined): { set: boolean; len: number; prefix: string } {
  if (!v) return { set: false, len: 0, prefix: "" };
  const t = v.trim();
  return { set: true, len: t.length, prefix: t.slice(0, 6) };
}

export async function GET() {
  return NextResponse.json({
    PADDLE_API_KEY: mask(process.env.PADDLE_API_KEY),
    NEXT_PUBLIC_PADDLE_CLIENT_TOKEN: mask(process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN),
    PADDLE_WEBHOOK_SECRET: mask(process.env.PADDLE_WEBHOOK_SECRET),
    PADDLE_PRICE_PRO: mask(process.env.PADDLE_PRICE_PRO),
    PADDLE_PRICE_UNLIMITED: mask(process.env.PADDLE_PRICE_UNLIMITED),
    PADDLE_ENV: process.env.PADDLE_ENV ?? "(yok → live)",
  });
}
