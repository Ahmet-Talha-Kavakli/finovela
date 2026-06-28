import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { requireUserId } from "@/lib/current-user";
import { checkAndIncrement } from "@/lib/usage";
import { rateLimit, rateLimitKey, RATE_LIMITS, tooManyRequests } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const maxDuration = 60;

// Coach analizi dengeli tier (Sonnet) — derin ama hızlı. Chat'teki vela-1.1 ile aynı.
const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 4096;

const COACH_SYSTEM_PROMPT = `Sen Finovela Coach'sun — bir trading performans koçu.
Kullanıcının PAPER (sanal, gerçek para yok) işlemlerini analiz edersin. Görevin:
1) Performansı net özetle (kazanma oranı, ortalama kâr/zarar, en iyi/kötü işlem).
2) Davranışsal pattern'leri tespit et: aşırı işlem (overtrading), pozisyonları çok erken kapatma, FOMO alımları (hızlı ardışık alımlar), aşırı konsantrasyon / çeşitlendirme eksikliği.
3) Somut, uygulanabilir ve CESUR tavsiyeler ver — burası bir sandbox, hata yapmak bedava, o yüzden kullanıcıyı denemeye teşvik et.

TON: Türkçe, sıcak ama dürüst bir koç. Kullanıcının iyi yaptığı şeyi öv, kötü alışkanlığı yumuşatmadan ama yargılamadan söyle.
SINIR: Bu YATIRIM TAVSİYESİ DEĞİL — beceri geliştirme koçluğu. Belirli bir hisseyi "al/sat" diye yönlendirme; bunun yerine DAVRANIŞ ve SÜREÇ üzerine konuş.
BİÇİM: Markdown kullan. Kısa başlıklar (##), maddeler ve gerektiğinde **kalın** vurgu. Çok uzun olma — odaklı ve okunabilir tut.
Sana SUNUCUDA hesaplanmış metrikler verilecek; bunları yorumla, ham sayıları tekrar etme — anlam çıkar.`;

// ───────────────────────── Tipler ─────────────────────────

type Order = {
  id: string;
  ts: number;
  side: "BUY" | "SELL";
  symbol: string;
  shares: number;
  price: number;
};

type ClosedTrade = {
  symbol: string;
  shares: number;
  buyPrice: number;
  sellPrice: number;
  buyTs: number;
  sellTs: number;
  pnl: number;
  pnlPct: number;
  holdMs: number;
};

type CoachMetrics = {
  totalOrders: number;
  buyCount: number;
  sellCount: number;
  closedCount: number;
  winCount: number;
  lossCount: number;
  winRate: number | null; // 0..1, kapatılmış pozisyon yoksa null
  avgWin: number; // ortalama kâr ($, pozitif)
  avgLoss: number; // ortalama zarar ($, negatif)
  totalRealizedPnl: number;
  bestTrade: ClosedTrade | null;
  worstTrade: ClosedTrade | null;
  topSymbol: string | null; // en çok işlem gören sembol
  topSymbolCount: number;
  uniqueSymbols: number;
  concentrationPct: number | null; // topSymbol işlemlerinin tüm işlemlere oranı
  avgHoldHours: number | null; // ortalama tutma süresi (kapatılan pozisyonlar)
  spanDays: number; // ilk → son işlem aralığı (gün)
  tradesPerWeek: number | null; // işlem sıklığı
  rapidBuyClusters: number; // 5 dk içinde 3+ alım (FOMO sinyali) küme sayısı
  shortHoldCount: number; // < 1 saat tutulup kapatılan pozisyon (erken satış sinyali)
};

// ───────────────────────── Metrik hesaplama (sunucu) ─────────────────────────

/**
 * Orders'tan türev metrikleri hesapla. FIFO ile BUY/SELL eşleştirip kapatılan
 * pozisyonların kâr/zararını çıkarır. Saf fonksiyon — kolay test edilebilir.
 */
