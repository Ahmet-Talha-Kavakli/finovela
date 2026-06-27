"use client";

// Bağlı borsadaki GERÇEK bakiyeyi gösteren kart. Portföy/genel-bakış sayfalarında
// kullanılır. Bağlantı yoksa hiçbir şey render etmez (paper portföy ana akış kalır).

import { useExchangeConnections, useExchangeBalances } from "@/lib/dashboard/use-exchange";
import { Card, AIS_ACCENT, AIS_UP, AIS_WARN } from "@/components/dashboard/ais-kit";
import { ArrowsClockwise, Lightning, Wallet } from "@phosphor-icons/react";

const fmtUsd = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });

export function ConnectedExchangeCard() {
  const { connections, loading } = useExchangeConnections();
  if (loading || connections.length === 0) return null;
  // İlk bağlı borsayı göster (şimdilik tek; ileride sekme/çoklu).
  const first = connections[0];
  return <ExchangePanel exchange={first.exchange} environment={first.environment} />;
}

function ExchangePanel({ exchange, environment }: { exchange: string; environment: string }) {
  const { data, loading, error, refresh } = useExchangeBalances(exchange);

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-lg" style={{ background: "var(--ais-accent-bg)", color: AIS_ACCENT }}>
            <Wallet size={18} weight="regular" />
          </span>
          <div>
            <p className="text-[14px] font-medium capitalize text-[var(--ais-fg)]">
              {exchange} hesabı
              <span
                className="ml-2 rounded-full px-2 py-0.5 text-[10px] font-medium align-middle"
                style={{ background: environment === "live" ? `${AIS_UP}1a` : `${AIS_WARN}1a`, color: environment === "live" ? AIS_UP : AIS_WARN }}
              >
                {environment === "live" ? "CANLI" : "TESTNET"}
              </span>
            </p>
            <p className="text-[12px] text-[var(--ais-fg-muted)]">Bağlı borsadaki gerçek bakiye</p>
          </div>
        </div>
        <button
          onClick={refresh}
          className="grid h-8 w-8 place-items-center rounded-lg text-[var(--ais-fg-muted)] transition hover:bg-[var(--ais-surface-2)] hover:text-[var(--ais-fg)]"
          title="Yenile"
        >
          <ArrowsClockwise size={15} weight="regular" className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {error ? (
        <p className="mt-4 text-[13px]" style={{ color: AIS_WARN }}>{error}</p>
      ) : loading && !data ? (
        <div className="mt-4 space-y-2">
          {[0, 1, 2].map((i) => <div key={i} className="ais-skeleton h-9" />)}
        </div>
      ) : data ? (
        <>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="num text-[26px] font-semibold text-[var(--ais-fg)]">{fmtUsd(data.totalUsd)}</span>
            <span className="text-[12px] text-[var(--ais-fg-muted)]">toplam değer</span>
            {data.canTrade && (
              <span className="ml-auto flex items-center gap-1 text-[11px]" style={{ color: AIS_UP }}>
                <Lightning size={12} weight="fill" /> İşlem aktif
              </span>
            )}
          </div>

          {data.holdings.length > 0 ? (
            <div className="mt-4 space-y-1.5">
              {data.holdings.slice(0, 8).map((h) => (
                <div key={h.asset} className="ais-row flex items-center justify-between px-2.5 py-2">
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-[var(--ais-surface-2)] text-[11px] font-bold text-[var(--ais-fg)]">
                      {h.asset.slice(0, 3)}
                    </span>
                    <div>
                      <p className="text-[13px] font-medium text-[var(--ais-fg)]">{h.asset}</p>
                      <p className="num text-[11px] text-[var(--ais-fg-faint)]">{h.total.toLocaleString("en-US", { maximumFractionDigits: 6 })}</p>
                    </div>
                  </div>
                  <span className="num text-[13px] font-medium text-[var(--ais-fg)]">{fmtUsd(h.valueUsd)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-[13px] text-[var(--ais-fg-muted)]">
              Bu hesapta bakiye yok. {environment === "testnet" && "Testnet faucet'ten test fonu alabilirsin."}
            </p>
          )}
        </>
      ) : null}
    </Card>
  );
}
