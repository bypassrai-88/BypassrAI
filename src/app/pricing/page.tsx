import type { Metadata } from "next";
import { StartTrialButton, PlanCheckoutButton, PricingFooter } from "@/components/PricingCTA";

export const metadata: Metadata = {
  title: "Pricing — BypassrAI",
  description: "Simple, transparent pricing. Start free, then choose Lite, Pro, or Premium. Humanize, paraphrase, and bypass AI detection.",
};

const paidPlans = [
  {
    name: "Lite",
    tagline: "Perfect to get started",
    price: "$4.99",
    period: "per month",
    words: "5,000 words",
    features: [
      "5,000 words every month",
      "Up to 2,500 words per use",
      "All tools: Humanizer, AI Detector, Paraphraser, Summarizer, Grammar, Translator",
      "Cancel anytime — no commitment",
    ],
    cta: "Get Lite",
    planId: "lite",
    primary: false,
  },
  {
    name: "Pro",
    tagline: "Most popular",
    price: "$9.99",
    period: "per month",
    words: "25,000 words",
    features: [
      "25,000 words every month",
      "Up to 2,500 words per use",
      "Everything in Lite",
      "Ideal for students & regular writers",
      "Cancel anytime",
    ],
    cta: "Get Pro",
    planId: "pro",
    primary: true,
  },
  {
    name: "Premium",
    tagline: "For power users",
    price: "$25",
    period: "per month",
    words: "250,000 words",
    features: [
      "250,000 words every month",
      "Up to 2,500 words per use",
      "Everything in Pro",
      "Heavy usage: agencies, teams, long-form",
      "Cancel anytime",
    ],
    cta: "Get Premium",
    planId: "premium",
    primary: false,
  },
];

export default function PricingPage() {
  return (
    <div className="border-b border-neutral-200 bg-page-gradient min-h-[60vh]">
      {/* Hero */}
      <div className="border-b border-neutral-200/80 py-12 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h1 className="text-3xl font-bold text-neutral-900 sm:text-4xl">
            <span className="bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">Simple pricing.</span> No surprises.
          </h1>
          <p className="mt-4 text-lg text-neutral-600">
            Start with a free trial, then choose the plan that fits. All paid plans include every tool, up to 2,500 words per use, and cancel anytime.
          </p>
        </div>
      </div>

      {/* Paid plans */}
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h2 className="text-center text-2xl font-bold text-neutral-900">
          Choose your plan
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-neutral-600">
          All plans include every tool. Upgrade or downgrade anytime.
        </p>
        <div className="mt-10 grid gap-8 sm:grid-cols-3">
          {paidPlans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border-2 p-6 ${
                plan.primary
                  ? "border-primary-500 bg-white shadow-lg ring-2 ring-primary-500/20"
                  : "border-neutral-200 bg-white shadow-md"
              }`}
            >
              {plan.primary && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary-600 px-3 py-0.5 text-xs font-medium text-white">
                  Best value
                </span>
              )}
              {plan.tagline === "Most popular" && !plan.primary && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-neutral-800 px-3 py-0.5 text-xs font-medium text-white">
                  Most popular
                </span>
              )}
              <h3 className="text-xl font-bold text-neutral-900">{plan.name}</h3>
              <p className="mt-1 text-sm text-neutral-600">{plan.tagline}</p>
              <p className="mt-6 flex items-baseline gap-1">
                <span className="text-3xl font-bold text-neutral-900">{plan.price}</span>
                <span className="text-neutral-500">{plan.period}</span>
              </p>
              <p className="mt-1 text-sm font-medium text-primary-600">{plan.words}</p>
              <ul className="mt-6 space-y-3">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-neutral-700">
                    <span className="mt-0.5 text-primary-500">✓</span> {f}
                  </li>
                ))}
              </ul>
              <PlanCheckoutButton
                planId={plan.planId as "lite" | "pro" | "premium"}
                cta={plan.cta}
                primary={plan.primary}
              />
            </div>
          ))}
        </div>

        {/* Free trial — below subscriptions */}
        <div className="mx-auto mt-14 max-w-md">
          <div className="rounded-xl border border-primary-200 bg-primary-50/30 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-neutral-900">Free trial</h2>
            <p className="mt-1 text-neutral-600">7 days, then choose</p>
            <p className="mt-4 text-2xl font-bold text-neutral-900">$0</p>
            <p className="text-sm text-neutral-500">5,000 words for 7 days · up to 2,500 words per use</p>
            <ul className="mt-4 space-y-2 text-sm text-neutral-600">
              <li className="flex items-center gap-2"><span className="text-primary-500">✓</span> Create an account (or log in)</li>
              <li className="flex items-center gap-2"><span className="text-primary-500">✓</span> Add your card in Stripe — charged only after 7 days</li>
              <li className="flex items-center gap-2"><span className="text-primary-500">✓</span> Converts to Lite ($4.99/mo) unless you cancel</li>
            </ul>
            <StartTrialButton />
          </div>
        </div>
      </div>

      <PricingFooter />
    </div>
  );
}
