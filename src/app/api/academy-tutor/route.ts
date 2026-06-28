import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { requireUserId } from "@/lib/current-user";
import { checkAndIncrement } from "@/lib/usage";
import { rateLimit, rateLimitKey, RATE_LIMITS, tooManyRequests } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const maxDuration = 60;

// Academy eğitmeni — dengeli tier (Sonnet), hızlı ve net açıklamalar.
const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 2048;

const TUTOR_SYSTEM_PROMPT = `Sen Finovela Academy'nin yapay zeka eğitmenisin.
Kullanıcı bir yatırım dersi okuyor ve ders hakkında soru soruyor. Görevin o dersin
kapsamında, anlaşılır ve doğru bir şekilde öğretmek.

KURALLAR:
- Türkçe, sıcak ve sabırlı bir öğretmen tonu kullan.
- Sana dersin başlığı ve içeriği verilir; cevabını ÖNCELİKLE o dersin bağlamına dayandır.
- Ders dışı ama ilgili bir soru gelirse kısaca cevapla, sonra derse bağla.
- Kısa ve odaklı ol — uzun cevaplardan kaçın. Gerekirse madde kullan.
- Bu EĞİTİM içeriğidir, yatırım tavsiyesi DEĞİL. Belirli bir varlığı "al/sat" diye
  yönlendirme; kavramı ve mantığı öğret.
BİÇİM: Markdown — kısa başlık (##) gerekirse, **kalın** vurgu, - madde listesi.`;

function clampStr(v: unknown, max: number): string {
  return typeof v === "string" ? v.slice(0, max) : "";
}

export async function POST(req: NextRequest) {
  const userId = await requireUserId();
  if (!userId) {
    return new Response(JSON.stringify({ error: "Oturum gerekli" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  const rl = rateLimit(rateLimitKey("academy-tutor", userId, req.headers), RATE_LIMITS.chat);
  if (!rl.ok) return tooManyRequests(rl.retryAfterSec);

  const body = (await req.json().catch(() => ({}))) as {
    lessonTitle?: unknown;
    lessonBody?: unknown;
    question?: unknown;
  };
  const lessonTitle = clampStr(body.lessonTitle, 200);
  const lessonBody = clampStr(body.lessonBody, 4000);
  const question = clampStr(body.question, 1000).trim();

  if (!question) {
    return NextResponse.json({ error: "Soru boş olamaz" }, { status: 400 });
  }

  // Günlük AI limiti — chat ile aynı havuz.
  const usage = await checkAndIncrement(userId, "aiChat", "aiChatsPerDay");
  if (!usage.ok) {
    return NextResponse.json(
      {
        error: "Günlük AI hakkın doldu. Sınırsız öğrenme için Pro'ya yükselt.",
        code: "usage_limit",
        used: usage.used,
        limit: usage.limit,
      },
      { status: 402 },
    );
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY missing" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }

  const userPrompt = [
    `DERS: ${lessonTitle}`,
    "",
    "DERS İÇERİĞİ:",
    lessonBody,
    "",
    `ÖĞRENCİNİN SORUSU: ${question}`,
    "",
    "Bu dersin bağlamında soruyu öğretici biçimde yanıtla.",
  ].join("\n");

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const encoder = new TextEncoder();
  const reqSignal = req.signal;

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;
      const send = (event: string, data: unknown) => {
        if (closed) return;
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      try {
        const msgStream = client.messages.stream(
          {
            model: MODEL,
            max_tokens: MAX_TOKENS,
            system: [
              { type: "text", text: TUTOR_SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
            ],
            messages: [{ role: "user", content: userPrompt }],
          },
          { signal: reqSignal },
        );

        const onAbort = () => {
          try {
            msgStream.abort();
          } catch {
            /* zaten kapalı */
          }
        };
        reqSignal.addEventListener("abort", onAbort, { once: true });

        msgStream.on("text", (delta) => send("text", { delta }));

        try {
          await msgStream.finalMessage();
        } finally {
          reqSignal.removeEventListener("abort", onAbort);
        }

        if (!reqSignal.aborted) send("done", {});
      } catch (e) {
        if (!reqSignal.aborted) {
          console.error("[api/academy-tutor] stream failed:", e);
          send("error", { message: "Bir hata oluştu" });
        }
      } finally {
        closed = true;
        try {
          controller.close();
        } catch {
          /* zaten kapalı */
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      "x-accel-buffering": "no",
    },
  });
}
