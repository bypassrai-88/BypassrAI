import Link from "next/link";
import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://bypassrai.com";

const howToSchema = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to Bypass Turnitin — Free Tool That Works",
  description: "How to bypass Turnitin and get around Turnitin AI detection: use an AI humanizer, check your score, and follow best practices.",
  step: [
    { "@type": "HowToStep", name: "Use an AI humanizer", text: "Paste your draft into an AI humanizer. It rewrites text so it sounds more natural and is harder for Turnitin to flag." },
    { "@type": "HowToStep", name: "Check before you submit", text: "Run your humanized text through an AI detector. If it still reads as too AI-like, humanize again or edit a few sentences." },
    { "@type": "HowToStep", name: "Best practices", text: "Humanize in chunks for long essays. Always read and edit the result. Don't rely on a single detector." },
  ],
  url: `${siteUrl}/help/bypass-turnitin`,
};

export const metadata: Metadata = {
  alternates: { canonical: "/help/bypass-turnitin" },
  title: "How to Bypass Turnitin — Free Tool That Works | Bypassr AI",
  description:
    "How to bypass Turnitin in 3 steps. Free AI humanizer — 500 words, no signup. Pass Turnitin & GPTZero. Try the tool now.",
  keywords: [
    "how to bypass turnitin",
    "bypass turnitin",
    "how to get around turnitin",
    "bypass turnitin ai",
    "bypass turnitin ai detector",
    "AI humanizer",
    "bypassr ai",
  ],
  openGraph: {
    title: "How to Bypass Turnitin — Free Tool | Bypassr AI",
    description:
      "How to bypass Turnitin in 3 steps. Free humanizer — try now.",
    url: "/help/bypass-turnitin",
  },
};

export default function BypassTurnitinPage() {
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Help", item: `${siteUrl}/help` },
      { "@type": "ListItem", position: 2, name: "How to Bypass Turnitin", item: `${siteUrl}/help/bypass-turnitin` },
    ],
  };
  return (
    <div className="border-b border-neutral-200 bg-page-gradient min-h-[60vh] py-12 sm:py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <nav className="mb-6 text-sm text-neutral-500">
          <Link href="/help" className="hover:text-primary-600">Help</Link>
          <span className="mx-2">/</span>
          <span className="text-neutral-700">Bypass Turnitin</span>
        </nav>
        <h1 className="text-3xl font-bold text-neutral-900">
          How to Bypass Turnitin & Pass AI Detection
        </h1>
        <p className="mt-2 text-lg text-neutral-600">
          Wondering how to bypass Turnitin or get around Turnitin’s AI detector? Humanize your text so it passes. Free tool below — no signup for 500 words.
        </p>

        <div className="mt-6 rounded-xl border-2 border-primary-200 bg-primary-50/50 p-5 sm:p-6">
          <p className="font-semibold text-neutral-900">Try the free humanizer now</p>
          <p className="mt-1 text-sm text-neutral-600">Paste your text → Humanize → Pass Turnitin. No account needed for 500 words.</p>
          <Link href="/humanize" className="mt-4 inline-block rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700">
            Open AI Humanizer →
          </Link>
        </div>

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

          <h2 className="text-xl font-semibold text-neutral-900 mt-8">How to get around Turnitin’s AI checker</h2>
          <p className="text-neutral-600 mt-2">
            To <strong>get around Turnitin</strong> and similar tools, you need writing that doesn’t match the patterns they’re trained to flag. Using an AI humanizer, then checking with an AI detector and doing light edits, is the most practical approach. No method is 100% — detectors update — but humanizing plus your own edits gives you the best chance to pass.
          </p>

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
        <p className="mt-4 text-sm text-neutral-500">
          Related: <Link href="/help/ai-detector-tips" className="font-medium text-primary-600 hover:underline">How to pass AI detection</Link>
        </p>
      </div>
    </div>
  );
}
