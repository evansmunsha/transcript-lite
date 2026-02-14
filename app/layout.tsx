import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import SwRegister from "./sw-register";
import { Analytics } from "@vercel/analytics/next"
import InstallButton from "@/components/pwa/InstallButton";

const siteTitle = "Transcript Lite";
const siteDescription = "Offline student transcript PDF generator";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ),
  title: siteTitle,
  description: siteDescription,
  applicationName: siteTitle,
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    url: "/",
    siteName: siteTitle,
    type: "website",
    images: [
      {
      url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Transcript Lite",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/icons/icon-32.png",
    apple: "/icons/icon-192.png",
  },
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
      <body className="antialiased overflow-x-hidden">
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
