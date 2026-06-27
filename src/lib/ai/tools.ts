// Vela AI'ın çağırabileceği araçlar — gerçek piyasa verisine erişim.
// Anthropic tool-use formatı + sunucu tarafı yürütücü.

import type Anthropic from "@anthropic-ai/sdk";
import { getMarketProvider } from "@/lib/market";
import { sentimentScore, analystConsensus } from "@/lib/dashboard/sentiment";
import { rsi, ema, sma, macd, bollinger, atr } from "@/lib/dashboard/indicators";
import { runMonteCarlo } from "@/lib/dashboard/whatif";
import { computeVelaScore } from "@/lib/dashboard/vela-score";
import { getUniverseEntry } from "@/lib/market/universe";

export const VELA_TOOLS: Anthropic.Tool[] = [
  {
    name: "get_quote",
    description:
      "Get the live price quote for one or more symbols across ALL asset classes: US stocks/ETFs (NVDA, SPY), BIST Turkish stocks (THYAO, ASELS, GARAN — priced in TRY), crypto (BTC, ETH, XRP, DOGE), forex (USDTRY, EURUSD, GBPUSD), metals (GRAMALTIN gram gold in TRY, XAUUSD, XAGUSD), commodities (WTI, BRENT). Returns price, change %, day range, and the instrument's currency.",
    input_schema: {
      type: "object",
      properties: {
        symbols: {
          type: "array",
          items: { type: "string" },
          description: "Symbols, e.g. ['NVDA','BTC','THYAO','USDTRY','GRAMALTIN']",
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
  {
    name: "propose_order",
    description:
      "Propose a paper-trade order for the user to confirm. Use when the user asks to buy or sell. ALWAYS call get_quote first so the price is REAL. The UI renders a confirmable order card; the user must tap Confirm — you never execute silently. For a dollar amount, compute shares = amount / price (fractional is fine).",
    input_schema: {
      type: "object",
      properties: {
        side: { type: "string", enum: ["BUY", "SELL"] },
        symbol: { type: "string", description: "Ticker, e.g. TSLA" },
        shares: { type: "number", description: "Number of shares (may be fractional)" },
        price: { type: "number", description: "Live price per share you fetched via get_quote" },
        stop: { type: "number", description: "Optional protective stop-loss price" },
        rationale: { type: "string", description: "One short sentence on why" },
      },
      required: ["side", "symbol", "shares", "price"],
    },
  },
  // ---- AGENT TOOLS — Vela ürünün her yerinde iş yapar (client-action) ----
  {
    name: "add_to_watchlist",
    description: "Add one or more symbols to the user's watchlist. Use when they ask to watch/track/follow a stock.",
    input_schema: {
      type: "object",
      properties: { symbols: { type: "array", items: { type: "string" } } },
      required: ["symbols"],
    },
  },
  {
    name: "remove_from_watchlist",
    description: "Remove symbols from the user's watchlist.",
    input_schema: {
      type: "object",
      properties: { symbols: { type: "array", items: { type: "string" } } },
      required: ["symbols"],
    },
  },
  {
    name: "create_automation",
    description:
      "Create an always-on automation agent from a plain-language rule (recurring buys, rebalancing, stop-losses, cash sweeps, indicator triggers). Use when the user wants something to happen automatically. The UI shows a confirmable automation card.",
    input_schema: {
      type: "object",
      properties: {
        rule: { type: "string", description: "The rule in plain English, e.g. 'Buy $200 of QQQ every Friday'" },
        name: { type: "string", description: "Short name for the agent" },
      },
      required: ["rule"],
    },
  },
  {
    name: "rebalance_portfolio",
    description:
      "Propose a rebalance plan: a set of BUY/SELL paper orders to move the portfolio toward target weights. Use when the user asks to rebalance, trim, diversify, or reduce concentration. Get live quotes first so prices are real. The UI shows ONE confirmable card with all legs; the user taps Confirm to execute them all.",
    input_schema: {
      type: "object",
      properties: {
        summary: { type: "string", description: "One sentence describing the goal of this rebalance" },
        orders: {
          type: "array",
          description: "The legs of the rebalance",
          items: {
            type: "object",
            properties: {
              side: { type: "string", enum: ["BUY", "SELL"] },
              symbol: { type: "string" },
              shares: { type: "number" },
              price: { type: "number", description: "Live price you fetched" },
            },
            required: ["side", "symbol", "shares", "price"],
          },
        },
      },
      required: ["orders"],
    },
  },
  {
    name: "start_copy",
    description:
      "Start copy-trading a leaderboard investor. Use when the user wants to copy/follow a trader. Valid handles include quantsarah, valuevik, momentummax, steadyamy, cryptojay, incomeian.",
    input_schema: {
      type: "object",
      properties: {
        handle: { type: "string", description: "Trader handle without @, e.g. momentummax" },
        amount: { type: "number", description: "Optional copy amount in USD" },
      },
      required: ["handle"],
    },
  },
  {
    name: "deploy_strategy",
    description:
      "Deploy/activate a strategy as a live paper automation. Use when the user wants to run a strategy they discussed.",
    input_schema: {
      type: "object",
      properties: { name: { type: "string", description: "Strategy name" } },
      required: ["name"],
    },
  },
  {
    name: "create_alert",
    description:
      "Create a price alert. Use when the user wants to be notified when a stock hits a price (e.g. 'tell me when NVDA passes 220'). It activates immediately.",
    input_schema: {
      type: "object",
      properties: {
        symbol: { type: "string" },
        condition: { type: "string", enum: ["above", "below"] },
        price: { type: "number" },
      },
      required: ["symbol", "condition", "price"],
    },
  },
  {
    name: "get_sentiment",
    description:
      "Get the market sentiment + Wall Street analyst consensus for a stock: a bullish/neutral/bearish score blended from social chatter, news tone, and analyst ratings, plus the buy/hold/sell breakdown and average price target. Use when the user asks 'what's the sentiment on X', 'are people bullish on X', or 'what do analysts think of X'.",
    input_schema: {
      type: "object",
      properties: { symbol: { type: "string" } },
      required: ["symbol"],
    },
  },
  {
    name: "get_technicals",
    description:
      "Get a full technical-analysis snapshot for a symbol computed from real daily candles: RSI(14), MACD(12/26/9) with signal & histogram, Bollinger Bands(20,2), ATR(14), EMA(20/50/200), SMA(50/200), plus a plain-language read (overbought/oversold, MACD bullish/bearish cross, trend vs moving averages, Bollinger position, volatility). Use whenever the user asks about momentum, RSI/MACD/Bollinger/ATR, whether something is overbought/oversold, a technical setup, or an entry/exit timing question.",
    input_schema: {
      type: "object",
      properties: { symbol: { type: "string", description: "Any symbol (NVDA, BTC, THYAO…)" } },
      required: ["symbol"],
    },
  },
  {
    name: "get_vela_score",
    description:
      "Get the Finovela Score — a single 0-100 health score for a symbol blending momentum, trend (moving-average alignment), sentiment, analyst upside, and valuation, with a letter grade (A-F) and the factor breakdown. Use when the user asks 'how healthy/strong is X', 'should I keep X', 'rate this stock', or to justify keeping/trimming a holding with one number plus the reasons behind it.",
    input_schema: {
      type: "object",
      properties: { symbol: { type: "string" } },
      required: ["symbol"],
    },
  },
  {
    name: "whatif_simulation",
    description:
      "Run a Monte Carlo 'what-if' projection BEFORE the user commits to a decision. Given a starting value and a horizon (days), it simulates thousands of paths and returns optimistic / base / pessimistic outcomes with probabilities. Optionally pass an annual drift and volatility, or a symbol to derive volatility from its candles. Use when the user asks 'what happens if I invest X', 'where could my portfolio be in a year', 'best/worst case', or wants to compare a decision's outcomes.",
    input_schema: {
      type: "object",
      properties: {
        startValue: { type: "number", description: "Starting portfolio/position value" },
        horizonDays: { type: "number", description: "Projection horizon in days (e.g. 30, 365)" },
        symbol: { type: "string", description: "Optional — derive volatility from this symbol's candles" },
        annualReturnPct: { type: "number", description: "Optional expected annual return % (drift)" },
        annualVolPct: { type: "number", description: "Optional annual volatility % (stdev)" },
      },
      required: ["startValue", "horizonDays"],
    },
  },
  {
    name: "remember_fact",
    description:
      "Save a durable fact about the user to long-term memory (persists across all future chats). Use when the user states a lasting preference, goal, constraint, or risk tolerance — e.g. 'I never want to hold crypto', 'I'm saving for a house in 3 years', 'keep me under 50% tech'. Do NOT save transient or one-off requests.",
    input_schema: {
      type: "object",
      properties: { fact: { type: "string", description: "The durable fact, concise, third-person." } },
      required: ["fact"],
    },
  },
  {
    name: "navigate",
    description:
      "Take the user to a page in the Finovela app. Use when they ask to open/go to a section. Valid pages: overview, chat, portfolio, analytics, markets, portfolios, generated, options, bonds, earn, tax, strategy, automation, alerts, copy, feed, research, earnings, settings, or a stock page via stock:SYMBOL.",
    input_schema: {
      type: "object",
      properties: { page: { type: "string", description: "Page key or 'stock:NVDA'" } },
      required: ["page"],
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
    case "propose_order": {
      const order = {
        side: String(input.side).toUpperCase(),
        symbol: String(input.symbol).toUpperCase(),
        shares: Number(input.shares),
        price: Number(input.price),
        stop: input.stop != null ? Number(input.stop) : undefined,
        rationale: input.rationale ? String(input.rationale) : undefined,
      };
      return {
        text: `Proposed ${order.side} ${order.shares} ${order.symbol} @ $${order.price} (awaiting user confirmation).`,
        data: { type: "order", order },
      };
    }
    case "add_to_watchlist": {
      const symbols = ((input.symbols as string[]) ?? []).map((s) => s.toUpperCase());
      return {
        text: `Added ${symbols.join(", ")} to the watchlist.`,
        data: { type: "action", action: "watchlist_add", symbols },
      };
    }
    case "remove_from_watchlist": {
      const symbols = ((input.symbols as string[]) ?? []).map((s) => s.toUpperCase());
      return {
        text: `Removed ${symbols.join(", ")} from the watchlist.`,
        data: { type: "action", action: "watchlist_remove", symbols },
      };
    }
    case "create_automation": {
      const rule = String(input.rule);
      const agentName = input.name ? String(input.name) : undefined;
      return {
        text: `Prepared automation: "${rule}" (awaiting user confirmation).`,
        data: { type: "automation", rule, name: agentName },
      };
    }
    case "rebalance_portfolio": {
      const orders = ((input.orders as Record<string, unknown>[]) ?? []).map((o) => ({
        side: String(o.side).toUpperCase() === "SELL" ? "SELL" : "BUY",
        symbol: String(o.symbol).toUpperCase(),
        shares: Number(o.shares),
        price: Number(o.price),
      }));
      return {
        text: `Prepared a rebalance plan with ${orders.length} order(s) (awaiting user confirmation).`,
        data: { type: "rebalance", summary: input.summary ? String(input.summary) : "", orders },
      };
    }
    case "start_copy": {
      const handle = String(input.handle).replace("@", "").toLowerCase();
      return {
        text: `Opening copy setup for @${handle}${input.amount ? ` with $${input.amount}` : ""}.`,
        data: { type: "action", action: "navigate", page: `copy/${handle}` },
      };
    }
    case "deploy_strategy": {
      const sname = String(input.name);
      return {
        text: `"${sname}" stratejisi demo otomasyon olarak devreye alınmaya hazır.`,
        data: { type: "automation", rule: `Stratejiyi uygula: ${sname}`, name: sname },
      };
    }
    case "create_alert": {
      const alert = {
        symbol: String(input.symbol).toUpperCase(),
        condition: String(input.condition) === "below" ? "below" : "above",
        price: Number(input.price),
      };
      return {
        text: `Created alert: ${alert.symbol} ${alert.condition} $${alert.price}.`,
        data: { type: "action", action: "create_alert", ...alert },
      };
    }
    case "get_sentiment": {
      const symbol = String(input.symbol).toUpperCase();
      const s = sentimentScore(symbol);
      const a = analystConsensus(symbol);
      return {
        text: JSON.stringify({ symbol, sentiment: s, analyst: a }),
        data: { type: "sentiment", symbol, sentiment: s, analyst: a },
      };
    }
    case "get_technicals": {
      const symbol = String(input.symbol).toUpperCase();
      const now = Math.floor(Date.now() / 1000);
      const from = now - 60 * 60 * 24 * 400; // ~400 gün (200-SMA için yeterli)
      let candles: { close: number; high: number; low: number }[] = [];
      try {
        candles = await provider.getCandles(symbol, "D", from, now);
      } catch {
        candles = [];
      }
      if (candles.length < 30) {
        return {
          text: JSON.stringify({ symbol, error: "yetersiz veri" }),
          data: { type: "technicals", symbol, error: "Bu sembol için yeterli geçmiş veri yok." },
        };
      }
      const closes = candles.map((c) => c.close);
      const highs = candles.map((c) => c.high);
      const lows = candles.map((c) => c.low);
      const last = closes[closes.length - 1];
      const rsiVal = rsi(closes);
      const macdVal = macd(closes);
      const bb = bollinger(closes);
      const atrVal = atr(highs, lows, closes);
      const ema20 = ema(closes, 20);
      const ema50 = ema(closes, 50);
      const ema200 = ema(closes, 200);
      const sma50 = sma(closes, 50);
      const sma200 = sma(closes, 200);

      // Düz-dil okuma.
      const reads: string[] = [];
      if (rsiVal != null) {
        if (rsiVal >= 70) reads.push(`RSI ${rsiVal} — aşırı alım bölgesi`);
        else if (rsiVal <= 30) reads.push(`RSI ${rsiVal} — aşırı satım bölgesi`);
        else reads.push(`RSI ${rsiVal} — nötr`);
      }
      if (macdVal) {
        reads.push(
          macdVal.histogram > 0
            ? `MACD pozitif (histogram ${macdVal.histogram}) — yükseliş ivmesi`
            : `MACD negatif (histogram ${macdVal.histogram}) — düşüş ivmesi`,
        );
      }
      if (ema50 != null && ema200 != null) {
        reads.push(
          ema50 > ema200
            ? "Altın kesişim eğilimi (EMA50 > EMA200) — uzun vade yükseliş"
            : "Ölüm kesişimi eğilimi (EMA50 < EMA200) — uzun vade zayıf",
        );
      }
      if (bb && last) {
        if (last >= bb.upper) reads.push("Fiyat üst Bollinger bandında — gergin/aşırı uzanmış");
        else if (last <= bb.lower) reads.push("Fiyat alt Bollinger bandında — sıkışmış/ucuz");
      }
      const snap = {
        symbol,
        price: last,
        rsi: rsiVal,
        macd: macdVal,
        bollinger: bb,
        atr: atrVal,
        ema: { ema20, ema50, ema200 },
        sma: { sma50, sma200 },
        read: reads,
      };
      return { text: JSON.stringify(snap), data: { type: "technicals", ...snap } };
    }
    case "get_vela_score": {
      const symbol = String(input.symbol).toUpperCase();
      const now = Math.floor(Date.now() / 1000);
      const from = now - 60 * 60 * 24 * 400;
      let closes: number[] = [];
      try {
        const candles = await provider.getCandles(symbol, "D", from, now);
        closes = candles.map((c) => c.close);
      } catch {
        closes = [];
      }
      const basePrice = getUniverseEntry(symbol).basePrice;
      const result = computeVelaScore(symbol, { closes, basePrice });
      return { text: JSON.stringify(result), data: { type: "vela_score", ...result } };
    }
    case "whatif_simulation": {
      const startValue = Number(input.startValue) || 0;
      const horizonDays = Math.max(1, Math.round(Number(input.horizonDays) || 30));
      let annualVol = input.annualVolPct != null ? Number(input.annualVolPct) / 100 : undefined;
      let annualRet = input.annualReturnPct != null ? Number(input.annualReturnPct) / 100 : undefined;

      // Sembol verildiyse volatiliteyi candle'lardan türet.
      if (input.symbol && annualVol == null) {
        try {
          const now = Math.floor(Date.now() / 1000);
          const from = now - 60 * 60 * 24 * 200;
          const candles = await provider.getCandles(String(input.symbol).toUpperCase(), "D", from, now);
          const closes = candles.map((c) => c.close);
          if (closes.length > 20) {
            const rets: number[] = [];
            for (let i = 1; i < closes.length; i++) rets.push(closes[i] / closes[i - 1] - 1);
            const mean = rets.reduce((a, b) => a + b, 0) / rets.length;
            const variance = rets.reduce((a, b) => a + (b - mean) * (b - mean), 0) / rets.length;
            annualVol = Math.sqrt(variance) * Math.sqrt(252);
            if (annualRet == null) annualRet = mean * 252;
          }
        } catch {
          /* fallback aşağıda */
        }
      }
      const result = runMonteCarlo({
        startValue,
        horizonDays,
        annualReturn: annualRet ?? 0.08,
        annualVol: annualVol ?? 0.2,
      });
      return { text: JSON.stringify(result), data: { type: "whatif", ...result } };
    }
    case "remember_fact": {
      const fact = String(input.fact);
      return {
        text: `Saved to memory: "${fact}".`,
        data: { type: "action", action: "remember", fact },
      };
    }
    case "navigate": {
      return {
        text: `Navigating to ${String(input.page)}.`,
        data: { type: "action", action: "navigate", page: String(input.page) },
      };
    }
    default:
      return { text: `Unknown tool: ${name}`, data: null };
  }
}
