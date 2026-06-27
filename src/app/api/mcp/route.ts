// Finovela MCP Sunucusu — Model Context Protocol (Streamable HTTP / JSON-RPC 2.0).
// Claude (Desktop/web) ve diğer MCP istemcileri bu uca "remote MCP server" olarak
// bağlanıp Finovela'nın piyasa-zekâsı araçlarını kullanabilir.
//
// Bağlantı: https://finovela.com/api/mcp  (Streamable HTTP transport)
//
// SDK KULLANMADAN: MCP'nin çekirdeği JSON-RPC 2.0'dır. SDK büyük bir bağımlılık ve
// Next.js route'una sokması zahmetli; bunun yerine initialize / tools/list /
// tools/call metodlarını doğrudan implemente ediyoruz (spec-uyumlu).
//
// Araçlar şimdilik AUTH GEREKTİRMEYEN piyasa-zekâsıdır (fiyat, arama, haber, profil,
// teknik, what-if). Kullanıcıya özel araçlar (portföy/hedef/işlem) ileride kişisel
// API token ile eklenebilir — o yüzden Authorization header'ı okunur ama zorunlu değil.

import { NextRequest, NextResponse } from "next/server";
import { runTool } from "@/lib/ai/tools";
import { simulateWhatIf } from "@/lib/mcp/whatif-bridge";
import { rateLimit, rateLimitKey, RATE_LIMITS, tooManyRequests } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const maxDuration = 30;

const SERVER_INFO = { name: "finovela", version: "1.0.0" };
const PROTOCOL_VERSION = "2025-06-18";

/** MCP araç tanımları (inputSchema = JSON Schema). */
const MCP_TOOLS = [
  {
    name: "get_quote",
    description:
      "Bir veya daha fazla sembolün canlı fiyatını al (hisse, kripto, BIST, forex). Örn: AAPL, BTC, THYAO. Günlük değişim %, açılış/yüksek/düşük döner.",
    inputSchema: {
      type: "object",
      properties: {
        symbols: { type: "array", items: { type: "string" }, description: "Sembol listesi, örn ['AAPL','NVDA']" },
      },
      required: ["symbols"],
    },
  },
  {
    name: "search_symbols",
    description: "İsme veya sembole göre yatırım aracı ara (hisse/kripto/BIST). Eşleşen semboller döner.",
    inputSchema: {
      type: "object",
      properties: { query: { type: "string", description: "Arama metni, örn 'apple' veya 'NVDA'" } },
      required: ["query"],
    },
  },
  {
    name: "get_company_profile",
    description: "Bir hissenin şirket profilini al (sektör, piyasa değeri, açıklama, ülke).",
    inputSchema: {
      type: "object",
      properties: { symbol: { type: "string", description: "Hisse sembolü, örn AAPL" } },
      required: ["symbol"],
    },
  },
  {
    name: "get_news",
    description: "Genel piyasa haberleri ya da belirli bir sembolün son haberlerini al.",
    inputSchema: {
      type: "object",
      properties: { symbol: { type: "string", description: "Opsiyonel sembol; boşsa genel piyasa haberi" } },
    },
  },
  {
    name: "get_technicals",
    description: "Bir sembolün teknik göstergelerini al (RSI, hareketli ortalamalar, trend, destek/direnç).",
    inputSchema: {
      type: "object",
      properties: { symbol: { type: "string", description: "Sembol, örn AAPL" } },
      required: ["symbol"],
    },
  },
  {
    name: "get_sentiment",
    description: "Bir sembol için haber/piyasa duyarlılık özetini al (olumlu/nötr/olumsuz).",
    inputSchema: {
      type: "object",
      properties: { symbol: { type: "string", description: "Sembol, örn TSLA" } },
      required: ["symbol"],
    },
  },
  {
    name: "whatif_simulation",
    description:
      "Bir yatırım senaryosunu simüle et: belirli tutarı, belirli risk profilinde, belirli süre boyunca tut → iyimser/baz/kötümser projeksiyon (GBM modeli). Yatırım tavsiyesi DEĞİLDİR, eğitim amaçlı senaryo.",
    inputSchema: {
      type: "object",
      properties: {
        amount: { type: "number", description: "Başlangıç tutarı (USD)" },
        years: { type: "number", description: "Süre (yıl), örn 1, 5, 10" },
        risk: { type: "string", enum: ["low", "balanced", "aggressive"], description: "Risk profili" },
      },
      required: ["amount", "years", "risk"],
    },
  },
] as const;

