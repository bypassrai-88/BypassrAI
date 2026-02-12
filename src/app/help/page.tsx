import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Help & FAQ — BypassrAI",
  description: "Frequently asked questions about humanizing AI text and bypassing detectors.",
};

const faqs = [
  {
    q: "How does BypassrAI work?",
    a: "You paste your text, optionally check the AI score, then click Humanize or Paraphrase. Our engine rewrites the content to sound natural while keeping your meaning. We analyze syntax, tone, and word patterns commonly flagged by detection systems.",
  },
  {
    q: "Does BypassrAI bypass Turnitin and other AI checkers?",
    a: "We test every rewrite against leading detectors like GPTZero, Turnitin, ZeroGPT, Quillbot and more. Our system is updated regularly to adapt to new detection methods. Results vary by detector; we aim for human-like output.",
  },
  {
    q: "How much does it cost?",
    a: "You get 250 words free (no account). Then create an account for a free trial with more words. After that, subscribe to a monthly plan for higher limits or unlimited use. See our Pricing page for details.",
  },
  {
    q: "What languages does BypassrAI support?",
    a: "English is fully supported. More languages may be added in the future.",
  },
  {
    q: "I want to humanize a long essay. Is that possible?",
    a: "Yes. Free users have a 250-word limit; trial and paid users get higher limits. Check the Pricing page for your plan's word limit.",
  },
  {
    q: "I reached my word limit. How can I extend it?",
    a: "Create an account to get a free trial. If you've used your trial, subscribe to a monthly plan for more words.",
  },
  {
    q: "Can I see previous humanizations?",
    a: "History of past humanizations may be available in your account in a future update. For now, copy and save your results if you need them later.",
  },
  {
    q: "How do I cancel my subscription?",
    a: "Log in and go to your account or Manage subscription. You can cancel anytime; you'll keep access until the end of your billing period.",
  },
  {
    q: "Does Google penalize AI-generated content?",
    a: "Google's guidance focuses on helpful, original content. Humanized text that reads naturally and adds value is generally in line with their guidelines. We don't guarantee SEO outcomes.",
  },
];

export default function HelpPage() {
  return (
    <div className="border-b border-neutral-200 bg-page-gradient min-h-[60vh] py-12 sm:py-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <h1 className="text-3xl font-bold text-neutral-900">
          <span className="bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">Help & FAQ</span>
        </h1>
        <p className="mt-2 text-neutral-600">
          Find answers to common questions. Need more help?{" "}
          <Link href="/contact" className="font-medium text-primary-600 hover:underline">
            Contact us
          </Link>
          .
        </p>
        <dl className="mt-10 space-y-6">
          {faqs.map((faq, i) => (
            <div key={i} className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
              <dt className="font-semibold text-neutral-900">{faq.q}</dt>
              <dd className="mt-2 text-neutral-600">{faq.a}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-10 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-neutral-900">Guides & articles</h2>
          <ul className="mt-3 space-y-2">
            <li>
              <Link href="/help/humanize-ai-text-for-school" className="text-primary-600 hover:underline">
                How to humanize AI text for school
              </Link>
            </li>
            <li>
              <Link href="/help/bypass-turnitin" className="text-primary-600 hover:underline">
                How to bypass Turnitin AI detection
              </Link>
            </li>
            <li>
              <Link href="/help/ai-detector-tips" className="text-primary-600 hover:underline">
                AI detector tips: pass AI detection
              </Link>
            </li>
            <li>
              <Link href="/help/how-it-works" className="text-primary-600 hover:underline">
                How it works
              </Link>
            </li>
          </ul>
        </div>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href="/humanize"
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            Try Humanizer
          </Link>
          <Link
            href="/pricing"
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Pricing
          </Link>
          <Link
            href="/contact"
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Contact us
          </Link>
        </div>
      </div>
    </div>
  );
}