function computeMetrics(ordersInput: Order[]): CoachMetrics {
  // Zamana göre artan (en eski önce) — FIFO için.
  const orders = [...ordersInput].sort((a, b) => a.ts - b.ts);

  const buyCount = orders.filter((o) => o.side === "BUY").length;
  const sellCount = orders.filter((o) => o.side === "SELL").length;

  // FIFO lot eşleştirme — sembol başına açık alım lotları kuyruğu.
  type Lot = { shares: number; price: number; ts: number };
  const lots: Record<string, Lot[]> = {};
  const closed: ClosedTrade[] = [];

  for (const o of orders) {
    if (o.side === "BUY") {
      (lots[o.symbol] ??= []).push({ shares: o.shares, price: o.price, ts: o.ts });
    } else {
      let remaining = o.shares;
      const queue = lots[o.symbol] ?? [];
      while (remaining > 1e-9 && queue.length > 0) {
        const lot = queue[0];
        const matched = Math.min(lot.shares, remaining);
        const pnl = +(matched * (o.price - lot.price)).toFixed(2);
        const cost = matched * lot.price;
        closed.push({
          symbol: o.symbol,
          shares: +matched.toFixed(6),
          buyPrice: lot.price,
          sellPrice: o.price,
          buyTs: lot.ts,
          sellTs: o.ts,
          pnl,
          pnlPct: cost > 0 ? +((pnl / cost) * 100).toFixed(2) : 0,
          holdMs: Math.max(0, o.ts - lot.ts),
        });
        lot.shares = +(lot.shares - matched).toFixed(6);
        remaining = +(remaining - matched).toFixed(6);
        if (lot.shares <= 1e-9) queue.shift();
      }
      // Eşleşmeyen satış (açık lot yok) — yok say (paper'da olmamalı).
    }
  }

  const wins = closed.filter((c) => c.pnl > 0);
  const losses = closed.filter((c) => c.pnl < 0);
  const closedCount = closed.length;

  const avgWin = wins.length ? +(wins.reduce((s, c) => s + c.pnl, 0) / wins.length).toFixed(2) : 0;
  const avgLoss = losses.length
    ? +(losses.reduce((s, c) => s + c.pnl, 0) / losses.length).toFixed(2)
    : 0;
  const totalRealizedPnl = +closed.reduce((s, c) => s + c.pnl, 0).toFixed(2);

  const bestTrade = closed.length
    ? closed.reduce((best, c) => (c.pnl > best.pnl ? c : best), closed[0])
    : null;
  const worstTrade = closed.length
    ? closed.reduce((worst, c) => (c.pnl < worst.pnl ? c : worst), closed[0])
    : null;

  // Sembol frekansı.
  const bySymbol: Record<string, number> = {};
  for (const o of orders) bySymbol[o.symbol] = (bySymbol[o.symbol] ?? 0) + 1;
  const symbolEntries = Object.entries(bySymbol).sort((a, b) => b[1] - a[1]);
  const topSymbol = symbolEntries[0]?.[0] ?? null;
  const topSymbolCount = symbolEntries[0]?.[1] ?? 0;
  const uniqueSymbols = symbolEntries.length;
  const concentrationPct =
    orders.length > 0 && topSymbol ? +((topSymbolCount / orders.length) * 100).toFixed(1) : null;

  // İşlem aralığı + sıklık.
  const firstTs = orders[0]?.ts ?? 0;
  const lastTs = orders[orders.length - 1]?.ts ?? 0;
  const spanMs = Math.max(0, lastTs - firstTs);
  const spanDays = +(spanMs / 86_400_000).toFixed(1);
  const tradesPerWeek =
    spanDays >= 1 ? +((orders.length / spanDays) * 7).toFixed(1) : orders.length > 1 ? orders.length : null;

  // FOMO sinyali: 5 dk pencerede 3+ ALIM kümesi.
  const FIVE_MIN = 5 * 60 * 1000;
  const buyTs = orders.filter((o) => o.side === "BUY").map((o) => o.ts).sort((a, b) => a - b);
  let rapidBuyClusters = 0;
  let cstart = 0;
  for (let i = 0; i < buyTs.length; i++) {
    while (buyTs[i] - buyTs[cstart] > FIVE_MIN) cstart++;
    if (i - cstart + 1 >= 3) {
      rapidBuyClusters++;
      cstart = i + 1; // aynı kümeyi tekrar sayma
    }
  }

  // Erken satış sinyali: < 1 saat tutulup kapatılan pozisyon sayısı.
  const ONE_HOUR = 60 * 60 * 1000;
  const shortHoldCount = closed.filter((c) => c.holdMs < ONE_HOUR).length;
  const avgHoldHours = closed.length
    ? +(closed.reduce((s, c) => s + c.holdMs, 0) / closed.length / ONE_HOUR).toFixed(1)
    : null;

  return {
    totalOrders: orders.length,
    buyCount,
    sellCount,
    closedCount,
    winCount: wins.length,
    lossCount: losses.length,
    winRate: closedCount > 0 ? +(wins.length / closedCount).toFixed(4) : null,
    avgWin,
    avgLoss,
    totalRealizedPnl,
    bestTrade,
    worstTrade,
    topSymbol,
    topSymbolCount,
    uniqueSymbols,
    concentrationPct,
    avgHoldHours,
    spanDays,
    tradesPerWeek,
    rapidBuyClusters,
    shortHoldCount,
  };
}

