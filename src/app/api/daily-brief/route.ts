import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { requireUserId } from "@/lib/current-user";
import { rateLimit, rateLimitKey, RATE_LIMITS, tooManyRequests } from "@/lib/ratelimit";
import { BRIEF_CAPS, clampStr } from "@/lib/ai-guard";

export const runtime = "nodejs";
export const maxDuration = 30;

// Vela'nın proaktif günlük portföy brifingi — kullanıcının CANLI portföyüne göre
// 3-4 kısa, aksiyon odaklı Türkçe madde üretir. Ucuz (Haiku).
const MODEL = "claude-haiku-4-5-20251001";

export async function POST(req: NextRequest) {
  // Sıra: auth → rate-limit → boyut kontrolü → AI çağrısı.
  const userId = await requireUserId();
  if (!userId) {
    return Response.json({ error: "Oturum gerekli" }, { status: 401 });
  }
  const rl = rateLimit(
    rateLimitKey("daily-brief", userId, req.headers),
    RATE_LIMITS.dailyBrief,
  );
  if (!rl.ok) {
    return tooManyRequests(rl.retryAfterSec);
  }

  const body = (await req.json()) as {
    portfolio?: string;
    movers?: string;
  };
  // Girdi alanlarını kırp (token/maliyet sınırı).
  const portfolio = clampStr(body.portfolio, BRIEF_CAPS.maxFieldChars);
  const movers = clampStr(body.movers, BRIEF_CAPS.maxFieldChars);

  // Anahtar yoksa graceful fallback (uygulama bozulmasın).
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({
      lines: [
        "Portföyünü canlı izliyorum — bugün belirgin bir aksiyon gerekmiyor.",
        "Pozisyonların dengeli görünüyor; panikle alıp satma.",
        "Detaylı analiz için Finovela Sohbet'i aç.",
      ],
    });
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: 400,
      system:
        "Sen Finovela, elit bir portföy yöneticisisin. Kullanıcının CANLI portföyüne bakıp 3-4 KISA, somut, aksiyon odaklı Türkçe brifing maddesi üret. Her madde tek cümle, rakam içersin, profesyonel ve kendinden emin olsun. Uyarı/feragat YAZMA (uygulama otomatik ekliyor). Sadece maddeleri döndür, başlık/numara yok.",
      messages: [
        {
          role: "user",
          content: `Portföyüm:\n${portfolio ?? "Veri yok"}\n\nGünün hareketleri:\n${movers ?? ""}\n\nBugün için kısa brifing ver.`,
        },
      ],
    });
    const text = msg.content.find((b) => b.type === "text")?.type === "text"
      ? (msg.content.find((b) => b.type === "text") as { text: string }).text
      : "";
    const lines = text
      .split("\n")
      .map((l) => l.replace(/^[\s\-*•\d.]+/, "").trim())
      .filter((l) => l.length > 0)
      .slice(0, 4);
    return Response.json({ lines: lines.length ? lines : ["Portföyün dengeli — bugün aksiyon gerekmiyor."] });
  } catch {
    return Response.json({
      lines: ["Portföyünü izliyorum — bugün belirgin bir aksiyon gerekmiyor."],
    });
  }
}
