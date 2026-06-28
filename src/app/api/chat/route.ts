import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { VELA_SYSTEM_PROMPT } from "@/lib/ai/system-prompt";
import { VELA_TOOLS, runTool } from "@/lib/ai/tools";
import { requireUserId } from "@/lib/current-user";
import { hasFeature } from "@/lib/plan-access";
import { checkAndIncrement } from "@/lib/usage";
import { rateLimit, rateLimitKey, RATE_LIMITS, tooManyRequests } from "@/lib/ratelimit";
import { CHAT_CAPS, clampStr, payloadTooLarge } from "@/lib/ai-guard";

export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = "claude-opus-4-8";

/**
 * Anthropic SUNUCU aracı: gerçek web araması (#10). Anthropic kendi sunucusunda
 * çalıştırır — biz runTool ile YÜRÜTMEYİZ; sonuç bir `web_search_tool_result`
 * bloğu olarak akışta geri gelir. max_uses ile maliyet sınırlı tutulur.
 * SDK v0.105 bu tipi (WebSearchTool20250305) yerel olarak destekler → cast yok.
 */
const WEB_SEARCH_TOOL: Anthropic.WebSearchTool20250305 = {
  type: "web_search_20250305",
  name: "web_search",
  max_uses: 5,
};

/** Custom (bizim yürüttüğümüz) + server (Anthropic'in yürüttüğü) araçlar birlikte. */
const ALL_TOOLS: Anthropic.ToolUnion[] = [...VELA_TOOLS, WEB_SEARCH_TOOL];

/**
 * Model kademesi → gerçek Anthropic model id + max_tokens.
 * GÜVENLİK: istemci yalnızca kademe anahtarı (vela-1 vb.) gönderir; ASLA ham model
 * adı değil. Bu allowlist dışındaki/eksik her değer varsayılana (Vela 1.2 / opus) düşer.
 */
// thinkBudget: 0 = extended thinking KAPALI (hızlı tier). >0 = derin düşünme bütçesi
// (token). thinking açıkken max_tokens > thinkBudget olmalı; ilk-token biraz gecikir
// ama analiz kalitesi ZIPLAR — "sektör #1" için bu fark kritik.
const TIER_MAP: Record<string, { model: string; maxTokens: number; thinkBudget: number }> = {
  "vela-1": { model: "claude-haiku-4-5-20251001", maxTokens: 3072, thinkBudget: 0 },
  "vela-1.1": { model: "claude-sonnet-4-6", maxTokens: 8192, thinkBudget: 2048 },
  "vela-1.2": { model: MODEL, maxTokens: 12000, thinkBudget: 4096 },
};
// Dengeli (Sonnet) varsayılan: Opus ilk-token gecikmesi "donma" gibi algılanıyordu.
const DEFAULT_TIER = "vela-1.1";

function resolveModel(tier: unknown): { model: string; maxTokens: number; thinkBudget: number } {
  if (typeof tier === "string" && tier in TIER_MAP) return TIER_MAP[tier];
  return TIER_MAP[DEFAULT_TIER];
}

/** Yanıt tonu → sisteme eklenecek tek satır Türkçe talimat. "balanced" hiçbir şey eklemez. */
const TONE_INSTRUCTIONS: Record<string, string> = {
  concise: "Yanıt tonu: kısa, net ve öz ol; gereksiz açıklamadan kaçın.",
  professional: "Yanıt tonu: profesyonel, kurumsal ve ölçülü bir dil kullan.",
  warm: "Yanıt tonu: sıcak, samimi ve cesaret verici ol; yine de net kal.",
};

function resolveTone(tone: unknown): string {
  if (typeof tone === "string" && tone in TONE_INSTRUCTIONS) return TONE_INSTRUCTIONS[tone];
  return "";
}

type ClientMessage = { role: "user" | "assistant"; content: string };

/**
 * İstemciden gelen ek (attachment) — base64 veri URL'i DEĞİL, yalın base64 string.
 * Görsel veya PDF; en son kullanıcı mesajına vision/document bloğu olarak eklenir.
 */
type ClientAttachment = {
  type: "image" | "pdf";
  mediaType: string;
  dataBase64: string;
};

