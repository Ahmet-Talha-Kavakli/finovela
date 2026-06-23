// Sağlayıcı seçici — MARKET_PROVIDER env'ine göre mock ya da finnhub.
// Frontend/route'lar yalnızca `marketProvider`'ı import eder.

import type { MarketProvider } from "./types";
import { MockProvider } from "./mock-provider";
import { FinnhubProvider } from "./finnhub-provider";

let _provider: MarketProvider | null = null;

export function getMarketProvider(): MarketProvider {
  if (_provider) return _provider;
  const choice = (process.env.MARKET_PROVIDER ?? "mock").toLowerCase();
  if (choice === "finnhub" && process.env.FINNHUB_API_KEY) {
    _provider = new FinnhubProvider();
  } else {
    _provider = new MockProvider();
  }
  return _provider;
}

export * from "./types";
export { UNIVERSE, getUniverseEntry } from "./universe";
