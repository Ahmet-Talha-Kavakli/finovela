"use client";

// Bağlı borsa hesabı — gerçek bakiye (client hook). /api/exchange/* sarmalar.
// Anahtarlar sunucuda kalır; burada yalnızca okunan veri gelir.

import { useCallback, useEffect, useState } from "react";

export type ExchangeHolding = {
  asset: string;
  free: number;
  locked: number;
  total: number;
  price: number;
  valueUsd: number;
};

export type ExchangeBalances = {
  exchange: string;
  environment: string;
  canTrade: boolean;
  totalUsd: number;
  holdings: ExchangeHolding[];
};

export type ExchangeConnectionInfo = {
  exchange: string;
  label: string | null;
  environment: string;
  canTrade: boolean;
  canWithdraw: boolean;
  status: string;
  apiKeyMasked: string;
  createdAt: number;
};

/** Kullanıcının bağlı borsalarının listesi (maskeli). */
export function useExchangeConnections() {
  const [connections, setConnections] = useState<ExchangeConnectionInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/exchange/connect", { cache: "no-store" });
      const data = await res.json();
      setConnections(data.ok ? data.connections : []);
    } catch {
      setConnections([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { connections, loading, refresh };
}

/** Belirli bir bağlı borsanın gerçek bakiyesi. */
export function useExchangeBalances(exchange: string | null) {
  const [data, setData] = useState<ExchangeBalances | null>(null);
  const [loading, setLoading] = useState(!!exchange);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!exchange) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/exchange/balances?exchange=${exchange}`, { cache: "no-store" });
      const json = await res.json();
      if (json.ok) setData(json as ExchangeBalances);
      else setError(json.error ?? "Bakiye alınamadı");
    } catch {
      setError("Ağ hatası");
    } finally {
      setLoading(false);
    }
  }, [exchange]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}