/** Vision/PDF ek korumaları — izinli tipler + sayı/boyut tavanları. */
const ATTACH_CAPS = {
  /** En fazla ek sayısı (composer ile aynı tavan). */
  maxCount: 4,
  /** Görsel başına çözülmüş (decoded) maks bayt. */
  maxImageBytes: 5 * 1024 * 1024,
  /** PDF başına çözülmüş (decoded) maks bayt. */
  maxPdfBytes: 10 * 1024 * 1024,
  /** Tüm eklerin çözülmüş toplam baytı. */
  maxTotalBytes: 20 * 1024 * 1024,
} as const;

const IMAGE_MEDIA_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);
const PDF_MEDIA_TYPE = "application/pdf";

/** base64 string'in çözülmüş (decoded) bayt boyutunu hesaplar (decode etmeden). */
function base64Bytes(b64: string): number {
  const len = b64.length;
  if (len === 0) return 0;
  const padding = b64.endsWith("==") ? 2 : b64.endsWith("=") ? 1 : 0;
  return Math.floor((len * 3) / 4) - padding;
}

/**
 * İstemci eklerini doğrula + Anthropic içerik bloklarına çevir.
 * Geçersiz tip/sayı/boyut → 400/413 Türkçe yanıt (Response döner).
 * Geçerliyse content blok dizisi döner. Ek yoksa boş dizi.
 */
function buildAttachmentBlocks(
  raw: unknown,
):
  | { ok: true; blocks: Anthropic.ContentBlockParam[]; bytes: number }
  | { ok: false; response: Response } {
  if (raw == null) return { ok: true, blocks: [], bytes: 0 };
  if (!Array.isArray(raw)) {
    return {
      ok: false,
      response: new Response(JSON.stringify({ error: "Geçersiz ek biçimi." }), {
        status: 400,
        headers: { "content-type": "application/json" },
      }),
    };
  }
  if (raw.length > ATTACH_CAPS.maxCount) {
    return {
      ok: false,
      response: new Response(
        JSON.stringify({ error: `En fazla ${ATTACH_CAPS.maxCount} dosya ekleyebilirsin.` }),
        { status: 400, headers: { "content-type": "application/json" } },
      ),
    };
  }

  const blocks: Anthropic.ContentBlockParam[] = [];
  let totalBytes = 0;

  for (const item of raw as ClientAttachment[]) {
    const mediaType = typeof item?.mediaType === "string" ? item.mediaType : "";
    const data = typeof item?.dataBase64 === "string" ? item.dataBase64 : "";
    if (!data) {
      return {
        ok: false,
        response: new Response(JSON.stringify({ error: "Geçersiz ek verisi." }), {
          status: 400,
          headers: { "content-type": "application/json" },
        }),
      };
    }

    const bytes = base64Bytes(data);
    totalBytes += bytes;

    if (item?.type === "image" && IMAGE_MEDIA_TYPES.has(mediaType)) {
      if (bytes > ATTACH_CAPS.maxImageBytes) {
        return { ok: false, response: payloadTooLarge() };
      }
      blocks.push({
        type: "image",
        source: {
          type: "base64",
          media_type: mediaType as "image/png" | "image/jpeg" | "image/webp" | "image/gif",
          data,
        },
      });
    } else if (item?.type === "pdf" && mediaType === PDF_MEDIA_TYPE) {
      if (bytes > ATTACH_CAPS.maxPdfBytes) {
        return { ok: false, response: payloadTooLarge() };
      }
      blocks.push({
        type: "document",
        source: { type: "base64", media_type: "application/pdf", data },
      });
    } else {
      // İzinli olmayan tip/medya türü → reddet.
      return {
        ok: false,
        response: new Response(
          JSON.stringify({ error: "Desteklenmeyen dosya türü." }),
          { status: 400, headers: { "content-type": "application/json" } },
        ),
      };
    }
  }

  if (totalBytes > ATTACH_CAPS.maxTotalBytes) {
    return { ok: false, response: payloadTooLarge() };
  }

  return { ok: true, blocks, bytes: totalBytes };
}

/**
 * Vela AI sohbeti.
 * - Tam konuşma geçmişi gönderilir → gerçek follow-up hafıza.
 * - Tool-use döngüsü: AI piyasa verisi çeker, sonra yanıtlar.
 * - SSE streaming → kelime kelime akar (Claude UX).
 * - Prompt caching: system prompt + tool tanımları cache'lenir.
 *
 * Maliyet istismarına karşı sıra: auth → rate-limit → boyut kontrolü → AI çağrısı.
 * Anthropic client'ı YALNIZCA tüm kontroller geçtikten sonra kurulur ki
 * reddedilen istekler ücretli bir çağrı oluşturmasın.
 */
