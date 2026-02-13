import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import SwRegister from "./sw-register";
import { Analytics } from "@vercel/analytics/next"
import InstallButton from "@/components/pwa/InstallButton";

export const metadata: Metadata = {
  title: "Transcript Lite",
  description: "Offline student transcript PDF generator",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#0f172a" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link rel="icon" href="/icons/icon-32.png" sizes="32x32" />
      </head>
      <body className="antialiased">
        <Analytics />
        <SwRegister />
        <InstallButton />
        {process.env.NEXT_PUBLIC_ADSENSE_CLIENT ? (
          <Script
            id="adsense-script"
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_CLIENT}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        ) : null}
        {children}
        <footer className="border-t border-zinc-200 bg-white py-3 text-center text-xs text-zinc-500 sm:py-4">
          Built by Evans Munsha.
        </footer>
      </body>
    </html>
  );
}
