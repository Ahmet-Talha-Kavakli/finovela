import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";

/**
 * Tüm alt sayfaların ortak iskeleti — Navbar + içerik + Footer.
 * Landing ile birebir tutarlı (aynı nav/footer, aynı koyu-mor dünya).
 * Nav fixed/96px olduğu için içerik üst boşluğunu sayfa hero'su verir.
 */
export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