export async function POST(req: NextRequest) {
  // 1) Auth
  const userId = await requireUserId();
  if (!userId) {
    return new Response(
      JSON.stringify({ error: "Oturum gerekli" }),
      { status: 401, headers: { "content-type": "application/json" } },
    );
  }

  // 2) Rate limit (en pahalı rota — katı). Streaming başlamadan ÖNCE 429.
  const rl = rateLimit(
    rateLimitKey("chat", userId, req.headers),
    RATE_LIMITS.chat,
  );
  if (!rl.ok) {
    return tooManyRequests(rl.retryAfterSec);
  }

  // 2b) Günlük plan limiti (kredi). Free=20/gün; Pro/Unlimited sınırsız.
  // Limit aşıldıysa 402 (Payment Required) → UI upgrade modalı açar.
  const usage = await checkAndIncrement(userId, "aiChat", "aiChatsPerDay");
  if (!usage.ok) {
    return NextResponse.json(
      {
        error: "Günlük AI sohbet hakkın doldu. Sınırsız sohbet için Pro'ya yükselt.",
        code: "usage_limit",
        used: usage.used,
        limit: usage.limit,
      },
      { status: 402 },
    );
  }

  const { messages, portfolio, locale, memory, goals, brain, model, tone, attachments } =
    (await req.json()) as {
      messages: ClientMessage[];
      portfolio?: string;
      locale?: string;
      memory?: string;
      goals?: string;
      brain?: string;
      model?: string;
      tone?: string;
      attachments?: ClientAttachment[];
    };

  // Model kademesini ve tonu güvenli şekilde çöz (allowlist; aksi → varsayılan).
  // PLAN UYGULAMASI: en güçlü model (vela-1.2) yalnızca bestModel yetkili planlarda
  // (Unlimited). Yetkisiz kullanıcı vela-1.2 isterse vela-1.1'e düşürülür.
  let requestedModel = model;
  if (requestedModel === "vela-1.2") {
    const canBest = await hasFeature(userId, "bestModel");
    if (!canBest) requestedModel = "vela-1.1";
  }
  const { model: resolvedModel, maxTokens, thinkBudget } = resolveModel(requestedModel);
  const toneInstruction = resolveTone(tone);

  // PLAN UYGULAMASI: web araştırma yalnızca Pro+ planlarda. Free kullanıcıda
  // web_search aracı tool listesinden çıkarılır (sessizce; AI normal cevaplar).
  const canWebSearch = await hasFeature(userId, "webResearch");
  const activeTools = canWebSearch ? ALL_TOOLS : VELA_TOOLS;

  // 3) Boyut kontrolü — token/maliyet istismarını sınırla.
  // Son N mesajı al, her mesaj metnini kırp.
  const safeMessages: ClientMessage[] = (Array.isArray(messages) ? messages : [])
    .slice(-CHAT_CAPS.maxMessages)
    .map((m) => ({
      role: m.role,
      content: clampStr(typeof m.content === "string" ? m.content : "", CHAT_CAPS.maxMessageChars) ?? "",
    }));

  // Büyük bağlam alanlarını kırp.
  const safePortfolio = clampStr(portfolio, CHAT_CAPS.maxFieldChars);
  const safeMemory = clampStr(memory, CHAT_CAPS.maxFieldChars);
  const safeGoals = clampStr(goals, CHAT_CAPS.maxFieldChars);
  const safeBrain = clampStr(brain, CHAT_CAPS.maxFieldChars);

  // Ek (attachment) doğrulaması — boyut kontrolünün bir parçası (auth→rate→size).
  // İzinli tip/sayı/boyut değilse burada 400/413 ile reddedilir; geçerliyse
  // Anthropic image/document blokları + çözülmüş bayt toplamı döner.
  const attachResult = buildAttachmentBlocks(attachments);
  if (!attachResult.ok) {
    return attachResult.response;
  }
  const attachmentBlocks = attachResult.blocks;

  // Birleşik toplam — absürt METİN yükünü sert reddet (413). Ekler bu metin
  // tavanına KATILMAZ; onların kendi (çok daha büyük) bayt tavanı zaten
  // buildAttachmentBlocks içinde uygulanır (görsel 5MB / PDF 10MB / toplam 20MB).
  // Böylece dev bir görsel metin sınırını atlamaya çalışsa bile ayrı bayt
  // tavanına takılır — sınır atlanamaz.
  const totalChars =
    safeMessages.reduce((sum, m) => sum + m.content.length, 0) +
    (safePortfolio?.length ?? 0) +
    (safeMemory?.length ?? 0) +
    (safeGoals?.length ?? 0) +
    (safeBrain?.length ?? 0);
  if (totalChars > CHAT_CAPS.maxTotalChars) {
    return payloadTooLarge();
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ error: "ANTHROPIC_API_KEY missing" }),
      { status: 500, headers: { "content-type": "application/json" } },
    );
  }

  // 4) Tüm kontroller geçti → ücretli client'ı şimdi kur.
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  // Canlı bağlam: kullanıcının gerçek portföyü + dili (cache'lenmez, her istekte taze)
  const liveContext = [
    safePortfolio
      ? `LIVE USER PORTFOLIO (this is the user's REAL current paper portfolio — use it directly, never ask them to list holdings):\n${safePortfolio}`
      : "",
    safeMemory
      ? `LONG-TERM MEMORY (durable facts you've learned about this user across past sessions — honor these preferences/goals/constraints):\n${safeMemory}`
      : "",
    safeGoals
      ? `GOALS (the user's investing goals — the MAIN goal is your compass; every action must serve it, side goals only without harming it):\n${safeGoals}`
      : "",
    safeBrain
      ? `BRAIN (your granted authority + trust budget — respect it strictly):\n${safeBrain}`
      : "",
    locale
      ? `The user is writing in "${locale}". ALWAYS reply in the SAME language as the user's last message, from the very first word.`
      : "",
    toneInstruction,
  ]
    .filter(Boolean)
    .join("\n\n");

  // Anthropic mesaj geçmişi (tool turları burada birikecek).
  // Ekler YALNIZCA en son kullanıcı mesajına eklenir (vision/PDF tek seferlik);
  // eski mesajlar düz metin kalır. Ek yoksa davranış tamamen eskisi gibi (string).
  const lastUserIdx = (() => {
    for (let i = safeMessages.length - 1; i >= 0; i--) {
      if (safeMessages[i].role === "user") return i;
    }
    return -1;
  })();

  const convo: Anthropic.MessageParam[] = safeMessages.map((m, i) => {
    if (attachmentBlocks.length > 0 && i === lastUserIdx) {
      // Metin bloğu + görsel/document blokları (en güncel kullanıcı mesajı).
      const textBlock: Anthropic.ContentBlockParam[] = m.content
        ? [{ type: "text", text: m.content }]
        : [];
      return { role: m.role, content: [...textBlock, ...attachmentBlocks] };
    }
    return { role: m.role, content: m.content };
  });

  const encoder = new TextEncoder();

  // İstemci bağlantıyı kestiğinde döngüyü durdur + Anthropic stream'ini iptal et,
  // böylece kimsenin okumadığı bir stream için ödeme yapmaya devam etmeyiz.
  const reqSignal = req.signal;

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;
      const send = (event: string, data: unknown) => {
        if (closed) return;
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      // Web aramasında dönen kaynak linklerini topla → yanıt sonunda ekle.
      const webSources = new Map<string, string>(); // url -> title

      try {
        // Tool-use döngüsü: AI veri isterse çalıştır, tekrar sor.
        // Web search + çok adımlı veri araçları için derin akıl yürütmeye izin ver.
        let guard = 0;
        while (guard++ < 9) {
          // İstemci gittiyse pahalı çağrıya başlama.
          if (reqSignal.aborted) break;

          const msgStream = client.messages.stream(
            {
              model: resolvedModel,
              max_tokens: maxTokens,
              // Extended thinking — derin analiz için (vela-1.1/1.2). Haiku'da kapalı (hız).
              // Açıkken AI cevaptan önce adım adım muhakeme eder → çok daha doğru analiz.
              ...(thinkBudget > 0
                ? { thinking: { type: "enabled" as const, budget_tokens: thinkBudget } }
                : {}),
              system: [
                {
                  type: "text",
                  text: VELA_SYSTEM_PROMPT,
                  cache_control: { type: "ephemeral" },
                },
                ...(liveContext
                  ? [{ type: "text" as const, text: liveContext }]
                  : []),
              ],
              tools: activeTools,
              messages: convo,
            },
            // İstemci disconnect → Anthropic stream'ini iptal et (ödeme durur).
            { signal: reqSignal },
          );

          // İstemci bağlantıyı keserse aktif stream'i hemen iptal et.
          const onAbort = () => {
            try {
              msgStream.abort();
            } catch {
              /* stream zaten kapanmış olabilir */
            }
          };
          reqSignal.addEventListener("abort", onAbort, { once: true });

          let stoppedForTools = false;

          msgStream.on("text", (delta) => send("text", { delta }));
          // Extended thinking sürerken UI'a "derin analiz" sinyali (uzun sessizlik
          // yerine kullanıcı düşünüldüğünü görsün). thinking delta içeriğini SIZDIRMAYIZ.
          msgStream.on("thinking", () => send("reasoning", { active: true }));

          let final: Anthropic.Message;
          try {
            final = await msgStream.finalMessage();
          } finally {
            reqSignal.removeEventListener("abort", onAbort);
          }

          // İptal edildiyse döngüyü bırak.
          if (reqSignal.aborted) break;

          // SUNUCU araçları (web_search): Anthropic kendi yürütür ve sonucu
          // (web_search_tool_result) zaten final.content içinde döner. Bunları
          // ASLA runTool'a yönlendirme; sadece UI'a durum bildir + kaynakları topla.
          for (const block of final.content) {
            if (
              block.type === "server_tool_use" &&
              block.name === "web_search"
            ) {
              // UI "Web'de aranıyor" etiketini göstersin.
              send("tool", { name: "web_search", input: block.input });
            }
            if (block.type === "web_search_tool_result") {
              const content = block.content;
              // Hata değilse sonuç listesini gez, kaynak url/title topla.
              if (Array.isArray(content)) {
                for (const r of content) {
                  if (r.type === "web_search_result" && r.url) {
                    webSources.set(r.url, r.title || r.url);
                  }
                }
              }
            }
          }

          // Bizim CUSTOM araç çağrılarımız (runTool ile yürütülür).
          // server_tool_use bloklarını DIŞARIDA bırak — onları çalıştırmayız.
          const toolUses = final.content.filter(
            (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
          );

          if (toolUses.length > 0) {
            stoppedForTools = true;
            convo.push({ role: "assistant", content: final.content });

            const toolResults: Anthropic.ToolResultBlockParam[] = [];
            for (const tu of toolUses) {
              if (reqSignal.aborted) break;
              send("tool", { name: tu.name, input: tu.input });
              const { text, data } = await runTool(
                tu.name,
                tu.input as Record<string, unknown>,
              );
              // UI'a zengin kart verisi gönder
              send("tool_result", { name: tu.name, data });
              toolResults.push({
                type: "tool_result",
                tool_use_id: tu.id,
                content: text,
              });
            }
            if (reqSignal.aborted) break;
            convo.push({ role: "user", content: toolResults });
            // döngü tekrar dönsün → AI verilerle yanıtlasın
          } else if (final.stop_reason === "pause_turn") {
            // Sunucu aracı (web_search) yürürken model duraklayabilir → aynı
            // asistan turunu geri besleyip döngüye devam et (custom tool yok).
            stoppedForTools = true;
            convo.push({ role: "assistant", content: final.content });
          }

          if (!stoppedForTools) break;
        }

        // Web araması yapıldıysa kaynak linklerini yanıtın sonuna ekle (citations).
        if (!reqSignal.aborted && webSources.size > 0) {
          const lines = [...webSources.entries()]
            .slice(0, 6)
            .map(([url, title]) => `- [${title}](${url})`)
            .join("\n");
          send("text", { delta: `\n\n**Kaynaklar**\n${lines}` });
        }

        if (!reqSignal.aborted) send("done", {});
      } catch (e) {
        // İptal kaynaklı hataları gürültü yapma.
        if (reqSignal.aborted) {
          // sessizce kapat
        } else {
          console.error("[api/chat] stream failed:", e);
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
      // Ters proxy/nginx tampon yapmasın → SSE event'leri anında akar (üretimde
      // burst'lerin asıl sebebi proxy buffering olabilir; bu onu kapatır).
      "x-accel-buffering": "no",
    },
  });
}
