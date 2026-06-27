"use client";

/**
 * Vela güvenlik & tercih store'u — gerçek çalışan toggle'lar + işlem PIN'i +
 * yedek kodlar + oturum/cihaz kaydı. Kalıcı (vela.security.v1 → DB sync).
 *
 * NOT: Clerk 2FA/mail/cihaz altyapısını sağlar; bu store Vela'ya özgü katmanı
 * tutar (işlem PIN'i = Brain güven bütçesindeki PIN eşiğiyle çalışır, bildirim
 * tercihleri, yedek kodlar). Üretimde PIN sunucuda hash'lenir; demo'da local.
 */

import { useSyncExternalStore } from "react";

export type SecurityState = {
  txPinEnabled: boolean;
  txPinHash: string | null; // basit demo hash (üretimde server-side bcrypt)
  backupCodes: string[]; // tek-kullanımlık kurtarma kodları
  notif: {
    priceAlerts: boolean;
    dailyBrief: boolean;
    earnings: boolean;
    automation: boolean;
  };
  devices: { id: string; label: string; lastActive: number; current: boolean }[];
};

const KEY = "vela.security.v1";

function seed(): SecurityState {
  return {
    txPinEnabled: false,
    txPinHash: null,
    backupCodes: [],
    notif: { priceAlerts: true, dailyBrief: true, earnings: true, automation: false },
    devices: [],
  };
}

const SSR: SecurityState = Object.freeze(seed()) as SecurityState;

let cache: SecurityState | null = null;
const listeners = new Set<() => void>();

/** Demo amaçlı basit, taşmasız hash (üretim DEĞİL). */
function simpleHash(s: string): string {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return (h >>> 0).toString(16);
}

function load(): SecurityState {
  if (cache) return cache;
  if (typeof window === "undefined") return SSR;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? { ...seed(), ...(JSON.parse(raw) as Partial<SecurityState>) } : seed();
  } catch {
    cache = seed();
  }
  // İlk yüklemede mevcut cihazı kaydet.
  if (cache && cache.devices.length === 0) {
    cache.devices = [
      { id: "cur", label: deviceLabel(), lastActive: Date.now(), current: true },
    ];
  }
  return cache;
}

function deviceLabel(): string {
  if (typeof navigator === "undefined") return "Bu cihaz";
  const ua = navigator.userAgent;
  const os = /Mac/.test(ua) ? "macOS" : /Win/.test(ua) ? "Windows" : /iPhone|iPad/.test(ua) ? "iOS" : /Android/.test(ua) ? "Android" : "Bilinmeyen";
  const br = /Chrome/.test(ua) ? "Chrome" : /Safari/.test(ua) ? "Safari" : /Firefox/.test(ua) ? "Firefox" : "Tarayıcı";
  return `${br} · ${os}`;
}

function save(next: SecurityState) {
  cache = next;
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(next));
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onRehydrate = () => {
    cache = null;
    cb();
  };
  if (typeof window !== "undefined") window.addEventListener("vela:rehydrate", onRehydrate);
  return () => {
    listeners.delete(cb);
    if (typeof window !== "undefined") window.removeEventListener("vela:rehydrate", onRehydrate);
  };
}

function genBackupCodes(): string[] {
  // 8 adet 8-haneli kod — deterministik DEĞİL ama crypto yoksa zaman+index tabanlı.
  const codes: string[] = [];
  const base = Date.now();
  for (let i = 0; i < 8; i++) {
    const n = (base * (i + 7)) % 100000000;
    codes.push(String(n).padStart(8, "0").replace(/(\d{4})(\d{4})/, "$1-$2"));
  }
  return codes;
}

export const securityStore = {
  get: load,
  setNotif(key: keyof SecurityState["notif"], value: boolean) {
    const s = load();
    save({ ...s, notif: { ...s.notif, [key]: value } });
  },
  setPin(pin: string) {
    const s = load();
    save({ ...s, txPinEnabled: true, txPinHash: simpleHash(pin) });
  },
  disablePin() {
    const s = load();
    save({ ...s, txPinEnabled: false, txPinHash: null });
  },
  /**
   * PIN doğrula. ÖNEMLİ: Bu fonksiyon yalnızca "kimlik doğrulama" için çağrılmalı;
   * "PIN gerekli mi?" sorusu AYRI (isPinEnabled). Burada PIN aktif değilse true
   * dönmek güvenli DEĞİL — çağıran taraf PIN modal'ı gösterdiyse PIN aktiftir ve
   * boş/yanlış PIN ASLA geçmemeli. O yüzden:
   *  - PIN aktif değilse: doğrulanacak bir şey yok → çağıran zaten modal göstermez.
   *    Yine de yanlış-pozitif riskini elemek için boş PIN'i reddediyoruz.
   *  - PIN aktif ama hash bozuk/yoksa (bozuk state): GÜVENLİ TARAF → reddet.
   */
  verifyPin(pin: string): boolean {
    const s = load();
    const entered = (pin ?? "").trim();
    if (entered.length < 4) return false; // boş/eksik PIN asla geçmez
    if (!s.txPinEnabled) return true; // PIN hiç kurulmamış → doğrulama gerekmez
    if (!s.txPinHash) return false; // enabled ama hash yok = bozuk state → güvenli: reddet
    return simpleHash(entered) === s.txPinHash;
  },
  /** PIN gerçekten kurulu mu (enabled + geçerli hash). UI bunu modal kararı için kullanmalı. */
  isPinSet(): boolean {
    const s = load();
    return !!(s.txPinEnabled && s.txPinHash);
  },
  regenerateBackupCodes(): string[] {
    const s = load();
    const codes = genBackupCodes();
    save({ ...s, backupCodes: codes });
    return codes;
  },
  revokeDevice(id: string) {
    const s = load();
    save({ ...s, devices: s.devices.filter((d) => d.id !== id || d.current) });
  },
};

export function useSecurity() {
  const state = useSyncExternalStore(subscribe, load, () => SSR);
  return {
    state,
    setNotif: securityStore.setNotif,
    setPin: securityStore.setPin,
    disablePin: securityStore.disablePin,
    regenerateBackupCodes: securityStore.regenerateBackupCodes,
    revokeDevice: securityStore.revokeDevice,
  };
}
