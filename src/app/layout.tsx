import type { Metadata } from "next";
import localFont from "next/font/local";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { SupportWidget } from "@/components/site/support-widget";
import { ClerkProvider } from "@clerk/nextjs";
import { CLERK_ENABLED } from "@/lib/auth";

// TEK FONT — her yerde Hanken Grotesk. Sans/mono/display değişkenlerinin
// hepsi aynı yüze bağlı; kodda font-sans/font-mono yazılsa bile Hanken render olur.
const hanken = localFont({
  src: "../../public/fonts/HankenGrotesk-Variable.woff2",
  variable: "--font-display",
  weight: "300 800",
  display: "swap",
});

// Inter — Didit dashboard dili (.ais-light) için. Didit canlı CSS'inden ölçüldü:
// font-family: Inter. Yalnız açık-tema dashboard sayfalarında kullanılır.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Finovela — AI investing, on autopilot",
  description:
    "Finovela is the all-in-one AI investing co-pilot. Chat to build a strategy, automate buys and sells, track everything, and let your portfolio run itself.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const tree = (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${hanken.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg text-fg">
        <ThemeProvider>{children}</ThemeProvider>
        <SupportWidget />
      </body>
    </html>
  );

  // Clerk anahtarları varsa gerçek auth ile sar; yoksa demo modunda olduğu gibi bırak.
  // localization: Clerk Dashboard'daki uygulama adı ("borsa") yerine her yerde
  // "Finovela" görünsün (başlık/altyazı stringleri inline override).
  return CLERK_ENABLED ? (
    <ClerkProvider
      afterSignOutUrl="/"
      appearance={{ variables: { colorPrimary: "#3b6dff", colorBackground: "#0a1838" } }}
      localization={{
        signIn: {
          start: {
            title: "Finovela'ya giriş yap",
            subtitle: "Tekrar hoş geldin — devam etmek için giriş yap",
          },
        },
        signUp: {
          start: {
            title: "Finovela hesabı oluştur",
            subtitle: "Başlamak için bilgilerini gir",
          },
        },
      }}
    >
      {tree}
    </ClerkProvider>
  ) : (
    tree
  );
}
