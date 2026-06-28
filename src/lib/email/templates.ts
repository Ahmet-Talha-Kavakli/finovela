// Finovela e-posta şablonları — marka kimlikli (koyu lacivert + mavi accent) HTML.
// Her fonksiyon { subject, html, text } döndürür; send.ts ile gönderilir.
// Tüm "hassas işlem" tetikleyicileri burada (kullanıcı isteği: çok şey için mail).

const BRAND = "#2b5cf0";
const BG = "#0a1838";
const SITE = "https://finovela.com";

/** Ortak e-posta düzeni — header logo + içerik + footer. Inline CSS (mail uyumu). */
function layout(opts: { heading: string; body: string; cta?: { label: string; href: string }; preheader?: string }): string {
  const { heading, body, cta, preheader } = opts;
  return `<!doctype html>
<html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Finovela</title></head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>` : ""}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px -12px rgba(10,24,56,0.18);">
  <tr><td style="background:${BG};padding:24px 28px;">
    <span style="color:#fff;font-size:19px;font-weight:700;letter-spacing:-0.02em;">⛵ Finovela</span>
  </td></tr>
  <tr><td style="padding:32px 28px 8px;">
    <h1 style="margin:0 0 12px;font-size:21px;line-height:1.3;color:#0a1838;font-weight:700;">${heading}</h1>
    <div style="font-size:15px;line-height:1.6;color:#3a4664;">${body}</div>
  </td></tr>
  ${cta ? `<tr><td style="padding:8px 28px 28px;"><a href="${cta.href}" style="display:inline-block;background:${BRAND};color:#fff;text-decoration:none;font-size:15px;font-weight:600;padding:12px 26px;border-radius:10px;">${cta.label}</a></td></tr>` : `<tr><td style="height:20px;"></td></tr>`}
  <tr><td style="padding:20px 28px;border-top:1px solid #eef1f7;">
    <p style="margin:0 0 6px;font-size:12px;line-height:1.5;color:#8a94ab;">
      Finovela bir yazılım (SaaS) ve eğitim/araştırma aracıdır; yatırım danışmanı veya aracı kurum değildir, fonlarını tutmaz. Hiçbir içerik yatırım tavsiyesi değildir.
    </p>
    <p style="margin:0;font-size:12px;color:#8a94ab;">
      <a href="${SITE}" style="color:${BRAND};text-decoration:none;">finovela.com</a> ·
      <a href="${SITE}/dashboard/settings" style="color:${BRAND};text-decoration:none;">Bildirim tercihleri</a>
    </p>
  </td></tr>
</table>
</td></tr></table></body></html>`;
}

function plain(s: string): string {
  return s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

export type Email = { subject: string; html: string; text: string };

/** Hoş geldin — kayıt sonrası. */
export function welcomeEmail(name?: string): Email {
  const hi = name ? `Merhaba ${name},` : "Merhaba,";
  const body = `${hi}<br><br>
    Finovela'ya hoş geldin! 🎉 Artık yapay zekâ destekli yatırım araştırma araçların hazır:
    portföyünü kur, Finovela Sohbet'e sor, what-if senaryoları çalıştır, otomasyon ve alarmlar oluştur.<br><br>
    Başlamak için panele geç ve ilk sohbetinde portföyünü Finovela'ya tanıt.`;
  return {
    subject: "Finovela'ya hoş geldin 🎉",
    html: layout({ heading: "Finovela'ya hoş geldin", body, cta: { label: "Panele geç", href: `${SITE}/dashboard` }, preheader: "Yapay zekâ destekli yatırım araştırman hazır." }),
    text: plain(body),
  };
}

/** Ödeme/abonelik başarılı. */
export function subscriptionActiveEmail(planName: string): Email {
  const body = `Finovela <strong>${planName}</strong> aboneliğin aktif! ✅<br><br>
    Artık planının tüm özelliklerine erişebilirsin. Aboneliğini istediğin an panelden yönetebilir veya iptal edebilirsin.`;
  return {
    subject: `Finovela ${planName} aboneliğin aktif`,
    html: layout({ heading: `${planName} aboneliğin aktif`, body, cta: { label: "Planı gör", href: `${SITE}/dashboard/billing` } }),
    text: plain(body),
  };
}

