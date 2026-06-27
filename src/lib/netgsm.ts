// Netgsm SMS entegrasyonu — gerçek SMS telefon doğrulaması (TR yerli sağlayıcı).
// Twilio TR'den bireysel upgrade'de şirket/kimlik istediği için Netgsm'e geçildi.
//
// Twilio Verify'dan FARKI: Netgsm sadece "şu numaraya şu mesajı at" der; kodu
// üretme/saklama/doğrulama bize ait (DB: phone_verifications, hash'li, 5 dk, 5 deneme).
//
// Anahtarlar YOKSA NETGSM_ENABLED=false → telefon adımı demo moda düşer.
// Üretim:
//   NETGSM_USERCODE   (müşteri/kullanıcı kodu)
//   NETGSM_PASSWORD   (API erişim şifresi)
//   NETGSM_MSGHEADER  (onaylı gönderici başlığı, ör. FINOVELA)
//
// REST v2 gönderim: POST https://api.netgsm.com.tr/sms/rest/v2/send
//   Basic auth (usercode:password) + JSON gövde.
//   Başarı: code "00"; hata kodları 20/30/40/70 vb.

import { randomInt } from "node:crypto";

const USERCODE = process.env.NETGSM_USERCODE?.trim();
const PASSWORD = process.env.NETGSM_PASSWORD?.trim();
const MSGHEADER = process.env.NETGSM_MSGHEADER?.trim();

export const NETGSM_ENABLED = !!USERCODE && !!PASSWORD && !!MSGHEADER;

const SEND_URL = "https://api.netgsm.com.tr/sms/rest/v2/send";

/** 6 haneli güvenli doğrulama kodu üret. */
export function generateCode(): string {
  return String(randomInt(100000, 1000000)); // 100000–999999
}

/** E.164 → Netgsm formatı: Netgsm TR numarasını başında 0 ile bekler (05xxxxxxxxx). */
function toNetgsmNumber(e164: string): string {
  // +905xxxxxxxxx → 05xxxxxxxxx ; +90 dışı uluslararası → başındaki + kalkar.
  if (e164.startsWith("+90")) return "0" + e164.slice(3);
  if (e164.startsWith("+")) return e164.slice(1);
  return e164;
}

/** E.164 normalizasyonu (TR varsayılan): 05xx/5xx → +905xx, +.. aynen. */
export function normalizePhone(raw: string, defaultCountry: "TR" | "US" = "TR"): string | null {
  let s = raw.replace(/[\s()-]/g, "").trim();
  if (!s) return null;
  if (s.startsWith("+")) return /^\+\d{8,15}$/.test(s) ? s : null;
  if (s.startsWith("00")) {
    s = "+" + s.slice(2);
    return /^\+\d{8,15}$/.test(s) ? s : null;
  }
  if (defaultCountry === "TR" && /^0?5\d{9}$/.test(s)) return "+90" + s.replace(/^0/, "");
  if (defaultCountry === "US" && /^\d{10}$/.test(s)) return "+1" + s;
  if (/^\d{8,15}$/.test(s)) return "+" + s;
  return null;
}

type SendResult = { ok: true } | { ok: false; error: string };

const ERROR_MESSAGES: Record<string, string> = {
  "20": "Mesaj gönderilemedi (içerik/karakter sorunu).",
  "30": "SMS servisi kimlik doğrulaması başarısız (kullanıcı/şifre).",
  "40": "Mesaj başlığı sistemde tanımlı değil.",
  "50": "Aboneliğiniz IYS kapsamında değil.",
  "70": "Hatalı veya eksik istek.",
  "80": "Gönderim sınır aşımı.",
};

/** Doğrulama SMS'i gönder. message önceden hazırlanmış metin (kodu içerir). */
export async function sendSms(phoneE164: string, message: string): Promise<SendResult> {
  if (!NETGSM_ENABLED) return { ok: false, error: "SMS servisi yapılandırılmamış." };
  try {
    const auth = Buffer.from(`${USERCODE}:${PASSWORD}`).toString("base64");
    const body = {
      msgheader: MSGHEADER,
      messages: [{ msg: message, no: toNetgsmNumber(phoneE164) }],
      encoding: "TR", // Türkçe karakter desteği
      iysfilter: "", // bilgilendirme/OTP → IYS filtresi uygulanmaz
    };
    const res = await fetch(SEND_URL, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => null)) as { code?: string; description?: string } | null;
    // Netgsm REST v2: code "00" başarı.
    if (data?.code === "00") return { ok: true };
    const code = data?.code ?? String(res.status);
    return { ok: false, error: ERROR_MESSAGES[code] ?? data?.description ?? `SMS hatası (${code})` };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Ağ hatası" };
  }
}

/** Doğrulama mesaj metnini hazırla. */
export function verificationMessage(code: string): string {
  return `Finovela dogrulama kodunuz: ${code}. Kod 5 dakika gecerlidir. Bu kodu kimseyle paylasmayin.`;
}
