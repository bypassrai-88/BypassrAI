import { ToolEditor } from "@/components/ToolEditor";
import { ToolWithQuotaLimit } from "@/components/ToolWithQuotaLimit";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Humanizer — BypassrAI",
  description: "Humanize AI-generated text so it passes every AI detector. Try free.",
};

export default function HumanizePage() {
  return (
    <div className="border-b border-neutral-200 bg-page-gradient py-12 sm:py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <h1 className="text-3xl font-bold text-neutral-900 sm:text-4xl">
          <span className="text-gradient">AI Humanizer</span>
        </h1>
        <p className="mt-2 text-neutral-600">
          Paste your AI-generated text. We'll rewrite it to sound 100% human and pass AI
          detection.
        </p>
        <div className="mt-8">
          <ToolWithQuotaLimit defaultWordLimit={500}>
            <ToolEditor
              title="Your Text"
              placeholder="Paste any content — homework, assignment, or AI-generated draft..."
              primaryAction="Humanize"
              secondaryAction="Check for AI"
              wordLimit={500}
              showWordCount
              primaryApiEndpoint="/api/humanize"
              secondaryApiEndpoint="/api/ai-check"
            />
          </ToolWithQuotaLimit>
        </div>
      </div>
    </div>
  );
}
