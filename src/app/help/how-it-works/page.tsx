import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How it works — BypassrAI",
  description: "Learn how BypassrAI humanizes AI text and bypasses detectors.",
};

const steps = [
  {
    title: "Paste your text",
    description:
      "Copy any AI-generated or human-written text into the Humanizer, Paraphraser, or AI Detector. We support essays, assignments, blog posts, and more.",
  },
  {
    title: "Check AI score (optional)",
    description:
      "Use the AI Detector to see how much of your text is likely to be flagged as AI-written. This helps you decide what to humanize.",
  },
  {
    title: "Humanize or paraphrase",
    description:
      "Click Humanize to rewrite text so it sounds natural and passes detectors. Or use Paraphraser to reword content in your own style while keeping the meaning.",
  },
  {
    title: "Use your result",
    description:
      "Copy the result and paste it wherever you need it. Our engine preserves your meaning while changing syntax, tone, and patterns that detectors flag.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="border-b border-neutral-200 bg-page-gradient min-h-[60vh] py-12 sm:py-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <h1 className="text-3xl font-bold text-neutral-900">
          <span className="bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">How it works</span>
        </h1>
        <p className="mt-2 text-neutral-600">
          BypassrAI uses advanced linguistic modeling to rewrite text so it sounds human-written.
        </p>
        <div className="mt-10 space-y-8">
          {steps.map((step, i) => (
            <div key={i} className="flex gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700 font-semibold">
                {i + 1}
              </span>
              <div>
                <h2 className="text-lg font-semibold text-neutral-900">{step.title}</h2>
                <p className="mt-1 text-neutral-600">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-12 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-neutral-900">Built on science</h2>
          <p className="mt-2 text-neutral-600">
            Our rewriting engine is trained on academic writing, essays, and AI-generated text.
            We analyze syntax, tone, and word patterns commonly flagged by detection systems like
            GPTZero, Turnitin, and ZeroGPT. We test every rewrite and update our system regularly.
          </p>
        </div>
        <p className="mt-8">
          <Link href="/humanize" className="font-medium text-primary-600 hover:underline">
            Try the Humanizer →
          </Link>
        </p>
      </div>
    </div>
  );
}
