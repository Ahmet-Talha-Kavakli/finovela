// Canlı destek asistanı — Gemini destekli, Finovela'yı bilen yardım botu.
// Sohbet AI'dan (Anthropic, /api/chat) AYRIDIR: bu yalnızca ürün/destek soruları
// (nasıl çalışır, fiyat, güvenlik, hesap) yanıtlar; yatırım tavsiyesi VERMEZ.
//
// POST { messages: {role, content}[] } → SSE stream (event: text / done / error)
// GEMINI_API_KEY yoksa graceful sabit yanıt döner (widget yine çalışır).

import { NextRequest } from "next/server";
import { rateLimit, rateLimitKey, RATE_LIMITS, tooManyRequests } from "@/lib/ratelimit";
import { SUPPORT_SYSTEM_PROMPT } from "@/lib/ai/support-prompt";

export const runtime = "nodejs";
export const maxDuration = 30;

const GEMINI_KEY = process.env.GEMINI_API_KEY?.trim();
const MODEL = "gemini-2.5-flash"; // hızlı + ucuz; destek için fazlasıyla yeterli

type Msg = { role: "user" | "assistant"; content: string };

function sse(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function POST(req: NextRequest) {
  // Hafif rate limit — chat ile aynı politika (destek anonim de olabilir → IP).
  const key = rateLimitKey("support", null, req.headers);
  const rl = rateLimit(key, RATE_LIMITS.chat);
  if (!rl.ok) return tooManyRequests(rl.retryAfterSec);

  const body = (await req.json().catch(() => ({}))) as { messages?: Msg[] };
  const messages = Array.isArray(body.messages) ? body.messages.slice(-12) : [];
  const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content?.trim() ?? "";
  if (!lastUser) {
    return new Response(JSON.stringify({ error: "Boş mesaj" }), { status: 400 });
  }

  // Gemini yoksa: zarif sabit yardım (widget kırılmasın).
  if (!GEMINI_KEY) {
    const stream = new ReadableStream({
      start(controller) {
        const enc = new TextEncoder();
        const fallback =
          "Şu an canlı destek asistanı yapılandırılmamış. Sorun için support@finovela.com adresine yazabilir ya da Destek sayfasındaki sık sorulanlara göz atabilirsin.";
        controller.enqueue(enc.encode(sse("text", { delta: fallback })));
        controller.enqueue(enc.encode(sse("done", {})));
        controller.close();
      },
    });
    return new Response(stream, {
      headers: { "content-type": "text/event-stream", "cache-control": "no-cache" },
    });
  }

  // Gemini içeriği: system instruction + sohbet geçmişi.
  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const enc = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:streamGenerateContent?alt=sse&key=${GEMINI_KEY}`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: SUPPORT_SYSTEM_PROMPT }] },
            contents,
            generationConfig: {
              temperature: 0.4,
              maxOutputTokens: 1024,
              // Düşünme kapalı: destek botu hızlı yanıt vermeli; thinking token'ları
              // maxOutputTokens'ı yiyip "MAX_TOKENS"ta kesik yanıta yol açıyordu.
              thinkingConfig: { thinkingBudget: 0 },
            },
          }),
        });

        if (!res.ok || !res.body) {
          const errText = await res.text().catch(() => "");
          console.error("[api/support] Gemini error:", res.status, errText.slice(0, 300));
          controller.enqueue(
            enc.encode(
              sse("text", {
                delta:
                  "Şu an yanıt veremiyorum. Birazdan tekrar dener misin? Acil bir konuysa support@finovela.com bize ulaş.",
              }),
            ),
          );
          controller.enqueue(enc.encode(sse("done", {})));
          controller.close();
          return;
        }

        // Gemini SSE: her satır "data: {json}" — candidates[].content.parts[].text
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() ?? "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const json = trimmed.slice(5).trim();
            if (!json || json === "[DONE]") continue;
            try {
              const parsed = JSON.parse(json);
              const parts = parsed?.candidates?.[0]?.content?.parts;
              if (Array.isArray(parts)) {
                const text = parts.map((p: { text?: string }) => p.text ?? "").join("");
                if (text) controller.enqueue(enc.encode(sse("text", { delta: text })));
              }
            } catch {
              /* kısmi JSON — bir sonraki chunk'ta tamamlanır */
            }
          }
        }
        controller.enqueue(enc.encode(sse("done", {})));
        controller.close();
      } catch (e) {
        console.error("[api/support] stream failed:", e);
        try {
          controller.enqueue(
            enc.encode(sse("text", { delta: "Bağlantı koptu, tekrar dener misin?" })),
          );
          controller.enqueue(enc.encode(sse("done", {})));
          controller.close();
        } catch {
          /* zaten kapalı */
        }
      }
    },
  });

  return new Response(stream, {
    headers: { "content-type": "text/event-stream", "cache-control": "no-cache" },
  });
}
