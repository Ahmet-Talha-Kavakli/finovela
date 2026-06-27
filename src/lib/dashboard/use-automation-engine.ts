"use client";

/**
 * Vela Otomasyon Yürütme Motoru (Blok 3) — kuralları CANLI fiyata karşı yoklar.
 *
 * use-alerts.ts'teki setInterval+fetch desenini taklit eder ama AYRI bir motordur:
 *  - Sadece otomasyonları yürütür (fiyat alarmları + bekleyen emirler use-alerts'te kalır).
 *  - Her tetik öncesi Brain `checkBudget` ile güven bütçesini kontrol eder.
 *  - Geçerse `paperStore.placeOrder` ile GERÇEK paper emir verir.
 *  - Her aksiyonu `decisionStore.log` ile karar defterine işler (trade / blocked).
 *  - Aynı kural kısa sürede tekrar tetiklenmesin diye cooldown + tek-seferlik takip yapar.
 *
 * NOT: Çift tetiklemeyi önlemek için otomasyon yürütme use-alerts.ts'ten kaldırıldı;
 * tek yürütme noktası burasıdır.
 */

import { useEffect } from "react";
import { getExecutableAutomations, markAutomationRun, type ParsedRule } from "./use-automations";
import { paperStore } from "./paper-store";
import { brainStore, checkBudget } from "./use-brain";
import { decisionStore } from "./use-decisions";
import { notifStore } from "./use-notifications";
import { securityStore } from "./use-security";
import { rsi, macd, bollinger } from "./indicators";

/** "Otomasyon etkinliği" bildirim tercihi açık mı? (işlem yine yürütülür, sadece bildirim gate'lenir) */
function automationNotifyEnabled(): boolean {
  try {
    return securityStore.get().notif.automation;
  } catch {
    return true;
  }
}

const POLL_MS = 45000; // ~45 sn'de bir yokla
const COOLDOWN_MS = 5 * 60 * 1000; // aynı kural en az 5 dk arayla tekrar tetiklenebilir

/** Kural başına son tetik zamanı (sonsuz emir döngüsünü önler). */
const lastRunBy = new Map<string, number>();

/** Cooldown içinde mi? (henüz pause olmamış ama yeni tetiklenmiş kurallar için). */
function inCooldown(id: string, now: number): boolean {
  const last = lastRunBy.get(id);
  return last != null && now - last < COOLDOWN_MS;
}

/** Portföyün anlık toplam değeri (nakit + canlı fiyatlı pozisyonlar). */
function portfolioValue(priceBy: Map<string, number>): number {
  const s = paperStore.get();
  let total = s.cash;
  for (const h of s.holdings) {
    const p = priceBy.get(h.symbol);
    total += (p ?? h.avgCost) * h.shares;
  }
  return total;
}

/** Bugün (yerel gün) verilen otonom emir sayısı — günlük limit kontrolü için. */
function todaysTrades(): number {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const since = startOfDay.getTime();
  return paperStore.get().orders.filter((o) => o.ts >= since).length;
}

/** Bir emrin sonucu pozisyon ağırlığı (%) — maxPositionPct kontrolü için. */
function resultingPositionPct(
  symbol: string,
  side: "BUY" | "SELL",
  shares: number,
  price: number,
  portValue: number,
): number {
  if (portValue <= 0) return 0;
  const h = paperStore.get().holdings.find((x) => x.symbol === symbol);
  const curShares = h ? h.shares : 0;
  const nextShares = side === "BUY" ? curShares + shares : Math.max(0, curShares - shares);
  return ((nextShares * price) / portValue) * 100;
}

/**
 * Bütçe kontrolünden geçir, geçerse emri ver + karar defterine işle.
 * Döndürür: emir gerçekten verildi mi.
 */
