import { HumanizeClient } from "./HumanizeClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Humanizer — Humanize AI Text & Bypass AI Detection | Bypassr AI",
  description:
    "Humanize AI text with our free AI humanizer. Bypass AI detection and pass Turnitin, GPTZero & more. Paste ChatGPT or AI writing and get human-like text in seconds.",
};

export default function HumanizePage() {
  return (
    <div className="border-b border-neutral-200 bg-page-gradient py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <h1 className="text-3xl font-bold text-neutral-900 sm:text-4xl">
          <span className="text-gradient">AI Humanizer</span>
        </h1>
        <p className="mt-2 text-neutral-600">
          Use our AI humanizer to humanize AI text from ChatGPT or any tool. Bypass AI detection and get writing that sounds 100% human.
        </p>
        <div className="mt-8">
          <HumanizeClient />
        </div>
      </div>
    </div>
  );
}
