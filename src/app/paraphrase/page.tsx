import { ToolEditor } from "@/components/ToolEditor";
import { ToolWithQuotaLimit } from "@/components/ToolWithQuotaLimit";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Paraphraser — BypassrAI",
  description: "Paraphrase text to sound natural and avoid plagiarism. Free 250 words.",
};

export default function ParaphrasePage() {
  return (
    <div className="border-b border-neutral-200 bg-page-gradient py-12 sm:py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <h1 className="text-3xl font-bold text-neutral-900 sm:text-4xl">
          <span className="text-gradient">Paraphraser</span>
        </h1>
        <p className="mt-2 text-neutral-600">
          Rewrite sentences and paragraphs in your own words. Keep the meaning, change the
          wording. Perfect for essays and articles.
        </p>
        <div className="mt-8">
          <ToolWithQuotaLimit defaultWordLimit={500}>
            <ToolEditor
              title="Text to paraphrase"
              placeholder="Paste or type the text you want to rewrite in your own words..."
              primaryAction="Paraphrase"
              wordLimit={500}
              showWordCount
              resultTitle="Paraphrased text"
              resultPlaceholder="Your paraphrased version will appear here."
              primaryApiEndpoint="/api/paraphrase"
            />
          </ToolWithQuotaLimit>
        </div>
      </div>
    </div>
  );
}
