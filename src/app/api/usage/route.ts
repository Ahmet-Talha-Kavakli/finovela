// Kullanım/kredi özeti — UI kredi halkası + kalan kredi göstergesi için.
// GET: kullanıcının bugünkü AI sohbet kullanımı + plan limiti + plan kimliği.

import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/current-user";
import { usageSummary, serializeLimit } from "@/lib/usage";
import { getUserPlan } from "@/lib/plan-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const userId = await requireUserId();
    const [summary, { id: plan }] = await Promise.all([
      usageSummary(userId),
      getUserPlan(userId),
    ]);
    return NextResponse.json({
      ok: true,
      plan,
      aiChat: {
        used: summary.aiChat.used,
        limit: serializeLimit(summary.aiChat.limit), // -1 = sınırsız
        remaining: serializeLimit(summary.aiChat.remaining),
      },
    });
  } catch {
    return NextResponse.json({ ok: true, plan: "free", aiChat: { used: 0, limit: 20, remaining: 20 } });
  }
}
