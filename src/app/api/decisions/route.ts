// AI Karar Defteri — DB denetim kaydı (Blok 3).
// GET: kullanıcının karar geçmişi. POST: yeni karar kaydı.

import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/current-user";
import { listDecisions, addDecision, type DecisionInput } from "@/lib/db/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const userId = await requireUserId();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Oturum gerekli" }, { status: 401 });
    }
    return NextResponse.json({ ok: true, decisions: await listDecisions(userId) });
  } catch (e) {
    console.error("[api/decisions] GET failed:", e);
    return NextResponse.json({ ok: false, error: "Bir hata oluştu" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Oturum gerekli" }, { status: 401 });
    }
    const d = (await req.json()) as DecisionInput;
    if (!d.id || !d.action || !d.rationale) {
      return NextResponse.json({ ok: false, error: "id/action/rationale required" }, { status: 400 });
    }
    await addDecision(userId, d);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[api/decisions] POST failed:", e);
    return NextResponse.json({ ok: false, error: "Bir hata oluştu" }, { status: 500 });
  }
}
