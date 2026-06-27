// Çok-varlıklı bileşik sağlayıcı seçici.
// Frontend/route'lar yalnızca getMarketProvider()'ı import eder.

import type { MarketProvider } from "./types";
import { CompositeProvider } from "./composite-provider";

let _provider: MarketProvider | null = null;

/**
 * Bileşik sağlayıcı: ABD hisse (Finnhub/mock) + gerçek kripto (CoinGecko) +
 * forex/metal/emtia (Twelve Data) + BIST (Yahoo). Sembol tipine göre yönlendirir.
 */
export function getMarketProvider(): MarketProvider {
  if (_provider) return _provider;
  _provider = new CompositeProvider();
  return _provider;
}

export * from "./types";
export { UNIVERSE, getUniverseEntry } from "./universe";
