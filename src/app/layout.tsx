import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { QuotaModalProvider } from "@/components/QuotaModalContext";

export const metadata: Metadata = {
  title: "BypassrAI — Humanize AI Text & Bypass AI Detectors",
  description:
    "Convert AI-generated content into human-sounding text that passes every AI detection tool. Humanize, paraphrase, and check AI score.",
  icons: {
    icon: "/favicon.png",
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
