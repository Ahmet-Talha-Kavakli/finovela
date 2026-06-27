// Vela durum senkronizasyonu — client store'larının cihazlar-arası kalıcılığı.
// GET: kullanıcının DB'deki son durumunu döndür (hidrasyon).
// PUT: client durumunu DB'ye yaz (son-yazan-kazanır + çakışma tespiti).
// Clerk userId'ye bağlı; demo modda demo-user.

import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/current-user";
import { getState, putState, type StateBlob } from "@/lib/db/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const userId = await requireUserId();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Oturum gerekli" }, { status: 401 });
    }
    const row = await getState(userId);
    return NextResponse.json({ ok: true, blob: row?.blob ?? null, rev: row?.rev ?? 0 });
  } catch (e) {
    console.error("[api/state] GET failed:", e);
    return NextResponse.json({ ok: false, error: "Bir hata oluştu" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const userId = await requireUserId();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Oturum gerekli" }, { status: 401 });
    }
    const body = (await req.json()) as { blob?: StateBlob; rev?: number };
    if (!body.blob || typeof body.blob !== "object") {
      return NextResponse.json({ ok: false, error: "blob required" }, { status: 400 });
    }
    // Boyut tavanı — tek kullanıcı sınırsız veri yazıp depoyu şişiremesin.
    if (JSON.stringify(body.blob).length > 1_000_000) {
      return NextResponse.json({ ok: false, error: "İstek çok büyük." }, { status: 413 });
    }
    const res = await putState(userId, body.blob, Date.now(), body.rev);
    if (res.conflict) {
      // Sunucu daha yeni — client birleştirsin diye sunucu durumunu geri ver.
      return NextResponse.json({ ok: true, conflict: true, rev: res.rev, server: res.server });
    }
    return NextResponse.json({ ok: true, conflict: false, rev: res.rev });
  } catch (e) {
    console.error("[api/state] PUT failed:", e);
    return NextResponse.json({ ok: false, error: "Bir hata oluştu" }, { status: 500 });
  }
}
