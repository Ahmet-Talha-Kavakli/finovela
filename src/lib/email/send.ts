// Finovela e-posta gönderimi — Resend. Tek kaynak: tüm transactional mailler buradan.
// finovela.com Resend'de doğrulanmış (verified) → gerçek gönderim.
// RESEND_API_KEY yoksa graceful no-op (uygulama çökmez, dev'de log).

import { Resend } from "resend";

const KEY = process.env.RESEND_API_KEY?.trim();
const FROM = process.env.EMAIL_FROM?.trim() || "Finovela <noreply@finovela.com>";
const REPLY_TO = process.env.EMAIL_REPLY_TO?.trim() || "destek@finovela.com";

/** Resend yapılandırılmış mı? */
export const EMAIL_ENABLED = !!KEY && !KEY.includes("YOUR_");

const resend = EMAIL_ENABLED ? new Resend(KEY) : null;

export type SendResult = { ok: boolean; id?: string; error?: string };

/**
 * Düşük seviye gönderim. Şablonlar (templates.ts) bunu çağırır.
 * Asla throw etmez — hata { ok:false } olarak döner (mail bir işlemi bloklamamalı).
 */
export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}): Promise<SendResult> {
  if (!EMAIL_ENABLED || !resend) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[email] (devre dışı) → ${opts.to}: ${opts.subject}`);
    }
    return { ok: false, error: "email_disabled" };
  }
  if (!opts.to || !opts.to.includes("@")) {
    return { ok: false, error: "invalid_recipient" };
  }
  try {
    const res = await resend.emails.send({
      from: FROM,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
      replyTo: opts.replyTo || REPLY_TO,
    });
    if (res.error) {
      console.error("[email] Resend error:", res.error);
      return { ok: false, error: res.error.message };
    }
    return { ok: true, id: res.data?.id };
  } catch (e) {
    console.error("[email] send failed:", e);
    return { ok: false, error: (e as Error).message };
  }
}
