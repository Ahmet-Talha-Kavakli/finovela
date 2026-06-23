// Vela AI'ın çağırabileceği araçlar — gerçek piyasa verisine erişim.
// Anthropic tool-use formatı + sunucu tarafı yürütücü.

import type Anthropic from "@anthropic-ai/sdk";
import { getMarketProvider } from "@/lib/market";

export const VELA_TOOLS: Anthropic.Tool[] = [
  {
    name: "get_quote",
    description:
      "Get the live price quote for one or more stock/ETF/crypto symbols. Returns price, change, %, day range, market cap.",
    input_schema: {
      type: "object",
      properties: {
        symbols: {
          type: "array",
          items: { type: "string" },
          description: "Ticker symbols, e.g. ['NVDA','AAPL','BTC']",
        },
      },
      required: ["symbols"],
    },
  },
  {
    name: "get_company_profile",
    description:
      "Get a company/asset profile: sector, industry, market cap, shares outstanding, description.",
    input_schema: {
      type: "object",
      properties: { symbol: { type: "string" } },
      required: ["symbol"],
    },
  },
  {
    name: "get_news",
    description:
      "Get recent market news. Optionally pass a symbol for company-specific news, otherwise general market news.",
    input_schema: {
      type: "object",
      properties: { symbol: { type: "string", description: "Optional ticker" } },
      required: [],
    },
  },
  {
    name: "search_symbols",
    description: "Search the investable universe by name or ticker.",
    input_schema: {
      type: "object",
      properties: { query: { type: "string" } },
      required: ["query"],
    },
  },
];

/** Aracı sunucuda yürüt; sonucu (string) ve UI için yapısal payload döndür. */
export async function runTool(
  name: string,
  input: Record<string, unknown>,
): Promise<{ text: string; data: unknown }> {
  const provider = getMarketProvider();
  switch (name) {
    case "get_quote": {
      const symbols = (input.symbols as string[]) ?? [];
      const quotes = await provider.getQuotes(symbols.map((s) => s.toUpperCase()));
      return { text: JSON.stringify(quotes), data: { type: "quotes", quotes } };
    }
    case "get_company_profile": {
      const profile = await provider.getProfile(String(input.symbol).toUpperCase());
      return { text: JSON.stringify(profile), data: { type: "profile", profile } };
    }
    case "get_news": {
      const news = await provider.getNews(
        input.symbol ? String(input.symbol).toUpperCase() : undefined,
      );
      return { text: JSON.stringify(news.slice(0, 8)), data: { type: "news", news: news.slice(0, 8) } };
    }
    case "search_symbols": {
      const results = await provider.search(String(input.query));
      return { text: JSON.stringify(results), data: { type: "search", results } };
    }
    default:
      return { text: `Unknown tool: ${name}`, data: null };
  }
}
