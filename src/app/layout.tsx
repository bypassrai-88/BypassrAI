import type { Metadata } from "next";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { QuotaModalProvider } from "@/components/QuotaModalContext";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://bypassrai.com";

export const metadata: Metadata = {
  title: "Bypassr AI — AI Humanizer to Humanize AI Text & Bypass AI Detection",
  description:
    "Free AI humanizer: humanize AI writing and bypass AI detectors. Bypassr AI turns ChatGPT and AI text into natural, undetectable content. Humanize AI, check AI score, pass Turnitin.",
  metadataBase: new URL(siteUrl),
  icons: { icon: "/favicon.png" },
  openGraph: {
    title: "Bypassr AI — AI Humanizer to Humanize AI Text & Bypass AI Detection",
    description:
      "Free AI humanizer: humanize AI writing and bypass AI detectors. Turn ChatGPT text into natural, undetectable content. Try free.",
    url: siteUrl,
    siteName: "BypassrAI",
    images: [{ url: "/favicon.png", width: 512, height: 512, alt: "BypassrAI" }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Bypassr AI — AI Humanizer to Humanize AI Text & Bypass AI",
    description:
      "AI humanizer: humanize AI text and bypass AI detection. Try free.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col font-sans antialiased">
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-NE5X25N46K"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-NE5X25N46K');
          `}
        </Script>
        <QuotaModalProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </QuotaModalProvider>
        <Analytics />
      </body>
    </html>
  );
}