function tryExecute(
  auto: { id: string; rule: string },
  order: { side: "BUY" | "SELL"; symbol: string; shares: number; price: number },
  rationale: string,
  priceBy: Map<string, number>,
): boolean {
  if (order.shares <= 0) return false;
  const settings = brainStore.get();
  const portValue = portfolioValue(priceBy);
  const tradeValue = order.shares * order.price;
  const posPct = resultingPositionPct(order.symbol, order.side, order.shares, order.price, portValue);

  const check = checkBudget(settings, {
    tradeValue,
    portfolioValue: portValue,
    todaysTrades: todaysTrades(),
    resultingPositionPct: order.side === "BUY" ? posPct : undefined,
  });

  // Bütçe reddetti → karar defterine "blocked" işle, emir VERME, kuralı pause etme
  // (limit gevşeyince tekrar denesin diye). Cooldown ile spam'i kısarız.
  if (!check.allowed) {
    decisionStore.log({
      kind: "blocked",
      action: `${order.side === "BUY" ? "Alış" : "Satış"} engellendi: ${order.symbol}`,
      rationale: `${rationale} — bütçe reddi: ${check.reason ?? "izin yok"}`,
      authority: settings.authority,
      executed: false,
      snapshot: { symbol: order.symbol, tradeValue, portfolioValue: portValue, rule: auto.rule },
    });
    lastRunBy.set(auto.id, Date.now()); // cooldown başlat (defter spam'ini önle)
    return false;
  }

  // "semi" yetkide PIN/onay gerektiren işlemleri otonom yürütme — öneri olarak işle.
  if (check.needsPin && settings.authority !== "full") {
    decisionStore.log({
      kind: "blocked",
      action: `Onay bekliyor: ${order.side === "BUY" ? "Alış" : "Satış"} ${order.symbol}`,
      rationale: `${rationale} — ${tradeValue.toFixed(0)}$ işlem PIN/onay gerektiriyor`,
      authority: settings.authority,
      executed: false,
      snapshot: { symbol: order.symbol, tradeValue, rule: auto.rule },
    });
    lastRunBy.set(auto.id, Date.now());
    return false;
  }

  const r = paperStore.placeOrder(order);
  if (!r.ok) {
    decisionStore.log({
      kind: "blocked",
      action: `Emir başarısız: ${order.symbol}`,
      rationale: `${rationale} — ${r.error ?? "emir reddedildi"}`,
      authority: settings.authority,
      executed: false,
      snapshot: { symbol: order.symbol, rule: auto.rule },
    });
    return false;
  }

  // Başarılı emir → karar defterine "trade" + bildirim + kuralı pause (tek-seferlik).
  decisionStore.log({
    kind: "trade",
    action: `${order.side === "BUY" ? "Alış" : "Satış"}: ${order.shares < 1 ? order.shares.toFixed(4) : order.shares} ${order.symbol} @ $${order.price.toFixed(2)}`,
    rationale,
    authority: settings.authority,
    executed: true,
    snapshot: { ...order, tradeValue, rule: auto.rule },
  });
  if (automationNotifyEnabled()) notifStore.push("order", `Otomasyon: ${rationale}`);
  lastRunBy.set(auto.id, Date.now());
  markAutomationRun(auto.id, `Tetiklendi — ${new Date().toLocaleString("tr-TR")}`);
  return true;
}

