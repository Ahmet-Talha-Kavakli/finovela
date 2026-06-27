// Binance adapteri — kullanıcının KENDİ hesabında non-custodial işlem.
// HMAC-SHA256 imzalı REST. Spot. Testnet + canlı ortam.
// Finovela parayı tutmaz; yalnızca kullanıcının verdiği anahtarla emir iletir.
//
// Doğrulama: hesap bilgisi çekilir → izinler (canTrade/canWithdraw) saptanır.
// Para çekme yetkisi VARSA kullanıcı uyarılır (önerilmez).

import { createHmac } from "node:crypto";

const HOSTS = {
  live: "https://api.binance.com",
  testnet: "https://testnet.binance.vision",
} as const;

export type BinanceEnv = keyof typeof HOSTS;

export type BinanceBalance = { asset: string; free: number; locked: number };

export type AccountInfo = {
  canTrade: boolean;
  canWithdraw: boolean;
  balances: BinanceBalance[];
};

export type OrderResult = {
  orderId: number;
  symbol: string;
  side: string;
  status: string;
  executedQty: number;
  price: number;
};

function sign(query: string, secret: string): string {
  return createHmac("sha256", secret).update(query).digest("hex");
}

/** İmzalı (özel) istek. Binance signed endpoint deseni: timestamp + signature. */
async function signedRequest<T>(
  env: BinanceEnv,
  apiKey: string,
  apiSecret: string,
  method: "GET" | "POST" | "DELETE",
  path: string,
  params: Record<string, string | number> = {},
): Promise<T> {
  const base = HOSTS[env];
  const ts = Date.now();
  const qp = new URLSearchParams({ ...mapStr(params), timestamp: String(ts), recvWindow: "10000" });
  const signature = sign(qp.toString(), apiSecret);
  qp.append("signature", signature);
  const url = `${base}${path}?${qp.toString()}`;
  const res = await fetch(url, {
    method,
    headers: { "X-MBX-APIKEY": apiKey },
    cache: "no-store",
  });
  const text = await res.text();
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  if (!res.ok) {
    const msg =
      typeof data === "object" && data && "msg" in data
        ? String((data as { msg: unknown }).msg)
        : `HTTP ${res.status}`;
    throw new BinanceError(msg, res.status);
  }
  return data as T;
}

function mapStr(p: Record<string, string | number>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(p)) out[k] = String(v);
  return out;
}

export class BinanceError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = "BinanceError";
  }
}

/** Hesap bilgisi + izinler + bakiye. Anahtar doğrulaması için de kullanılır. */
export async function getAccount(
  env: BinanceEnv,
  apiKey: string,
  apiSecret: string,
): Promise<AccountInfo> {
  const raw = await signedRequest<{
    canTrade: boolean;
    canWithdraw: boolean;
    balances: { asset: string; free: string; locked: string }[];
  }>(env, apiKey, apiSecret, "GET", "/api/v3/account");
  return {
    canTrade: !!raw.canTrade,
    canWithdraw: !!raw.canWithdraw,
    balances: raw.balances
      .map((b) => ({ asset: b.asset, free: Number(b.free), locked: Number(b.locked) }))
      .filter((b) => b.free > 0 || b.locked > 0),
  };
}

/** Anahtarları doğrula — hesap çekilebiliyorsa izinleri döndür, yoksa hata. */
export async function validateKeys(
  env: BinanceEnv,
  apiKey: string,
  apiSecret: string,
): Promise<{ ok: true; canTrade: boolean; canWithdraw: boolean } | { ok: false; error: string }> {
  try {
    const acc = await getAccount(env, apiKey, apiSecret);
    return { ok: true, canTrade: acc.canTrade, canWithdraw: acc.canWithdraw };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Doğrulama başarısız";
    return { ok: false, error: msg };
  }
}

/** Spot piyasa emri ver (MARKET). quantity = baz varlık miktarı. */
export async function placeMarketOrder(
  env: BinanceEnv,
  apiKey: string,
  apiSecret: string,
  symbol: string,
  side: "BUY" | "SELL",
  quantity: number,
): Promise<OrderResult> {
  const raw = await signedRequest<{
    orderId: number;
    symbol: string;
    side: string;
    status: string;
    executedQty: string;
    fills?: { price: string; qty: string }[];
    cummulativeQuoteQty?: string;
  }>(env, apiKey, apiSecret, "POST", "/api/v3/order", {
    symbol: symbol.toUpperCase(),
    side,
    type: "MARKET",
    quantity,
  });
  // Ortalama dolum fiyatı
  const execQty = Number(raw.executedQty) || 0;
  const quote = Number(raw.cummulativeQuoteQty) || 0;
  const avgPrice = execQty > 0 ? quote / execQty : 0;
  return {
    orderId: raw.orderId,
    symbol: raw.symbol,
    side: raw.side,
    status: raw.status,
    executedQty: execQty,
    price: avgPrice,
  };
}
