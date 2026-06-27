"use client";

/**
 * Vela Senkronizasyon Köprüsü.
 *
 * Strateji: localStorage anlık + offline kalır (hız, çevrimdışı). Bu motor
 * arka planda DB ile senkronize eder → cihazlar-arası kalıcılık, gerçek ürün temeli.
 *
 * Akış:
 *  1. Mount'ta DB'den durumu çek (GET /api/state). DB daha yeniyse (rev) localStorage'a
 *     uygula ve store'ları tazele (storage event + custom event).
 *  2. localStorage'daki vela.* anahtarları değiştikçe debounce'lu DB'ye yaz (PUT).
 *  3. PUT çakışma dönerse (başka cihaz daha yeni) sunucu durumunu alıp birleştir.
 *
 * Bu motor tek bir client bileşeninde (SyncProvider) bir kez başlatılır.
 */

// Senkronize edilecek localStorage anahtarları (tüm kalıcı store'lar).
const SYNC_KEYS = [
  "vela.paper.v1",
  "vela.cash.v1",
  "vela.watchlist.v1",
  "vela.automations.v1",
  "vela.alerts.v1",
  "vela.chats.v1",
  "vela.aimemory.v1",
  "vela.options.v1",
  "vela.genassets.v1",
  "vela.notifs.v1",
  "vela.goals.v1",
  "vela.brain.v1",
  "vela.decisions.v1",
  "vela.connections.v1",
  "vela.security.v1",
] as const;

let started = false;
let localRev = 0;
let pushTimer: ReturnType<typeof setTimeout> | null = null;
let suppressNextPush = false;

/** Tüm sync anahtarlarını tek bir blob olarak topla. */
function collectBlob(): Record<string, unknown> {
  const blob: Record<string, unknown> = {};
  for (const k of SYNC_KEYS) {
    const raw = localStorage.getItem(k);
    if (raw != null) {
      try {
        blob[k] = JSON.parse(raw);
      } catch {
        blob[k] = raw;
      }
    }
  }
  return blob;
}

const CHATS_KEY = "vela.chats.v1";

/** Tek bir kalıcı sohbet (sync birleştirme için minimal şekil). */
type SyncChat = { id: string; ts?: number; [k: string]: unknown };

/**
 * Sohbet listelerini id'ye göre BİRLEŞTİR (veri kaybını önler).
 *
 * Kural:
 *  - Hem yerelde hem sunucuda olan sohbet → ts'i (son güncelleme) daha YENİ olan kazanır.
 *  - Yalnızca yerelde olan sohbet → ASLA düşürülmez (sunucu henüz görmemiş olabilir,
 *    örn. uçuştaki push sırasında oluşturulan yeni sohbet).
 *  - Yalnızca sunucuda olan sohbet → eklenir (başka cihazdan gelen sohbet).
 *
 * LİMİTASYON (silme vs birleştirme): Tombstone/silme işareti yoktur. Bu yüzden bir
 * cihazda silinen sohbet, başka cihazda hâlâ yereldeyse birleştirme onu "geri
 * diriltebilir". Gerçek silme dayanıklılığı için store'a silinmiş id + ts taşıyan
 * bir tombstone mekanizması gerekir; mevcut kapsam bunu içermiyor.
 */
function mergeChats(local: unknown, server: unknown): SyncChat[] {
  const toArr = (v: unknown): SyncChat[] =>
    Array.isArray(v) ? (v.filter((c) => c && typeof (c as SyncChat).id === "string") as SyncChat[]) : [];
  const localArr = toArr(local);
  const serverArr = toArr(server);

  const byId = new Map<string, SyncChat>();
  for (const c of serverArr) byId.set(c.id, c);
  for (const c of localArr) {
    const existing = byId.get(c.id);
    if (!existing) {
      byId.set(c.id, c); // yalnızca yerelde — koru
    } else {
      // ts'i daha yeni olan kazanır (eşitlikte yereli tut — uçuştaki değişiklik öncelikli)
      const localTs = typeof c.ts === "number" ? c.ts : 0;
      const serverTs = typeof existing.ts === "number" ? existing.ts : 0;
      if (localTs >= serverTs) byId.set(c.id, c);
    }
  }
  // en güncel öne
  return [...byId.values()].sort(
    (a, b) => (typeof b.ts === "number" ? b.ts : 0) - (typeof a.ts === "number" ? a.ts : 0),
  );
}

