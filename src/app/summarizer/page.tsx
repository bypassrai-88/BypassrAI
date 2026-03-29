import { ToolWithQuotaLimit } from "@/components/ToolWithQuotaLimit";
import { SummarizerClient } from "./SummarizerClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Summarizer — BypassrAI",
  description:
    "Summarize articles by pasting text or a link. Headline and preview images when available. Free tier included.",
};

export default function SummarizerPage() {
  return (
    <div className="border-b border-neutral-200 bg-page-gradient py-12 sm:py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <p className="mb-3 inline-flex items-center rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-violet-800">
          Read faster
        </p>
        <h1 className="text-3xl font-bold text-neutral-900 sm:text-4xl">
          <span className="bg-gradient-to-r from-primary-600 via-violet-600 to-primary-500 bg-clip-text text-transparent">
            Summarizer
          </span>
        </h1>
        <p className="mt-2 max-w-2xl text-neutral-600">
          Paste text or drop a link — we pull the headline and images when the page allows it, then give you a tight summary of the main ideas.
        </p>
        <div className="mt-8">
          <ToolWithQuotaLimit defaultWordLimit={500}>
            <SummarizerClient />
          </ToolWithQuotaLimit>
        </div>
      </div>
    </div>
  );
}
