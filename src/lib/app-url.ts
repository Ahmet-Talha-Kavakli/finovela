/**
 * Dashboard URL yardımcısı — dashboard ayrı alt alanda (app.finovela.com) sunulur.
 *
 * Landing (finovela.com) üzerindeki "Panele git" gibi linkler, kullanıcıyı
 * dashboard alt alanına götürmeli. Ama lokal/preview'da alt alan olmadığı için
 * göreli /dashboard yoluna düşeriz (next.config rewrite zaten app host'unu
 * /dashboard'a map'ler; lokal tek-host'ta /dashboard doğrudan çalışır).
 *
 * NEXT_PUBLIC_APP_URL set ise (örn. https://app.finovela.com) onu kullan;
 * değilse göreli path → her ortamda güvenli.
 */

const APP_BASE = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";

/**
 * Dashboard içi bir yola tam/uygun URL üretir.
 * @param path dashboard-altı yol (örn. "" → kök, "chat", "portfolio")
 *   Not: app alt alanında kök "/" dashboard'a rewrite edilir; bu yüzden
 *   alt-alan kullanımında path doğrudan köke yazılır ("/chat"), lokalde "/dashboard/chat".
 */
export function appUrl(path = ""): string {
  const clean = path.replace(/^\/+/, "");
  if (APP_BASE) {
    // app.finovela.com/<path> (kök → dashboard ana sayfası)
    return clean ? `${APP_BASE}/${clean}` : APP_BASE;
  }
  // Tek-host (lokal/preview): göreli /dashboard yolu
  return clean ? `/dashboard/${clean}` : "/dashboard";
}
