import { HumanizeClient } from "./HumanizeClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Humanizer — Bypass Turnitin AI Detector & Humanize AI Text | Bypassr AI",
  description:
    "Free AI humanizer: humanize AI text and bypass Turnitin AI detector, GPTZero & more. Paste ChatGPT or AI writing—get human-like text in seconds. Bypass AI detection.",
  keywords: [
    "AI humanizer",
    "humanize AI text",
    "bypass turnitin ai",
    "bypass turnitin ai detector",
    "bypass AI detection",
    "bypassr ai",
  ],
  openGraph: {
    title: "AI Humanizer — Bypass Turnitin AI & Humanize AI Text | Bypassr AI",
    description:
      "Humanize AI text and bypass Turnitin AI detector. Free AI humanizer for ChatGPT and AI writing. Get human-like text in seconds.",
    url: "/humanize",
  },
};

export default function HumanizePage() {
  return (
    <div className="border-b border-neutral-200 bg-page-gradient py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <h1 className="text-3xl font-bold text-neutral-900 sm:text-4xl flex items-center gap-3 flex-wrap">
          <span className="text-gradient">AI Humanizer</span>
          <span className="rounded bg-amber-100 px-2 py-0.5 text-sm font-semibold text-amber-800 border border-amber-200">
            V2
          </span>
        </h1>
        <p className="mt-2 text-neutral-600">
          Use our AI humanizer to humanize AI text from ChatGPT or any tool. Bypass Turnitin AI detector, GPTZero, and other checkers—get writing that sounds 100% human.
        </p>
        <div className="mt-8">
          <HumanizeClient />
        </div>
      </div>
    </div>
  );
}
