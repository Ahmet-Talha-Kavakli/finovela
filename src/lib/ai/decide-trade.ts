// Finovela AI karar katmanı — bir otomasyon kuralı + canlı piyasa + portföy
// bağlamı verilince "al / sat / bekle" kararını GEREKÇESİYLE üretir.
// Zorunlu tool-call ile yapılandırılmış çıktı (serbest metin değil) → motor güvenle tüketir.
//
// SADECE karar üretir; yürütmeyi yapmaz. Yürütme Brain güvencesinden geçer
// (src/app/api/exchange/execute). Bu ayrım: AI önerir, Brain sınırlar, kullanıcı yetkilendirir.

import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-opus-4-8";

export type TradeDecision = {
  action: "buy" | "sell" | "hold";
  symbol: string;
  sizePct: number; // portföyün yüzdesi (0..100); hold ise 0
  confidence: number; // 0..1
  rationale: string; // kısa Türkçe gerekçe
};

export type DecideContext = {
  rule: string; // kullanıcının doğal-dil otomasyon kuralı
  symbol: string;
  price: number;
  changePct: number; // günlük % değişim
  portfolioValueUsd: number;
  currentPositionUsd: number; // bu varlıktaki mevcut değer
  cashUsd: number;
};

const DECISION_TOOL: Anthropic.Tool = {
  name: "submit_trade_decision",
  description:
    "Otomasyon kuralı ve piyasa bağlamına göre işlem kararını gönder. Her zaman bu aracı çağır.",
  input_schema: {
    type: "object",
    properties: {
      action: { type: "string", enum: ["buy", "sell", "hold"] },
      symbol: { type: "string" },
      sizePct: { type: "number", description: "Portföyün yüzdesi (0-100). hold ise 0." },
      confidence: { type: "number", description: "0 ile 1 arası güven." },
      rationale: { type: "string", description: "Kısa Türkçe gerekçe (1-2 cümle)." },
    },
    required: ["action", "symbol", "sizePct", "confidence", "rationale"],
  },
};

const SYSTEM = `Sen Finovela'nın otonom işlem karar motorusun. Görevin: verilen otomasyon kuralını ve canlı piyasa bağlamını değerlendirip TEK bir işlem kararı vermek.
Kurallar:
- Yalnızca submit_trade_decision aracını çağırarak yanıt ver.
- Kural koşulları karşılanmıyorsa action="hold" ver.
- Riskli/belirsiz durumda temkinli ol; emin değilsen "hold" veya düşük sizePct.
- sizePct portföyün makul bir yüzdesi olsun (genelde 1-10). Asla %100 önerme.
- Gerekçe kısa, net ve Türkçe olsun. Yatırım tavsiyesi vermiyorsun; kuralı uyguluyorsun.`;

export async function decideTrade(ctx: DecideContext): Promise<TradeDecision> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // Üretimde sessiz "hold" yanıltıcı (otomasyon sessizce devre dışı kalır) →
    // açık hata fırlat, route 5xx döndürsün. Geliştirmede güvenli hold.
    if (process.env.NODE_ENV === "production") {
      throw new Error("ANTHROPIC_API_KEY yapılandırılmamış — AI kararı üretilemez.");
    }
    return { action: "hold", symbol: ctx.symbol, sizePct: 0, confidence: 0, rationale: "AI yapılandırılmamış (dev)." };
  }
  const client = new Anthropic({ apiKey });

  const user = `Otomasyon kuralı: "${ctx.rule}"

Canlı bağlam:
- Sembol: ${ctx.symbol}
- Fiyat: $${ctx.price}
- Günlük değişim: ${ctx.changePct.toFixed(2)}%
- Portföy değeri: $${ctx.portfolioValueUsd.toFixed(2)}
- Bu varlıktaki mevcut pozisyon: $${ctx.currentPositionUsd.toFixed(2)}
- Nakit: $${ctx.cashUsd.toFixed(2)}

Bu kurala göre şimdi ne yapılmalı? Kararını submit_trade_decision ile gönder.`;

  const resp = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: SYSTEM,
    tools: [DECISION_TOOL],
    tool_choice: { type: "tool", name: "submit_trade_decision" },
    messages: [{ role: "user", content: user }],
  });

  const toolUse = resp.content.find((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");
  if (!toolUse) {
    return { action: "hold", symbol: ctx.symbol, sizePct: 0, confidence: 0, rationale: "Karar üretilemedi." };
  }
  const d = toolUse.input as Partial<TradeDecision>;
  return {
    action: d.action === "buy" || d.action === "sell" ? d.action : "hold",
    symbol: (d.symbol ?? ctx.symbol).toUpperCase(),
    sizePct: clamp(Number(d.sizePct) || 0, 0, 100),
    confidence: clamp(Number(d.confidence) || 0, 0, 1),
    rationale: typeof d.rationale === "string" ? d.rationale : "—",
  };
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}
