// Bildirim maili tetikleyici — güvenlik olayları için (client tarafından çağrılır).
// POST { kind: "pin_set" | "connection_added", exchange? }
//   → ilgili maili kullanıcının e-postasına gönderir.
//
// Mail her zaman graceful: EMAIL_ENABLED false / e-posta yoksa sessizce no-op.
// Kimlik sunucudaki oturumdan (requireUserId) — istemciden gelen kimlik kullanılmaz.

import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/current-user";
import { getUserRow } from "@/lib/db/repo";
import { sendEmail } from "@/lib/email/send";
import { pinSetEmail, connectionAddedEmail } from "@/lib/email/templates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type NotifyKind = "pin_set" | "connection_added";

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    if (!userId) return NextResponse.json({ ok: false, error: "Oturum gerekli" }, { status: 401 });

    const body = (await req.json().catch(() => ({}))) as { kind?: string; exchange?: string };
    const kind = body.kind as NotifyKind | undefined;
    if (kind !== "pin_set" && kind !== "connection_added") {
      return NextResponse.json({ ok: false, error: "Geçersiz bildirim türü" }, { status: 400 });
    }

    const user = await getUserRow(userId);
    const email = user?.email;
    if (email) {
      const mail =
        kind === "pin_set"
          ? pinSetEmail()
          : connectionAddedEmail((body.exchange ?? "Borsa").toString());
      // Mail ana akışı bozmaz — hata yutulur.
      await sendEmail({ to: email, subject: mail.subject, html: mail.html, text: mail.text }).catch(
        () => {},
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[api/notify] failed:", e);
    // Bildirim hatası istemci akışını bozmasın.
    return NextResponse.json({ ok: true });
  }
}
