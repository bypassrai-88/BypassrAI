import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How to Humanize AI Text for School — BypassrAI",
  description:
    "Step-by-step guide to humanize AI-generated essays and assignments so they pass AI detectors and sound natural. Free tools for students.",
};

export default function HumanizeAiTextForSchoolPage() {
  return (
    <div className="border-b border-neutral-200 bg-page-gradient min-h-[60vh] py-12 sm:py-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <nav className="mb-6 text-sm text-neutral-500">
          <Link href="/help" className="hover:text-primary-600">Help</Link>
          <span className="mx-2">/</span>
          <span className="text-neutral-700">Humanize AI text for school</span>
        </nav>
        <h1 className="text-3xl font-bold text-neutral-900">
          How to Humanize AI Text for School
        </h1>
        <p className="mt-2 text-lg text-neutral-600">
          Use AI to draft your essays, then humanize the text so it sounds like you wrote it and passes AI detection. Here’s how.
        </p>

        <div className="mt-10 prose prose-neutral max-w-none">
          <h2 className="text-xl font-semibold text-neutral-900 mt-8">Why humanize AI text for school?</h2>
          <p className="text-neutral-600 mt-2">
            Many schools and teachers use AI detectors (like Turnitin, GPTZero, or Copyleaks). If your draft is flagged as AI-written, you could face consequences. Humanizing AI text rewrites it so it keeps your ideas but uses natural sentence structure, tone, and variation that detectors are less likely to flag.
          </p>

          <h2 className="text-xl font-semibold text-neutral-900 mt-8">Step 1: Draft with AI</h2>
          <p className="text-neutral-600 mt-2">
            Use ChatGPT, Claude, or any AI tool to generate a first draft. Get your ideas and structure down. Don’t worry about sounding “human” yet — that’s the next step.
          </p>

          <h2 className="text-xl font-semibold text-neutral-900 mt-8">Step 2: Humanize the text</h2>
          <p className="text-neutral-600 mt-2">
            Copy your draft and paste it into an <strong>AI humanizer</strong>. Tools like BypassrAI rewrite the content to sound natural while keeping your meaning. You get human-sounding text that’s still yours in substance.
          </p>
          <p className="mt-4">
            <Link href="/humanize" className="inline-flex items-center font-medium text-primary-600 hover:underline">
              Try the AI Humanizer →
            </Link>
          </p>

          <h2 className="text-xl font-semibold text-neutral-900 mt-8">Step 3: Check the result (optional)</h2>
          <p className="text-neutral-600 mt-2">
            Run the humanized text through an <Link href="/ai-check" className="text-primary-600 hover:underline">AI detector</Link> to see how “human” it scores. If needed, humanize again or tweak a few sentences yourself.
          </p>

          <h2 className="text-xl font-semibold text-neutral-900 mt-8">Step 4: Edit and submit</h2>
          <p className="text-neutral-600 mt-2">
            Read through the humanized version, fix any phrasing you don’t like, and add your own voice. Then submit with confidence.
          </p>

          <div className="mt-10 rounded-xl border border-primary-200 bg-primary-50/30 p-6">
            <h2 className="text-lg font-semibold text-neutral-900">Get started free</h2>
            <p className="mt-2 text-neutral-600">
              BypassrAI gives you 2 free uses with no signup. For more words and a 7-day free trial,{" "}
              <Link href="/pricing" className="font-medium text-primary-600 hover:underline">see Pricing</Link>.
            </p>
            <p className="mt-4">
              <Link href="/humanize" className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
                Humanize AI text now
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
