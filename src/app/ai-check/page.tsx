import { AIChecker } from "@/components/AIChecker";
import { ToolWithQuotaLimit } from "@/components/ToolWithQuotaLimit";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Detector — Check & Bypass AI Detection | Bypassr AI",
  description:
    "Check if your text is flagged as AI. See AI score and flagged phrases. Then use our AI humanizer to humanize AI text and bypass AI detection.",
};

export default function AICheckPage() {
  return (
    <div className="border-b border-neutral-200 bg-page-gradient py-12 sm:py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <h1 className="text-3xl font-bold text-neutral-900 sm:text-4xl">
          <span className="text-gradient">AI Detector</span>
        </h1>
        <p className="mt-2 text-neutral-600">
          Paste your text to see how much of it is likely to be flagged as AI-generated.
          We&apos;ll show a percentage and highlight phrases that look AI-written.
        </p>
        <div className="mt-8">
          <ToolWithQuotaLimit defaultWordLimit={500}>
            <AIChecker wordLimit={500} />
          </ToolWithQuotaLimit>
        </div>
      </div>
    </div>
  );
}