/** Metrikleri AI'ın okuyacağı kısa, etiketli Türkçe özet metnine çevir. */
function metricsToPrompt(m: CoachMetrics): string {
  const fmtPnl = (n: number) => `${n >= 0 ? "+" : ""}$${n.toFixed(2)}`;
  const lines: string[] = [];
  lines.push(`Toplam emir: ${m.totalOrders} (${m.buyCount} alış, ${m.sellCount} satış)`);
  lines.push(`Kapatılan pozisyon (FIFO eşleşmiş): ${m.closedCount}`);
  if (m.winRate != null) {
    lines.push(
      `Kazanma oranı: %${(m.winRate * 100).toFixed(0)} (${m.winCount} kazanan, ${m.lossCount} kaybeden)`,
    );
    lines.push(`Ortalama kazanç: ${fmtPnl(m.avgWin)} | Ortalama zarar: ${fmtPnl(m.avgLoss)}`);
    lines.push(`Toplam gerçekleşen K/Z: ${fmtPnl(m.totalRealizedPnl)}`);
  } else {
    lines.push("Henüz kapatılmış pozisyon yok (sadece açık alımlar var).");
  }
  if (m.bestTrade) {
    lines.push(
      `En iyi işlem: ${m.bestTrade.symbol} ${fmtPnl(m.bestTrade.pnl)} (%${m.bestTrade.pnlPct})`,
    );
  }
  if (m.worstTrade && m.worstTrade !== m.bestTrade) {
    lines.push(
      `En kötü işlem: ${m.worstTrade.symbol} ${fmtPnl(m.worstTrade.pnl)} (%${m.worstTrade.pnlPct})`,
    );
  }
  if (m.topSymbol) {
    lines.push(
      `En çok işlem gören sembol: ${m.topSymbol} (${m.topSymbolCount} emir, tüm emirlerin %${m.concentrationPct})`,
    );
  }
  lines.push(`Farklı sembol sayısı (çeşitlilik): ${m.uniqueSymbols}`);
  if (m.avgHoldHours != null) lines.push(`Ortalama tutma süresi: ${m.avgHoldHours} saat`);
  if (m.spanDays >= 1) lines.push(`İşlem aralığı: ${m.spanDays} gün`);
  if (m.tradesPerWeek != null) lines.push(`Tahmini işlem sıklığı: haftada ~${m.tradesPerWeek} işlem`);
  lines.push(`FOMO sinyali (5 dk içinde 3+ alım kümesi): ${m.rapidBuyClusters} kez`);
  lines.push(`Erken satış sinyali (<1 saat tutulup kapatılan): ${m.shortHoldCount} pozisyon`);
  return lines.join("\n");
}

