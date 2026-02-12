import Link from "next/link";
import { HeroCTA, FinalCTA } from "@/components/PricingCTA";

const steps = [
  {
    step: 1,
    title: "Paste Your Text",
    description: "Paste any content — homework, assignment, or AI-generated draft.",
  },
  {
    step: 2,
    title: "Check AI Score",
    description: "See how much of your text is considered human-written.",
  },
  {
    step: 3,
    title: "Humanize",
    description: "Rewrite your text to sound 100% human-written and pass AI detection.",
  },
];

const features = [
  {
    title: "Built on Science, Powered by Precision",
    description:
      "Our rewriting engine is trained on academic writing, essays, and AI-generated text. We analyze syntax, tone, and word patterns commonly flagged by detection systems.",
  },
  {
    title: "Tested Across All AI Detectors",
    description:
      "We test every rewrite against leading tools like GPTZero, Turnitin, ZeroGPT, Quillbot and more. Our system adapts to new detection methods.",
  },
  {
    title: "Trusted by Writers Worldwide",
    description:
      "Students polish writing to sound natural, marketers improve content for engagement, and businesses send emails that feel personal — not robotic.",
  },
];

const testimonials = [
  {
    quote:
      "BypassrAI helped me humanize AI text from ChatGPT in seconds. It made my writing sound real and passed Turnitin easily. This tool saved my grade.",
    author: "Julia K.",
    role: "Student",
  },
  {
    quote:
      "I've tried several tools to bypass AI detectors, but nothing compares. It's fast, accurate, and the free humanize feature is a lifesaver.",
    author: "Liam R.",
    role: "Content Writer",
  },
  {
    quote:
      "The best thing? I can humanize my text and rewrite AI drafts without losing quality. It feels like a real editor polished it.",
    author: "Sophie M.",
    role: "Freelancer",
  },
];

const faqs = [
  { q: "How does BypassrAI work?", a: "You paste your text, optionally check the AI score, then click Humanize. Our engine rewrites the content to sound natural while keeping your meaning." },
  { q: "Does it bypass Turnitin and other AI checkers?", a: "We test against leading detectors and update our system regularly. Results vary by detector; we aim for human-like output." },
  { q: "How much does it cost?", a: "Try it free. Sign up for a 7-day free trial or a monthly plan for more. Cancel anytime." },
  { q: "What languages are supported?", a: "English is fully supported. More languages may be added later." },
];

const detectors = ["Turnitin", "Copyleaks", "ZeroGPT", "Quillbot", "Grammarly", "GPTZero"];

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-neutral-200 bg-hero-gradient">
        <div className="relative mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-24">
          <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-primary-600">
            Trusted by 1,000,000+ users
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl">
            <span className="text-gradient">Humanize</span> AI Text & Outsmart Detectors
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-neutral-600">
            Turn ChatGPT and other AI drafts into natural, undetectable writing—so it passes
            every AI checker.
          </p>
          <HeroCTA />
        </div>
      </section>

      {/* Detector logos */}
      <section className="border-b border-neutral-200 bg-neutral-50/80 py-10">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <p className="mb-6 text-sm font-semibold uppercase tracking-wider text-neutral-500">
            Built to bypass the detectors that matter
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {detectors.map((name) => (
              <span
                key={name}
                className="text-sm font-medium text-neutral-500"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* 3 steps */}
      <section className="border-b border-neutral-200 bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-3xl font-bold text-neutral-900">
            Humanize AI Writing in 3 Simple Steps
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-neutral-600">
            Perfect for essays, assignments, blog posts and research papers
          </p>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {steps.map((s) => (
              <div key={s.step} className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition hover:border-primary-200 hover:shadow-md">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary-100 text-primary-700 font-bold">
                  {s.step}
                </span>
                <h3 className="mt-4 text-lg font-semibold text-neutral-900">{s.title}</h3>
                <p className="mt-2 text-neutral-600">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-b border-neutral-200 bg-neutral-50 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="space-y-16">
            {features.map((f, i) => (
              <div key={i} className="flex flex-col gap-6 md:flex-row md:items-center">
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-neutral-900">{f.title}</h3>
                  <p className="mt-3 text-neutral-600">{f.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-b border-neutral-200 bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-3xl font-bold text-neutral-900">
            What our users say
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {testimonials.map((t, i) => (
              <blockquote key={i} className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                <p className="text-neutral-700">"{t.quote}"</p>
                <footer className="mt-4">
                  <cite className="font-semibold not-italic text-neutral-900">{t.author}</cite>
                  <span className="text-neutral-500">, {t.role}</span>
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-b border-neutral-200 bg-neutral-50 py-16 sm:py-24">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <h2 className="text-center text-3xl font-bold text-neutral-900">FAQ</h2>
          <dl className="mt-12 space-y-6">
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
                <dt className="font-semibold text-neutral-900">{faq.q}</dt>
                <dd className="mt-2 text-neutral-600">{faq.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-bold text-neutral-900">
            Make Your Text Sound Human — Instantly
          </h2>
          <p className="mt-4 text-neutral-600">
            Turn robotic, AI-generated content into clear, natural writing. Whether it's from
            ChatGPT or another tool, BypassrAI helps you bypass AI detectors in one click.
          </p>
          <FinalCTA />
        </div>
      </section>
    </div>
  );
}
