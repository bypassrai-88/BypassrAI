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
    "AI humanizer to bypass Turnitin AI and other detectors. Humanize AI text from ChatGPT—free. Bypass AI detection, pass Turnitin, GPTZero. Bypassr AI makes AI writing undetectable.",
  metadataBase: new URL(siteUrl),
  icons: { icon: "/favicon.png" },
  openGraph: {
    title: "Bypassr AI — AI Humanizer to Bypass Turnitin AI & AI Detection",
    description:
      "Bypass Turnitin AI and other detectors. Humanize AI text from ChatGPT. Free AI humanizer to bypass AI detection. Try free.",
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
  keywords: [
    "bypassr ai",
    "bypass ai",
    "bypassai",
    "bypass turnitin ai",
    "bypass turnitin ai detector",
    "AI humanizer",
    "humanize AI text",
    "bypass AI detection",
    "Turnitin",
    "GPTZero",
  ],
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: "Bypassr AI",
      description: "AI humanizer to bypass Turnitin AI and AI detection. Humanize AI text from ChatGPT. Free tool to make AI writing undetectable.",
      potentialAction: { "@type": "SearchAction", target: { "@type": "EntryPoint", urlTemplate: `${siteUrl}/humanize?q={search_term_string}` }, "query-input": "required name=search_term_string" },
    },
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "Bypassr AI",
      url: siteUrl,
      logo: { "@type": "ImageObject", url: `${siteUrl}/favicon.png` },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col font-sans antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
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
