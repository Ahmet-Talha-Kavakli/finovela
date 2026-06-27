import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { requireUserId } from "@/lib/current-user";
import { rateLimit, rateLimitKey, RATE_LIMITS, tooManyRequests } from "@/lib/ratelimit";
import { clampStr } from "@/lib/ai-guard";

export const runtime = "nodejs";

/** Sohbet için kısa başlık üretir (ucuz, Haiku). İlk değişimden sonra 1 kez çağrılır. */
export async function POST(req: NextRequest) {
  // Sıra: auth → rate-limit → boyut kontrolü → AI çağrısı.
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "Oturum gerekli" }, { status: 401 });
  }
  const rl = rateLimit(
    rateLimitKey("chat-title", userId, req.headers),
    RATE_LIMITS.chatTitle,
  );
  if (!rl.ok) {
    return tooManyRequests(rl.retryAfterSec);
  }

  const body = (await req.json()) as { user?: string; assistant?: string };
  // Girdi boyutunu sınırla (başlık üretimi için 2k yeterli fazlasıyla).
  const user = clampStr(typeof body.user === "string" ? body.user : "", 2_000) ?? "";
  const assistant = clampStr(body.assistant, 2_000);
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ title: user.slice(0, 40) });
  }
  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 24,
      system:
        "Generate a 3-5 word title for this investing chat. Same language as the user. No quotes, no period, Title Case. Output ONLY the title.",
      messages: [
        { role: "user", content: `User: ${user}\n${assistant ? `Assistant: ${assistant.slice(0, 300)}` : ""}` },
      ],
    });
    const block = msg.content.find((b) => b.type === "text");
    const title = block && block.type === "text" ? block.text.trim().replace(/^["']|["']$/g, "") : user.slice(0, 40);
    return NextResponse.json({ title: title.slice(0, 48) });
  } catch {
    return NextResponse.json({ title: user.slice(0, 40) });
  }
}
