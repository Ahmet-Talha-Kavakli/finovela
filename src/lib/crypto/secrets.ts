// Sunucu-tarafı gizli-değer şifreleme — borsa API anahtarları için.
// AES-256-GCM. Master anahtar ENV'den (ENCRYPTION_KEY). Düz metin anahtar
// ASLA DB'ye yazılmaz; yalnızca emir gönderirken bellekte çözülür.
//
// Format: base64(iv).base64(authTag).base64(ciphertext)
//
// ÜRETİM: ENCRYPTION_KEY 32 baytlık rastgele bir değerin base64/hex hali olmalı.
//   üret: openssl rand -base64 32
// Geliştirmede ENV yoksa sabit bir geliştirme anahtarına düşer (yalnızca dev!).

import { createCipheriv, createDecipheriv, randomBytes, createHash } from "node:crypto";

const ALGO = "aes-256-gcm";
let warnedDevKey = false;

function masterKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY?.trim();
  if (raw) {
    // base64 veya hex kabul et; her hâlükârda 32 bayta SHA-256 ile sıkıştır.
    return createHash("sha256").update(raw).digest();
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("ENCRYPTION_KEY üretimde zorunludur (borsa anahtarları şifrelenemiyor).");
  }
  // Yalnızca geliştirme — sabit dev anahtarı (gerçek gizli DEĞİL). Bir kez uyar.
  if (!warnedDevKey) {
    warnedDevKey = true;
    console.warn(
      "[secrets] UYARI: ENCRYPTION_KEY ayarlı değil — geliştirme dev anahtarı kullanılıyor. " +
        "Üretimde mutlaka `openssl rand -base64 32` ile gerçek bir anahtar ayarla.",
    );
  }
  return createHash("sha256").update("finovela-dev-only-key").digest();
}

export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, masterKey(), iv);
  const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}.${tag.toString("base64")}.${ct.toString("base64")}`;
}

export function decryptSecret(payload: string): string {
  const [ivB64, tagB64, ctB64] = payload.split(".");
  if (!ivB64 || !tagB64 || !ctB64) throw new Error("Bozuk şifreli değer");
  const decipher = createDecipheriv(ALGO, masterKey(), Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  const pt = Buffer.concat([decipher.update(Buffer.from(ctB64, "base64")), decipher.final()]);
  return pt.toString("utf8");
}

/** API anahtarını maskele (UI'da göstermek için: ilk 4 + son 4). */
export function maskKey(key: string): string {
  if (key.length <= 8) return "••••";
  return `${key.slice(0, 4)}••••${key.slice(-4)}`;
}
