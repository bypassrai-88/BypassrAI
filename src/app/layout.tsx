import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { QuotaModalProvider } from "@/components/QuotaModalContext";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://bypassrai.com";

export const metadata: Metadata = {
  title: "BypassrAI — Humanize AI Text & Bypass AI Detectors",
  description:
    "Convert AI-generated content into human-sounding text that passes every AI detection tool. Humanize, paraphrase, and check AI score.",
  metadataBase: new URL(siteUrl),
  icons: { icon: "/favicon.png" },
  openGraph: {
    title: "BypassrAI — Humanize AI Text & Bypass AI Detectors",
    description:
      "Convert AI-generated content into human-sounding text that passes every AI detection tool. Humanize, paraphrase, and check AI score.",
    url: siteUrl,
    siteName: "BypassrAI",
    images: [{ url: "/favicon.png", width: 512, height: 512, alt: "BypassrAI" }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "BypassrAI — Humanize AI Text & Bypass AI Detectors",
    description:
      "Humanize AI text so it passes every AI detector. Try free.",
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
        <QuotaModalProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </QuotaModalProvider>
      </body>
    </html>
  );
}
