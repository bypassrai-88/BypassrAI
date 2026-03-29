import type { Metadata } from "next";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { QuotaModalProvider } from "@/components/QuotaModalContext";
import { isPortfolioMode } from "@/config/site-variant";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://bypassrai.com";

export async function generateMetadata(): Promise<Metadata> {
  const metadataBase = new URL(siteUrl);
  const icons = { icon: "/favicon.png" as const };
  const ogImage = [{ url: "/favicon.png", width: 512, height: 512, alt: "BypassrAI" }];

  if (isPortfolioMode()) {
    return {
      title: "Bypassr AI — AI Writing Tools | Essays, Grammar, Translate & Summarize",
      description:
        "All-in-one AI writing assistant: essay help, grammar checking, summarization, translation, and paraphrasing. Built for students and professionals.",
      metadataBase,
      icons,
      openGraph: {
        title: "Bypassr AI — AI Writing Tools for Essays & More",
        description:
          "Essays, grammar, summaries, translation, and paraphrasing in one place. Try free.",
        url: siteUrl,
        siteName: "BypassrAI",
        images: ogImage,
        locale: "en_US",
        type: "website",
      },
      twitter: {
        card: "summary",
        title: "Bypassr AI — AI Writing Tools",
        description: "Essay writer, grammar, summarize, translate, and paraphrase. Try free.",
      },
      keywords: [
        "AI writing assistant",
        "essay writer",
        "grammar checker",
        "summarizer",
        "translator",
        "paraphrase",
        "Bypassr AI",
        "AI writing tools",
      ],
    };
  }

  return {
    title: "Bypassr AI — AI Humanizer to Humanize AI Text & Bypass AI Detection",
    description:
      "AI humanizer to bypass Turnitin AI and other detectors. Humanize AI text from ChatGPT—free. Bypass AI detection, pass Turnitin, GPTZero. Bypassr AI makes AI writing undetectable.",
    metadataBase,
    icons,
    openGraph: {
      title: "Bypassr AI — AI Humanizer to Bypass Turnitin AI & AI Detection",
      description:
        "Bypass Turnitin AI and other detectors. Humanize AI text from ChatGPT. Free AI humanizer to bypass AI detection. Try free.",
      url: siteUrl,
      siteName: "BypassrAI",
      images: ogImage,
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary",
      title: "Bypassr AI — AI Humanizer to Humanize AI Text & Bypass AI",
      description: "AI humanizer: humanize AI text and bypass AI detection. Try free.",
    },
    keywords: [
      "bypassr ai",
      "bypass ai",
      "bypassai",
      "bypass turnitin ai",
      "bypass turnitin ai detector",
      "how to pass ai detection",
      "how to bypass turnitin",
      "AI humanizer",
      "humanize AI text",
      "bypass AI detection",
      "Turnitin",
      "GPTZero",
    ],
  };
}

function buildJsonLd() {
  if (isPortfolioMode()) {
    return {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebSite",
          "@id": `${siteUrl}/#website`,
          url: siteUrl,
          name: "Bypassr AI",
          description:
            "AI writing tools: essay help, grammar, summarization, translation, and paraphrasing.",
          potentialAction: {
            "@type": "SearchAction",
            target: { "@type": "EntryPoint", urlTemplate: `${siteUrl}/essay-writer?q={search_term_string}` },
            "query-input": "required name=search_term_string",
          },
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
  }
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: "Bypassr AI",
        description:
          "AI humanizer to bypass Turnitin AI and AI detection. Humanize AI text from ChatGPT. Free tool to make AI writing undetectable.",
        potentialAction: {
          "@type": "SearchAction",
          target: { "@type": "EntryPoint", urlTemplate: `${siteUrl}/humanize?q={search_term_string}` },
          "query-input": "required name=search_term_string",
        },
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
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = buildJsonLd();

  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col font-sans antialiased">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
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
