import Link from "next/link";
import { HeroCTA, FinalCTA } from "@/components/PricingCTA";
import { ScrollReveal } from "@/components/ScrollReveal";

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
  { q: "How does the AI humanizer work?", a: "You paste your text, optionally check the AI score, then click Humanize. Our engine rewrites the content to sound natural while keeping your meaning. Humanize AI text in one click." },
  { q: "Can I bypass AI detection and Turnitin?", a: "We test against leading detectors (Turnitin, GPTZero, etc.) and update our system regularly. Use our AI humanizer to bypass AI detection; results vary by detector." },
  { q: "How much does it cost?", a: "Try it free. Sign up for a 7-day free trial or a monthly plan for more. Cancel anytime." },
  { q: "What languages are supported?", a: "English is fully supported. More languages may be added later." },
];

const detectors = ["Turnitin", "Copyleaks", "ZeroGPT", "Quillbot", "Grammarly", "GPTZero"];

export default function HomePage() {
  return (
    <div className="overflow-x-hidden">
      {/* Hero */}
      <section className="relative min-h-[85vh] overflow-hidden border-b border-neutral-200/80 bg-hero-gradient sm:min-h-[80vh]">
        {/* Soft floating blobs */}
        <div className="pointer-events-none absolute -left-32 top-20 h-72 w-72 rounded-full bg-primary-200/40 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -right-32 top-40 h-96 w-96 rounded-full bg-primary-100/50 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute bottom-20 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-primary-300/30 blur-3xl" aria-hidden />

        <div className="relative mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 sm:py-28">
          <ScrollReveal variant="fade-up" delay={0}>
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary-200/80 bg-white/80 px-4 py-1.5 text-sm font-semibold tracking-wide text-primary-700 shadow-soft backdrop-blur-sm">
              Trusted by 1,000,000+ users
            </p>
          </ScrollReveal>
          <ScrollReveal variant="fade-up" delay={80}>
            <h1 className="text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl">
              <span className="text-gradient">Humanize</span> AI Text & Bypass AI Detection
            </h1>
          </ScrollReveal>
          <ScrollReveal variant="fade-up" delay={160}>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-neutral-600">
              Free AI humanizer: turn ChatGPT and AI drafts into natural, undetectable writing. Humanize AI content and bypass every AI checker.
            </p>
          </ScrollReveal>
          <ScrollReveal variant="fade-up" delay={240}>
            <HeroCTA />
          </ScrollReveal>
        </div>
      </section>

      {/* Detector logos */}
      <section className="border-b border-neutral-200/80 bg-white/60 py-14 backdrop-blur-sm">
        <ScrollReveal variant="fade-in" className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <p className="mb-8 text-sm font-semibold uppercase tracking-wider text-neutral-500">
            Built to bypass the detectors that matter
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-5">
            {detectors.map((name, i) => (
              <span
                key={name}
                className="rounded-2xl bg-white/80 px-5 py-2.5 text-sm font-medium text-neutral-600 shadow-bubble transition hover:shadow-bubble-lg"
              >
                {name}
              </span>
            ))}
          </div>
        </ScrollReveal>
      </section>

      {/* 3 steps */}
      <section className="border-b border-neutral-200/80 bg-[#f5f5f7] py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <ScrollReveal variant="fade-up">
            <h2 className="text-center text-3xl font-bold text-neutral-900 sm:text-4xl">
              Humanize AI Writing in 3 Simple Steps
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-center text-neutral-600">
              Use our AI humanizer for essays, assignments, blog posts and research papers. Bypass AI detectors easily.
            </p>
          </ScrollReveal>
          <div className="mt-16 grid gap-6 sm:grid-cols-3">
            {steps.map((s, i) => (
              <ScrollReveal key={s.step} variant="fade-up" delay={i * 100}>
                <div className="group rounded-3xl border border-neutral-200/80 bg-white p-8 shadow-bubble transition hover:border-primary-200 hover:shadow-bubble-lg">
                  <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-100 text-lg font-bold text-primary-700 transition group-hover:bg-primary-200">
                    {s.step}
                  </span>
                  <h3 className="mt-5 text-xl font-semibold text-neutral-900">{s.title}</h3>
                  <p className="mt-3 text-neutral-600">{s.description}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-b border-neutral-200/80 bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="space-y-24">
            {features.map((f, i) => (
              <ScrollReveal
                key={i}
                variant={i % 2 === 0 ? "slide-right" : "slide-left"}
                delay={i * 80}
              >
                <div className="flex flex-col gap-6 md:flex-row md:items-center">
                  <div className="flex-1 rounded-3xl border border-neutral-200/80 bg-neutral-50/50 p-8 shadow-soft md:p-10">
                    <h3 className="text-2xl font-bold text-neutral-900">{f.title}</h3>
                    <p className="mt-4 text-neutral-600">{f.description}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-b border-neutral-200/80 bg-[#f5f5f7] py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <ScrollReveal variant="fade-up">
            <h2 className="text-center text-3xl font-bold text-neutral-900 sm:text-4xl">
              What our users say
            </h2>
          </ScrollReveal>
          <div className="mt-16 grid gap-6 sm:grid-cols-3">
            {testimonials.map((t, i) => (
              <ScrollReveal key={i} variant="scale-in" delay={i * 120}>
                <blockquote className="rounded-3xl border border-neutral-200/80 bg-white p-8 shadow-bubble transition hover:shadow-bubble-lg">
                  <p className="text-neutral-700">"{t.quote}"</p>
                  <footer className="mt-6">
                    <cite className="font-semibold not-italic text-neutral-900">{t.author}</cite>
                    <span className="text-neutral-500">, {t.role}</span>
                  </footer>
                </blockquote>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-b border-neutral-200/80 bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <ScrollReveal variant="fade-up">
            <h2 className="text-center text-3xl font-bold text-neutral-900">FAQ</h2>
          </ScrollReveal>
          <dl className="mt-16 space-y-4">
            {faqs.map((faq, i) => (
              <ScrollReveal key={i} variant="fade-up" delay={i * 60}>
                <div className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-soft transition hover:shadow-bubble">
                  <dt className="font-semibold text-neutral-900">{faq.q}</dt>
                  <dd className="mt-2 text-neutral-600">{faq.a}</dd>
                </div>
              </ScrollReveal>
            ))}
          </dl>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-[#f5f5f7] py-20 sm:py-28">
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
          <ScrollReveal variant="fade-up">
            <h2 className="text-3xl font-bold text-neutral-900 sm:text-4xl">
              AI Humanizer — Make Your Text Sound Human Instantly
            </h2>
            <p className="mt-5 text-neutral-600">
              Turn robotic, AI-generated content into clear, natural writing. Whether it's from
              ChatGPT or another tool, Bypassr AI helps you bypass AI detectors in one click.
            </p>
            <FinalCTA />
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
