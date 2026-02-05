import { TranslatorTool } from "@/components/TranslatorTool";
import { ToolWithQuotaLimit } from "@/components/ToolWithQuotaLimit";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Translator — BypassrAI",
  description: "Translate text between languages. Choose Spanish, French, German, and more. Free 250 words.",
};

export default function TranslatorPage() {
  return (
    <div className="border-b border-neutral-200 bg-page-gradient py-12 sm:py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <h1 className="text-3xl font-bold text-neutral-900 sm:text-4xl">
          <span className="text-gradient">Translator</span>
        </h1>
        <p className="mt-2 text-neutral-600">
          Paste text in any language and choose a target language. We&apos;ll translate it for you.
        </p>
        <div className="mt-8">
          <ToolWithQuotaLimit defaultWordLimit={500}>
            <TranslatorTool wordLimit={500} />
          </ToolWithQuotaLimit>
        </div>
      </div>
    </div>
  );
}