type JsonRpcReq = { jsonrpc: "2.0"; id?: string | number | null; method: string; params?: Record<string, unknown> };

function rpcResult(id: string | number | null | undefined, result: unknown) {
  return NextResponse.json({ jsonrpc: "2.0", id: id ?? null, result });
}
function rpcError(id: string | number | null | undefined, code: number, message: string) {
  return NextResponse.json({ jsonrpc: "2.0", id: id ?? null, error: { code, message } });
}

/** Bir MCP aracını çalıştır → MCP content[] (text) sonucu döndür. */
async function callTool(name: string, args: Record<string, unknown>): Promise<{ text: string }> {
  // Market araçları mevcut runTool'a delege edilir (tek kaynak).
  if (name === "whatif_simulation") {
    const out = simulateWhatIf(Number(args.amount), Number(args.years), String(args.risk));
    return { text: JSON.stringify(out) };
  }
  // runTool'un tanıdığı isimlere eşle.
  const RUN_TOOL_NAMES = new Set([
    "get_quote",
    "search_symbols",
    "get_company_profile",
    "get_news",
    "get_technicals",
    "get_sentiment",
  ]);
  if (RUN_TOOL_NAMES.has(name)) {
    const res = await runTool(name, args);
    return { text: res.text };
  }
  throw new Error(`Bilinmeyen araç: ${name}`);
}

export async function POST(req: NextRequest) {
  // IP-bazlı rate limit (MCP anonim olabilir).
  const rl = rateLimit(rateLimitKey("mcp", null, req.headers), RATE_LIMITS.chat);
  if (!rl.ok) return tooManyRequests(rl.retryAfterSec);

  let body: JsonRpcReq;
  try {
    body = (await req.json()) as JsonRpcReq;
  } catch {
    return rpcError(null, -32700, "Parse error");
  }

  const { id, method, params } = body;

  switch (method) {
    case "initialize":
      return rpcResult(id, {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: {} },
        serverInfo: SERVER_INFO,
        instructions:
          "Finovela piyasa-zekâsı MCP sunucusu. Fiyat, arama, haber, şirket profili, teknik analiz, duyarlılık ve what-if senaryosu araçları sunar. Hiçbir çıktı yatırım tavsiyesi değildir.",
      });

    case "notifications/initialized":
      // İstemci hazır bildirimi — yanıt gerektirmez.
      return new NextResponse(null, { status: 204 });

    case "ping":
      return rpcResult(id, {});

    case "tools/list":
      return rpcResult(id, { tools: MCP_TOOLS });

    case "tools/call": {
      const toolName = (params?.name as string) ?? "";
      const args = (params?.arguments as Record<string, unknown>) ?? {};
      try {
        const out = await callTool(toolName, args);
        return rpcResult(id, { content: [{ type: "text", text: out.text }], isError: false });
      } catch (e) {
        return rpcResult(id, {
          content: [{ type: "text", text: `Hata: ${(e as Error).message}` }],
          isError: true,
        });
      }
    }

    default:
      return rpcError(id, -32601, `Method not found: ${method}`);
  }
}

// MCP keşfi için bazı istemciler GET ile yoklar — kısa bilgi döndür.
export async function GET() {
  return NextResponse.json({
    server: SERVER_INFO,
    protocol: PROTOCOL_VERSION,
    transport: "streamable-http",
    tools: MCP_TOOLS.map((t) => ({ name: t.name, description: t.description })),
    note: "POST ile JSON-RPC 2.0 (initialize / tools/list / tools/call). Yatırım tavsiyesi değildir.",
  });
}
