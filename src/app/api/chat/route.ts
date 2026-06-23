import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { VELA_SYSTEM_PROMPT } from "@/lib/ai/system-prompt";
import { VELA_TOOLS, runTool } from "@/lib/ai/tools";

export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = "claude-opus-4-8";

type ClientMessage = { role: "user" | "assistant"; content: string };

/**
 * Vela AI sohbeti.
 * - Tam konuşma geçmişi gönderilir → gerçek follow-up hafıza.
 * - Tool-use döngüsü: AI piyasa verisi çeker, sonra yanıtlar.
 * - SSE streaming → kelime kelime akar (Claude UX).
 * - Prompt caching: system prompt + tool tanımları cache'lenir.
 */
export async function POST(req: NextRequest) {
  const { messages } = (await req.json()) as { messages: ClientMessage[] };

  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ error: "ANTHROPIC_API_KEY missing" }),
      { status: 500, headers: { "content-type": "application/json" } },
    );
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  // Anthropic mesaj geçmişi (tool turları burada birikecek)
  const convo: Anthropic.MessageParam[] = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      try {
        // Tool-use döngüsü: AI veri isterse çalıştır, tekrar sor.
        let guard = 0;
        while (guard++ < 6) {
          const msgStream = client.messages.stream({
            model: MODEL,
            max_tokens: 4096,
            system: [
              {
                type: "text",
                text: VELA_SYSTEM_PROMPT,
                cache_control: { type: "ephemeral" },
              },
            ],
            tools: VELA_TOOLS,
            messages: convo,
          });

          let stoppedForTools = false;

          msgStream.on("text", (delta) => send("text", { delta }));

          const final = await msgStream.finalMessage();

          // Araç çağrısı var mı?
          const toolUses = final.content.filter(
            (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
          );

          if (toolUses.length > 0) {
            stoppedForTools = true;
            convo.push({ role: "assistant", content: final.content });

            const toolResults: Anthropic.ToolResultBlockParam[] = [];
            for (const tu of toolUses) {
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
            convo.push({ role: "user", content: toolResults });
            // döngü tekrar dönsün → AI verilerle yanıtlasın
          }

          if (!stoppedForTools) break;
        }

        send("done", {});
      } catch (e) {
        send("error", { message: String(e) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
    },
  });
}
