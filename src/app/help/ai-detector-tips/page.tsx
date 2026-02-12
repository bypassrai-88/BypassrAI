import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Detector Tips — How to Pass AI Detection — BypassrAI",
  description:
    "Tips to pass AI detectors like GPTZero, Turnitin, and ZeroGPT. Humanize AI text, check your score, and make writing sound natural.",
};

export default function AiDetectorTipsPage() {
  return (
    <div className="border-b border-neutral-200 bg-page-gradient min-h-[60vh] py-12 sm:py-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <nav className="mb-6 text-sm text-neutral-500">
          <Link href="/help" className="hover:text-primary-600">Help</Link>
          <span className="mx-2">/</span>
          <span className="text-neutral-700">AI detector tips</span>
        </nav>
        <h1 className="text-3xl font-bold text-neutral-900">
          AI Detector Tips: How to Pass AI Detection
        </h1>
        <p className="mt-2 text-lg text-neutral-600">
          AI detectors look for patterns that suggest machine-generated text. Here’s how to improve your odds of passing and what tools can help.
        </p>

        <div className="mt-10 prose prose-neutral max-w-none">
          <h2 className="text-xl font-semibold text-neutral-900 mt-8">How do AI detectors work?</h2>
          <p className="text-neutral-600 mt-2">
            Most AI detectors analyze sentence length, word choice, repetition, and overall “smoothness.” AI text tends to be very even and predictable. Human writing is messier — more variation in structure and tone. The goal is to make your text varied and natural enough that detectors don’t flag it.
          </p>

          <h2 className="text-xl font-semibold text-neutral-900 mt-8">Tip 1: Humanize before you submit</h2>
          <p className="text-neutral-600 mt-2">
            Use an <strong>AI humanizer</strong> to rewrite AI-generated (or AI-assisted) text. A good humanizer changes phrasing and structure while keeping your meaning, so the result reads more human and is less likely to be flagged.
          </p>
          <p className="mt-4">
            <Link href="/humanize" className="inline-flex items-center font-medium text-primary-600 hover:underline">
              Use the AI Humanizer →
            </Link>
          </p>

          <h2 className="text-xl font-semibold text-neutral-900 mt-8">Tip 2: Check your AI score first</h2>
          <p className="text-neutral-600 mt-2">
            Paste your draft into an <Link href="/ai-check" className="text-primary-600 hover:underline">AI detector</Link> to see how “AI” it looks. If the score is high, humanize that section and check again. It’s a simple loop: check → humanize → check.
          </p>

          <h2 className="text-xl font-semibold text-neutral-900 mt-8">Tip 3: Add your own voice</h2>
          <p className="text-neutral-600 mt-2">
            After humanizing, edit the text yourself. Add a few sentences in your own style, fix anything that sounds off, and vary paragraph length. The more it sounds like you, the better it will do with detectors.
          </p>

          <h2 className="text-xl font-semibold text-neutral-900 mt-8">Tip 4: Don’t rely on one detector</h2>
          <p className="text-neutral-600 mt-2">
            Different tools (GPTZero, Turnitin, ZeroGPT, Copyleaks, etc.) use different models. Text that passes one might still get flagged by another. Test with the detector your school or client uses if you can, and aim for “human-like” overall rather than a single score.
          </p>

          <div className="mt-10 rounded-xl border border-primary-200 bg-primary-50/30 p-6">
            <h2 className="text-lg font-semibold text-neutral-900">Humanize + detect in one place</h2>
            <p className="mt-2 text-neutral-600">
              BypassrAI lets you humanize text and check your AI score. Try free, or{" "}
              <Link href="/pricing" className="font-medium text-primary-600 hover:underline">get a plan</Link> for more.
            </p>
            <p className="mt-4 flex flex-wrap gap-3">
              <Link href="/humanize" className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
                Humanize
              </Link>
              <Link href="/ai-check" className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50">
                Check AI score
              </Link>
            </p>
          </div>
        </div>

        <p className="mt-10">
          <Link href="/help" className="text-sm text-primary-600 hover:underline">← Back to Help</Link>
        </p>
      </div>
    </div>
  );
}