/** localStorage'tan bir anahtarın çözümlenmiş değerini oku (yoksa null). */
function readLocal(key: string): unknown {
  const raw = localStorage.getItem(key);
  if (raw == null) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

/**
 * DB'den gelen blob'u localStorage'a uygula + store'ları haberdar et.
 *
 * NON-DESTRUCTIVE: vela.chats.v1 özel-durumdur — sunucu kopyası yerel kopyanın
 * üstüne KÖRLEMESİNE yazılmaz; id'ye göre birleştirilir (yeni sohbetler kaybolmaz).
 * Diğer anahtarlar için sunucu kazanır (eski davranış korunur).
 */
function applyBlob(blob: Record<string, unknown>) {
  suppressNextPush = true; // tüm batch boyunca push'u bastır
  let touched = false;
  for (const k of SYNC_KEYS) {
    if (k in blob && blob[k] != null) {
      if (k === CHATS_KEY) {
        // Sohbetleri birleştir — yerelde olup sunucuda olmayan ASLA silinmesin.
        const merged = mergeChats(readLocal(CHATS_KEY), blob[k]);
        localStorage.setItem(k, JSON.stringify(merged));
      } else {
        localStorage.setItem(k, JSON.stringify(blob[k]));
      }
      touched = true;
    }
  }
  suppressNextPush = false;
  // Store'lar kendi cache'lerini tuttuğu için tazeleme sinyali yayınla.
  if (touched) window.dispatchEvent(new CustomEvent("vela:rehydrate"));
}

async function hydrateFromDb() {
  try {
    const res = await fetch("/api/state", { cache: "no-store" });
    const data = (await res.json()) as {
      ok: boolean;
      blob: Record<string, unknown> | null;
      rev: number;
    };
    if (data.ok && data.blob && data.rev > 0) {
      // DB'de kayıt var — uygula. Sohbetler KÖRLEMESİNE değiştirilmez; applyBlob
      // vela.chats.v1'i id'ye göre birleştirir (mount'ta yerel sohbetler kaybolmaz).
      applyBlob(data.blob);
      localRev = data.rev;
      // Birleştirme yerel sohbetlere yeni öğe kattıysa (sunucunun görmediği), bu
      // birleşik durumu DB'ye geri yaz ki sunucu da güncellensin.
      schedulePush(2000);
    } else {
      // DB boş — mevcut localStorage'ı ilk yedek olarak DB'ye yaz.
      schedulePush(0);
    }
  } catch {
    /* offline — localStorage ile devam, sonra tekrar denenir */
  }
}

function schedulePush(delay = 1500) {
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(pushToDb, delay);
}

async function pushToDb() {
  try {
    const blob = collectBlob();
    const res = await fetch("/api/state", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ blob, rev: localRev }),
    });
    const data = (await res.json()) as {
      ok: boolean;
      conflict?: boolean;
      rev: number;
      server?: Record<string, unknown>;
    };
    if (data.ok) {
      if (data.conflict && data.server) {
        // Başka cihaz daha yeni — sunucuyu uygula. Sohbetler için applyBlob
        // id-bazlı BİRLEŞTİRME yapar: uçuştaki push sırasında oluşturulan ve
        // sunucunun henüz görmediği yerel sohbetler ASLA düşürülmez. Diğer
        // anahtarlarda sunucu kazanır (eski davranış).
        applyBlob(data.server);
        localRev = data.rev;
        // Birleştirilmiş sohbet durumunu sunucuya geri yaz (sunucuyu hizala).
        schedulePush(2000);
      } else {
        localRev = data.rev;
      }
    }
  } catch {
    // offline — sonraki değişiklikte tekrar denenir
    schedulePush(5000);
  }
}

/** Bir localStorage anahtarı değişince çağrılır (store'lar tetikler veya storage event). */
function onLocalChange() {
  if (suppressNextPush) return; // DB'den uygulama sırasında push tetikleme
  schedulePush();
}

/** Sync motorunu başlat (idempotent). */
export function startSync() {
  if (started || typeof window === "undefined") return;
  started = true;

  // localStorage.setItem'i sarmalayarak HER vela.* yazımını otomatik yakala —
  // böylece 10 store'u tek tek değiştirmeden tüm değişiklikler DB'ye gider.
  const origSetItem = localStorage.setItem.bind(localStorage);
  localStorage.setItem = function (key: string, value: string) {
    origSetItem(key, value);
    if (key.startsWith("vela.") && SYNC_KEYS.includes(key as (typeof SYNC_KEYS)[number])) {
      onLocalChange();
    }
  };
  const origRemoveItem = localStorage.removeItem.bind(localStorage);
  localStorage.removeItem = function (key: string) {
    origRemoveItem(key);
    if (key.startsWith("vela.")) onLocalChange();
  };

  // Diğer sekmelerden gelen değişiklikler.
  window.addEventListener("storage", (e) => {
    if (e.key && SYNC_KEYS.includes(e.key as (typeof SYNC_KEYS)[number])) onLocalChange();
  });

  // Manuel tetik (store'lar isterse notifyChanged çağırabilir).
  window.addEventListener("vela:changed", onLocalChange as EventListener);

  // Sayfa kapanırken son durumu acele yaz (best-effort).
  window.addEventListener("beforeunload", () => {
    try {
      const blob = collectBlob();
      navigator.sendBeacon?.(
        "/api/state",
        new Blob([JSON.stringify({ blob, rev: localRev })], { type: "application/json" }),
      );
    } catch {
      /* ignore */
    }
  });

  void hydrateFromDb();
}

/** Store'ların persist sonrası çağırması için — sync'e "değişti" der. */
export function notifyChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("vela:changed"));
  }
}
