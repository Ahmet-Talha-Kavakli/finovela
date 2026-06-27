import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { requireUserId } from "@/lib/current-user";
import { rateLimit, rateLimitKey, RATE_LIMITS, tooManyRequests } from "@/lib/ratelimit";
import { NEWS_CAPS, clampStr } from "@/lib/ai-guard";

export const runtime = "nodejs";
export const maxDuration = 30;

// Ucuz günlük özet için Haiku — kısa, akışsız, JSON dönüş.
const MODEL = "claude-haiku-4-5-20251001";

/**
 * Vela günlük piyasa özeti.
 * POST { headlines: string[], topic?: string }
 *   → { summary: string }  (3-4 cümlelik Türkçe "Bugün piyasalarda…" digest)
 * ANTHROPIC_API_KEY yoksa zarif bir yedek özet döner.
 */
export async function POST(req: NextRequest) {
  // Sıra: auth → rate-limit → boyut kontrolü → AI çağrısı.
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "Oturum gerekli" }, { status: 401 });
  }
  const rl = rateLimit(
    rateLimitKey("news-summary", userId, req.headers),
    RATE_LIMITS.newsSummary,
  );
  if (!rl.ok) {
    return tooManyRequests(rl.retryAfterSec);
  }

  let headlines: string[] = [];
  let topic: string | undefined;
  try {
    const body = (await req.json()) as { headlines?: string[]; topic?: string };
    // Boyut kontrolü: başlık sayısını, başlık uzunluğunu ve topic'i sınırla.
    headlines = (Array.isArray(body.headlines) ? body.headlines : [])
      .filter((h): h is string => typeof h === "string" && h.length > 0)
      .slice(0, NEWS_CAPS.maxHeadlines)
      .map((h) => clampStr(h, NEWS_CAPS.maxHeadlineChars) ?? "");
    topic = clampStr(body.topic, NEWS_CAPS.maxTopicChars);
  } catch {
    /* gövde yok/bozuk — yedek özetle devam */
  }

  // Anahtar yoksa: zarif, deterministik yedek (AI çağrısı yok).
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ summary: fallbackSummary(headlines) });
  }

  // Maliyet kontrolü: en fazla 15 başlık gönder.
  const list = headlines.slice(0, 15);
  if (list.length === 0 && !topic) {
    return NextResponse.json({ summary: fallbackSummary([]) });
  }

  const prompt = topic
    ? `Aşağıdaki konu hakkında bugünkü piyasa gelişmelerini özetle: ${topic}`
    : `Bugünün finans haber başlıkları aşağıda. Bunları okuyup yatırımcı için kısa bir günlük özet çıkar:\n\n${list
        .map((h, i) => `${i + 1}. ${h}`)
        .join("\n")}`;

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: 300,
      system:
        "Sen Finovela'nın piyasa editörüsün. SADECE Türkçe yaz. Verilen haber başlıklarından " +
        "yatırımcı için 3-4 cümlelik kısa bir günlük piyasa özeti üret. " +
        '"Bugün piyasalarda" diye başla. Genel havayı (risk iştahı, öne çıkan sektör/varlıklar, ' +
        "dikkat çeken hareketler) aktar. Yatırım tavsiyesi verme, abartma, başlıkları tek tek sıralama. " +
        "Akıcı, sade ve profesyonel bir dil kullan. Markdown kullanma, düz paragraf yaz.",
      messages: [{ role: "user", content: prompt }],
    });

    const summary = msg.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();

    return NextResponse.json({ summary: summary || fallbackSummary(list) });
  } catch {
    return NextResponse.json({ summary: fallbackSummary(list) });
  }
}

/** AI olmadan makul bir Türkçe özet (anahtar yok / hata durumu). */
function fallbackSummary(headlines: string[]): string {
  if (headlines.length === 0) {
    return "Bugün piyasalarda öne çıkan başlıkları derlemeye çalışıyoruz. Güncel haber akışı yüklendiğinde günlük özet burada görünecek.";
  }
  const n = headlines.length;
  return `Bugün piyasalarda ${n} öne çıkan başlık takip ediliyor. Yapay zeka özeti şu an kullanılamıyor; aşağıdaki haber akışından güncel gelişmeleri ve her başlığın duyarlılık etiketini inceleyebilirsiniz.`;
}
