import { GrammarChecker } from "@/components/GrammarChecker";
import { ToolWithQuotaLimit } from "@/components/ToolWithQuotaLimit";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Grammar Checker — BypassrAI",
  description: "Check and fix grammar, spelling, and punctuation. See what was changed. Free 250 words.",
};

export default function GrammarCheckerPage() {
  return (
    <div className="border-b border-neutral-200 bg-page-gradient py-12 sm:py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <h1 className="text-3xl font-bold text-neutral-900 sm:text-4xl">
          <span className="text-gradient">Grammar Checker</span>
        </h1>
        <p className="mt-2 text-neutral-600">
          Paste your text to check grammar, spelling, and punctuation. Corrected text appears below with changes highlighted in green.
        </p>
        <div className="mt-8">
          <ToolWithQuotaLimit defaultWordLimit={500}>
            <GrammarChecker wordLimit={500} />
          </ToolWithQuotaLimit>
        </div>
      </div>
    </div>
  );
}