/** Kredi paketi satın alındı. */
export function creditsPurchasedEmail(credits: number): Email {
  const body = `<strong>${credits.toLocaleString("tr-TR")} kredi</strong> hesabına eklendi. ✅<br><br>
    Kredilerin yapay zekâ sohbeti ve araçlarında harcanır. Bakiyeni panelden takip edebilirsin.`;
  return {
    subject: `${credits.toLocaleString("tr-TR")} Finovela kredisi eklendi`,
    html: layout({ heading: "Kredilerin hazır", body, cta: { label: "Panele geç", href: `${SITE}/dashboard` } }),
    text: plain(body),
  };
}

/** İşlem PIN'i belirlendi (güvenlik). */
export function pinSetEmail(): Email {
  const body = `Hesabında bir <strong>işlem PIN'i</strong> belirlendi. 🔐<br><br>
    Bundan sonra yüksek tutarlı işlemlerde bu PIN sorulacak. Bu işlemi sen yapmadıysan hemen
    <a href="${SITE}/dashboard/settings" style="color:${BRAND};">güvenlik ayarlarını</a> kontrol et ve şifreni değiştir.`;
  return {
    subject: "İşlem PIN'in belirlendi 🔐",
    html: layout({ heading: "İşlem PIN'in belirlendi", body, cta: { label: "Güvenlik ayarları", href: `${SITE}/dashboard/settings` }, preheader: "Hesabında bir işlem PIN'i oluşturuldu." }),
    text: plain(body),
  };
}

/** Yeni borsa/exchange bağlandı (güvenlik). */
export function connectionAddedEmail(exchange: string): Email {
  const body = `Hesabına <strong>${exchange}</strong> bağlantısı eklendi. 🔗<br><br>
    API anahtarların AES-256 ile şifreli saklanır ve yalnızca verdiğin yetki kadar kullanılır.
    Bu işlemi sen yapmadıysan bağlantıyı hemen kaldır ve şifreni değiştir.`;
  return {
    subject: `${exchange} hesabın Finovela'ya bağlandı`,
    html: layout({ heading: "Yeni bağlantı eklendi", body, cta: { label: "Bağlantıları yönet", href: `${SITE}/dashboard/connections` }, preheader: `${exchange} bağlantısı eklendi.` }),
    text: plain(body),
  };
}

/** Günlük yapay zekâ limiti doldu (bilgilendirme + upsell). */
export function usageLimitEmail(): Email {
  const body = `Bugünkü yapay zekâ sohbet hakkın doldu.<br><br>
    Sınırsıza yakın kullanım için Pro/Ultra'ya yükseltebilir ya da kredi paketi alabilirsin —
    bekleyen analizlerine hemen devam et.`;
  return {
    subject: "Günlük yapay zekâ hakkın doldu",
    html: layout({ heading: "Bugünkü hakkın doldu", body, cta: { label: "Planı yükselt", href: `${SITE}/dashboard/billing` } }),
    text: plain(body),
  };
}

/** Fiyat alarmı tetiklendi. */
export function alertTriggeredEmail(symbol: string, condition: string, price: number): Email {
  const body = `<strong>${symbol}</strong> alarmın tetiklendi: fiyat ${condition} <strong>$${price}</strong> seviyesine ulaştı. 🔔<br><br>
    Detayları ve sıradaki hamleni Finovela Sohbet'e sorabilirsin.`;
  return {
    subject: `🔔 ${symbol} alarmın tetiklendi`,
    html: layout({ heading: `${symbol} alarmı`, body, cta: { label: `${symbol} grafiğini aç`, href: `${SITE}/dashboard/stock/${symbol}` } }),
    text: plain(body),
  };
}
