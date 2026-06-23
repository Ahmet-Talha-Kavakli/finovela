import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const sans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

// Başlık fontu — General Sans (kullanıcı seçimi, görseldeki geometrik grotesk)
const display = localFont({
  src: "../../public/fonts/GeneralSans-Variable.woff2",
  variable: "--font-display",
  weight: "200 700",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Vela — AI investing, on autopilot",
  description:
    "Vela is the all-in-one AI investing co-pilot. Chat to build a strategy, automate buys and sells, track everything, and let your portfolio run itself.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${sans.variable} ${mono.variable} ${display.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg text-fg">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
