import Link from "next/link";
import type { Metadata } from "next";
import { isPortfolioMode } from "@/config/site-variant";

const stepsDefault = [
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

const stepsPortfolio = [
  {
    title: "Choose a tool",
    description:
      "Open the Essay Writer for structured drafts, or use Grammar, Summarizer, Translator, or Paraphrase from the Tools menu—depending on what you need.",
  },
  {
    title: "Add your content",
    description:
      "Paste notes, a rough draft, or source material. Each tool guides you: topic and tone for essays, length for summaries, or language pair for translation.",
  },
  {
    title: "Review and edit",
    description:
      "Read the AI suggestion, tweak wording, and run another pass if you want a different tone or shorter summary. You stay in control of the final text.",
  },
  {
    title: "Export and submit",
    description:
      "Copy your polished text into Word, Google Docs, or your LMS. Use grammar and paraphrase passes to tighten clarity before you turn work in.",
  },
];

export async function generateMetadata(): Promise<Metadata> {
  if (isPortfolioMode()) {
    return {
      title: "How it works — AI Writing Tools | Bypassr AI",
      description: "How Bypassr AI helps you write: essay drafts, summaries, grammar, translation, and paraphrasing.",
    };
  }
  return {
    title: "How it works — BypassrAI",
    description: "Learn how BypassrAI humanizes AI text and bypasses detectors.",
  };
}

export default function HowItWorksPage() {
  const portfolio = isPortfolioMode();
  const steps = portfolio ? stepsPortfolio : stepsDefault;

  return (
    <div className="border-b border-neutral-200 bg-page-gradient min-h-[60vh] py-12 sm:py-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <h1 className="text-3xl font-bold text-neutral-900">
          <span className="bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">How it works</span>
        </h1>
        <p className="mt-2 text-neutral-600">
          {portfolio
            ? "Bypassr AI brings essay writing, summarization, grammar, translation, and paraphrasing into one simple workflow."
            : "BypassrAI uses advanced linguistic modeling to rewrite text so it sounds human-written."}
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
          <h2 className="font-semibold text-neutral-900">{portfolio ? "Built for real writing tasks" : "Built on science"}</h2>
          <p className="mt-2 text-neutral-600">
            {portfolio
              ? "Whether you are outlining an essay, condensing a long article, or fixing grammar in a second language, each tool is tuned for clear, usable output you can edit in minutes."
              : "Our rewriting engine is trained on academic writing, essays, and AI-generated text. We analyze syntax, tone, and word patterns commonly flagged by detection systems like GPTZero, Turnitin, and ZeroGPT. We test every rewrite and update our system regularly."}
          </p>
        </div>
        <p className="mt-8">
          <Link
            href={portfolio ? "/essay-writer" : "/humanize"}
            className="font-medium text-primary-600 hover:underline"
          >
            {portfolio ? "Try the Essay Writer →" : "Try the Humanizer →"}
          </Link>
        </p>
      </div>
    </div>
  );
}
