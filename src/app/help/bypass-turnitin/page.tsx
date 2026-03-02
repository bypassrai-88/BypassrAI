import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How to Bypass Turnitin AI Detection — Bypassr AI",
  description:
    "Bypass Turnitin AI detector: humanize AI text so it passes. Use an AI humanizer to make AI writing read as human-written. Tips and tools that work.",
  keywords: [
    "bypass turnitin ai",
    "bypass turnitin ai detector",
    "turnitin AI detection",
    "AI humanizer",
    "humanize AI text",
    "bypassr ai",
  ],
  openGraph: {
    title: "How to Bypass Turnitin AI Detection — Bypassr AI",
    description:
      "Bypass Turnitin AI detector. Humanize AI text with an AI humanizer. Make your writing pass Turnitin.",
    url: "/help/bypass-turnitin",
  },
};

export default function BypassTurnitinPage() {
  return (
    <div className="border-b border-neutral-200 bg-page-gradient min-h-[60vh] py-12 sm:py-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <nav className="mb-6 text-sm text-neutral-500">
          <Link href="/help" className="hover:text-primary-600">Help</Link>
          <span className="mx-2">/</span>
          <span className="text-neutral-700">Bypass Turnitin</span>
        </nav>
        <h1 className="text-3xl font-bold text-neutral-900">
          How to Bypass Turnitin AI Detection
        </h1>
        <p className="mt-2 text-lg text-neutral-600">
          Turnitin and other tools can flag AI-written text. Here’s how to humanize your writing so it’s less likely to be detected.
        </p>

        <div className="mt-10 prose prose-neutral max-w-none">
          <h2 className="text-xl font-semibold text-neutral-900 mt-8">What does Turnitin detect?</h2>
          <p className="text-neutral-600 mt-2">
            Turnitin’s AI detection looks at patterns in your writing — sentence structure, word choice, and consistency. Text that’s too uniform or “AI-like” can get flagged. Humanizing changes those patterns while keeping your meaning and ideas.
          </p>

          <h2 className="text-xl font-semibold text-neutral-900 mt-8">Use an AI humanizer</h2>
          <p className="text-neutral-600 mt-2">
            An <strong>AI humanizer</strong> rewrites text so it sounds more natural and varied. You paste in your draft (whether you wrote it or AI helped), and the tool outputs a version that’s harder for detectors like Turnitin to flag. It’s not a guarantee — detectors update — but it’s one of the most effective approaches.
          </p>
          <p className="mt-4">
            <Link href="/humanize" className="inline-flex items-center font-medium text-primary-600 hover:underline">
              Try BypassrAI Humanizer →
            </Link>
          </p>

          <h2 className="text-xl font-semibold text-neutral-900 mt-8">Check before you submit</h2>
          <p className="text-neutral-600 mt-2">
            Run your humanized text through an <Link href="/ai-check" className="text-primary-600 hover:underline">AI detector</Link> to see how it scores. If it still reads as too AI-like, humanize again or edit a few sentences yourself. Combining a humanizer with light editing usually gives the best result.
          </p>

          <h2 className="text-xl font-semibold text-neutral-900 mt-8">Best practices</h2>
          <ul className="mt-2 list-disc list-inside space-y-2 text-neutral-600">
            <li>Humanize in chunks if your essay is long (stay within your plan’s word limit per use).</li>
            <li>Always read and edit the result — make it sound like you.</li>
            <li>Don’t rely on a single detector; use your humanizer and then re-check.</li>
          </ul>

          <div className="mt-10 rounded-xl border border-primary-200 bg-primary-50/30 p-6">
            <h2 className="text-lg font-semibold text-neutral-900">Humanize and bypass detectors</h2>
            <p className="mt-2 text-neutral-600">
              BypassrAI is built to produce human-sounding text that passes AI checkers. Try free, or{" "}
              <Link href="/pricing" className="font-medium text-primary-600 hover:underline">view plans</Link> for more.
            </p>
            <p className="mt-4">
              <Link href="/humanize" className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
                Humanize now
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