/** Tek bir otomasyonu canlı veriye karşı değerlendir + (koşul sağlanırsa) yürüt. */
async function evaluate(
  auto: { id: string; rule: string; parsed: ParsedRule },
  priceBy: Map<string, number>,
) {
  const pr = auto.parsed;
  if (pr.kind === "none") return;
  const p = priceBy.get(pr.symbol);
  if (p == null) return;

  // STOP — fiyat eşik altına düştü → eldeki tüm hisseyi SAT.
  if (pr.kind === "stop") {
    if (p > pr.price) return;
    const held = paperStore.get().holdings.find((h) => h.symbol === pr.symbol);
    if (!held || held.shares <= 0) return;
    tryExecute(
      auto,
      { side: "SELL", symbol: pr.symbol, shares: held.shares, price: p },
      `${pr.symbol} stop-loss: fiyat $${pr.price} altına düştü (şu an $${p.toFixed(2)})`,
      priceBy,
    );
    return;
  }

  // BUYDIP — fiyat hedefe/altına indi → tutar kadar AL.
  if (pr.kind === "buydip") {
    if (p > pr.price) return;
    const shares = +(pr.amount / p).toFixed(4);
    tryExecute(
      auto,
      { side: "BUY", symbol: pr.symbol, shares, price: p },
      `${pr.symbol} dip alımı: fiyat $${pr.price} hedefine indi ($${pr.amount} alındı)`,
      priceBy,
    );
    return;
  }

  // RSI / MACD / BOLLINGER — günlük candle çek, indikatör hesapla, koşula bak.
  let closes: number[] = [];
  try {
    const cr = await fetch(`/api/market/candles?symbol=${pr.symbol}&resolution=D`);
    if (!cr.ok) return;
    const cd = (await cr.json()) as { candles?: { close: number }[] };
    closes = (cd.candles ?? []).map((c) => c.close);
  } catch {
    return; // candle alınamadı, geç
  }
  if (closes.length === 0) return;

  let hit = false;
  let note = "";
  if (pr.kind === "rsi") {
    const value = rsi(closes, 14);
    if (value == null) return;
    hit = pr.dir === "below" ? value <= pr.level : value >= pr.level;
    note = `RSI ${value} (${pr.dir} ${pr.level})`;
  } else if (pr.kind === "macd") {
    const m = macd(closes);
    if (!m) return;
    hit = pr.dir === "bullish" ? m.histogram > 0 : m.histogram < 0;
    note = `MACD ${pr.dir} (histogram ${m.histogram.toFixed(2)})`;
  } else if (pr.kind === "bollinger") {
    const b = bollinger(closes);
    if (!b) return;
    const last = closes[closes.length - 1];
    hit = pr.band === "lower" ? last <= b.lower : last >= b.upper;
    note = `${pr.band === "lower" ? "alt" : "üst"} Bollinger bandına dokundu`;
  }
  if (!hit) return;

  // İndikatör kuralları side taşır (BUY/SELL).
  const side = (pr as { side: "BUY" | "SELL" }).side;
  const amount = (pr as { amount: number }).amount;
  if (side === "SELL") {
    const held = paperStore.get().holdings.find((h) => h.symbol === pr.symbol);
    if (!held || held.shares <= 0) return;
    tryExecute(
      auto,
      { side: "SELL", symbol: pr.symbol, shares: held.shares, price: p },
      `${pr.symbol} satış sinyali: ${note}`,
      priceBy,
    );
  } else {
    const shares = +(amount / p).toFixed(4);
    tryExecute(
      auto,
      { side: "BUY", symbol: pr.symbol, shares, price: p },
      `${pr.symbol} alış sinyali: ${note} ($${amount} alındı)`,
      priceBy,
    );
  }
}

/**
 * Otomasyon motoru — aktif kuralların sembollerini canlı fiyatla yoklar,
 * bütçe kontrolünden geçenleri gerçek paper emre çevirir. Dashboard boyunca 1 kez çalışır.
 */
export function useAutomationEngine() {
  useEffect(() => {
    let stop = false;

    async function tick() {
      const now = Date.now();
      // Kill switch / yetkisiz mod → hiç dokunma (tick boşa fetch atmasın).
      const settings = brainStore.get();
      if (settings.killSwitch || settings.authority === "advisory") return;

      // Cooldown'da olmayan, yürütülebilir kuralları al.
      const autos = getExecutableAutomations().filter((a) => !inCooldown(a.id, now));
      if (autos.length === 0) return;

      const symbols = [
        ...new Set(autos.map((a) => (a.parsed as { symbol?: string }).symbol ?? "").filter(Boolean)),
      ];
      if (symbols.length === 0) return;

      try {
        const res = await fetch(`/api/market/quote?symbols=${symbols.join(",")}`);
        if (!res.ok) return;
        const data = (await res.json()) as { quotes?: { symbol: string; price: number }[] };
        const priceBy = new Map((data.quotes ?? []).map((q) => [q.symbol, q.price]));
        if (priceBy.size === 0) return;

        // Her kuralı sırayla değerlendir (emirler nakit/pozisyonu paylaştığından sıralı).
        for (const auto of autos) {
          if (stop) break;
          // Tick sırasında bir önceki kural bu kuralı pause/cooldown'a almış olabilir.
          if (inCooldown(auto.id, Date.now())) continue;
          await evaluate(auto, priceBy);
        }
      } catch {
        /* sessiz geç */
      }
    }

    tick();
    const iv = setInterval(() => {
      if (!stop) tick();
    }, POLL_MS);
    return () => {
      stop = true;
      clearInterval(iv);
    };
  }, []);
}