/** Ham emir özeti (en fazla son 60 emir) — AI'a bağlam için. */
function ordersDigest(orders: Order[]): string {
  const recent = [...orders].sort((a, b) => b.ts - a.ts).slice(0, 60);
  return recent
    .map((o) => {
      const d = new Date(o.ts).toISOString().slice(0, 16).replace("T", " ");
      return `${d} ${o.side} ${o.shares} ${o.symbol} @ $${o.price}`;
    })
    .join("\n");
}

// ───────────────────────── İstemci girdi koruması ─────────────────────────

const MAX_ORDERS = 2000;

function sanitizeOrders(raw: unknown): Order[] {
  if (!Array.isArray(raw)) return [];
  const out: Order[] = [];
  for (const r of raw.slice(0, MAX_ORDERS)) {
    if (!r || typeof r !== "object") continue;
    const o = r as Record<string, unknown>;
    const side = o.side === "BUY" || o.side === "SELL" ? o.side : null;
    const symbol = typeof o.symbol === "string" ? o.symbol.slice(0, 24) : null;
    const shares = typeof o.shares === "number" && isFinite(o.shares) && o.shares > 0 ? o.shares : null;
    const price = typeof o.price === "number" && isFinite(o.price) && o.price >= 0 ? o.price : null;
    const ts = typeof o.ts === "number" && isFinite(o.ts) ? o.ts : null;
    if (!side || !symbol || shares == null || price == null || ts == null) continue;
    out.push({
      id: typeof o.id === "string" ? o.id.slice(0, 64) : `${ts}_${symbol}`,
      ts,
      side,
      symbol,
      shares,
      price,
    });
  }
  return out;
}

// ───────────────────────── Route ─────────────────────────

export async function POST(req: NextRequest) {
  // 1) Auth
  const userId = await requireUserId();
  if (!userId) {
    return new Response(JSON.stringify({ error: "Oturum gerekli" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  // 2) Rate limit — chat ile aynı katı limit (pahalı AI rotası).
  const rl = rateLimit(rateLimitKey("coach", userId, req.headers), RATE_LIMITS.chat);
  if (!rl.ok) {
    return tooManyRequests(rl.retryAfterSec);
  }

  const body = (await req.json().catch(() => ({}))) as { orders?: unknown };
  const orders = sanitizeOrders(body.orders);

  // 0 işlem → AI çağırma, nazik mesaj döndür (boş/az veri graceful).
  if (orders.length === 0) {
    return NextResponse.json({
      empty: true,
      message: "Henüz işlem yok. Birkaç paper işlem yap, sonra koçun seni analiz etsin.",
    });
  }

  // 3) Günlük plan limiti (kredi) — chat ile aynı havuz (aiChat).
  const usage = await checkAndIncrement(userId, "aiChat", "aiChatsPerDay");
  if (!usage.ok) {
    return NextResponse.json(
      {
        error: "Günlük AI hakkın doldu. Sınırsız analiz için Pro'ya yükselt.",
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

  // 4) Metrikleri SUNUCUDA hesapla.
  const metrics = computeMetrics(orders);
  const userPrompt = [
    "Aşağıda kullanıcının paper işlem performans metrikleri ve son emir özeti var. Bunları analiz et.",
    "",
    "## HESAPLANMIŞ METRİKLER",
    metricsToPrompt(metrics),
    "",
    "## SON EMİRLER (en yeni önce)",
    ordersDigest(orders),
    "",
    "Şimdi performansı yorumla, davranışsal pattern'leri tespit et ve somut + cesur tavsiyeler ver.",
  ].join("\n");

  // 5) Kontroller geçti → ücretli client'ı şimdi kur.
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
            thinking: { type: "enabled", budget_tokens: 1600 },
            system: [
              { type: "text", text: COACH_SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
            ],
            messages: [{ role: "user", content: userPrompt }],
          },
          { signal: reqSignal },
        );

        const onAbort = () => {
          try {
            msgStream.abort();
          } catch {
            /* stream zaten kapanmış olabilir */
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
        if (reqSignal.aborted) {
          // sessizce kapat
        } else {
          console.error("[api/coach] stream failed:", e);
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
