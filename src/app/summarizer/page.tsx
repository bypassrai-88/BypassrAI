import { ToolEditor } from "@/components/ToolEditor";
import { ToolWithQuotaLimit } from "@/components/ToolWithQuotaLimit";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Summarizer — BypassrAI",
  description: "Summarize long text into short, clear summaries. Free 250 words.",
};

export default function SummarizerPage() {
  return (
    <div className="border-b border-neutral-200 bg-page-gradient py-12 sm:py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <h1 className="text-3xl font-bold text-neutral-900 sm:text-4xl">
          <span className="text-gradient">Summarizer</span>
        </h1>
        <p className="mt-2 text-neutral-600">
          Paste long articles, essays, or documents. Get a concise summary that keeps the main points.
        </p>
        <div className="mt-8">
          <ToolWithQuotaLimit defaultWordLimit={500}>
            <ToolEditor
              title="Text to summarize"
              placeholder="Paste long articles, essays, or documents here..."
              primaryAction="Summarize"
              wordLimit={500}
              showWordCount
              resultTitle="Summary"
              resultPlaceholder="A concise summary will appear here."
              primaryApiEndpoint="/api/summarize"
            />
          </ToolWithQuotaLimit>
        </div>
      </div>
    </div>
  );
}
