import Link from "next/link";
import { ScrollReveal } from "@/components/ScrollReveal";

const toolPills = ["Essay Writer", "Grammar", "Summarize", "Translate", "Paraphrase"];

const steps = [
  {
    step: 1,
    title: "Pick a tool",
    description: "Choose essay help, grammar fixes, a summary, translation, or paraphrasing—whatever fits your task.",
  },
  {
    step: 2,
    title: "Add your text",
    description: "Paste a draft, notes, or homework. Our AI suggests clear improvements while you keep control of the final wording.",
  },
  {
    step: 3,
    title: "Refine and use",
    description: "Edit the output, run another pass if needed, then copy your polished text into your document or LMS.",
  },
];

const features = [
  {
    title: "One place for everyday writing",
    description:
      "From essays to emails, Bypassr AI bundles the tools students and professionals use most—without juggling five different tabs.",
  },
  {
    title: "Fast, readable suggestions",
    description:
      "Get structured feedback and rewrites that stay close to your meaning, so you spend less time fixing robotic phrasing.",
  },
  {
    title: "Built for real workflows",
    description:
      "Short assignments, long papers, and quick translations all fit the same simple flow: paste, improve, export.",
  },
];

const testimonials = [
  {
    quote:
      "I use it for outlines and grammar passes before I submit. It’s like having a second pair of eyes on structure and clarity.",
    author: "Jordan M.",
    role: "Student",
  },
  {
    quote:
      "Summaries and translations save me a ton of time at work. The interface is straightforward and the results are easy to tweak.",
    author: "Alex R.",
    role: "Analyst",
  },
  {
    quote:
      "I’m not a native English speaker—the grammar and paraphrase tools help me sound more natural without losing my voice.",
    author: "Priya S.",
    role: "Grad student",
  },
];

const faqs = [
  {
    q: "What can I do with Bypassr AI?",
    a: "Draft and refine essays, check grammar, summarize long text, translate between languages, and paraphrase for clarity—all from one suite of tools.",
  },
  {
    q: "Is there a free tier?",
    a: "Yes. You can try the tools with a free word allowance; sign up for a trial or plan when you need higher limits.",
  },
  {
    q: "Do you store my documents?",
    a: "We treat your text as yours. See our Privacy Policy for how data is handled and retained.",
  },
  {
    q: "What languages are supported?",
    a: "English is fully supported across tools. Translation covers many language pairs—check the translator for your needs.",
  },
];

const heroCtaClass =
  "inline-flex shrink-0 rounded-full bg-primary-600 px-8 py-4 text-base font-semibold text-white shadow-bubble transition hover:bg-primary-700 hover:shadow-bubble-lg";
const finalCtaClass =
  "mt-6 inline-flex rounded-full bg-primary-600 px-8 py-4 text-base font-semibold text-white shadow-bubble transition hover:bg-primary-700 hover:shadow-bubble-lg";

export function HomePortfolio() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };

  return (
    <div className="overflow-x-hidden">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <section className="relative min-h-[85vh] overflow-hidden border-b border-neutral-200/80 bg-hero-gradient sm:min-h-[80vh]">
        <div className="pointer-events-none absolute -left-32 top-20 h-72 w-72 rounded-full bg-primary-200/40 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -right-32 top-40 h-96 w-96 rounded-full bg-primary-100/50 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute bottom-20 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-primary-300/30 blur-3xl" aria-hidden />

        <div className="relative mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 sm:py-28">
          <ScrollReveal variant="fade-up" delay={0}>
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary-200/80 bg-white/80 px-4 py-1.5 text-sm font-semibold tracking-wide text-primary-700 shadow-soft backdrop-blur-sm">
              AI writing suite
            </p>
          </ScrollReveal>
          <ScrollReveal variant="fade-up" delay={80}>
            <h1 className="text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl">
              <span className="text-gradient">Bypassr AI</span> — Essays, Grammar, Translate &amp; More
            </h1>
          </ScrollReveal>
          <ScrollReveal variant="fade-up" delay={160}>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-neutral-600">
              An all-in-one AI writing assistant: essay help, grammar, summarization, translation, and paraphrasing—built for students and professionals.
            </p>
          </ScrollReveal>
          <ScrollReveal variant="fade-up" delay={240}>
            <div className="mt-8 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
              <Link href="/essay-writer" className={heroCtaClass}>
                Try Essay Writer
              </Link>
              <Link
                href="/grammar-checker"
                className="inline-flex shrink-0 rounded-full border-2 border-primary-200 bg-white/90 px-8 py-4 text-base font-semibold text-primary-700 shadow-soft transition hover:bg-primary-50"
              >
                Grammar &amp; tools
              </Link>
            </div>
            <p className="mt-3 text-sm text-neutral-500">Free to try · Sign in for trial or plans</p>
          </ScrollReveal>
        </div>
      </section>

      <section className="border-b border-neutral-200/80 bg-white/60 py-14 backdrop-blur-sm">
        <ScrollReveal variant="fade-in" className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <p className="mb-8 text-sm font-semibold uppercase tracking-wider text-neutral-500">
            Tools in one workspace
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
            {toolPills.map((name) => (
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

      <section className="border-b border-neutral-200/80 bg-[#f5f5f7] py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <ScrollReveal variant="fade-up">
            <h2 className="text-center text-3xl font-bold text-neutral-900 sm:text-4xl">How it works</h2>
            <p className="mx-auto mt-3 max-w-xl text-center text-neutral-600">
              Three simple steps from rough draft to polished text.
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
          <p className="mt-10 text-center text-neutral-600">
            <Link href="/help/how-it-works" className="font-medium text-primary-600 hover:underline">
              How it works
            </Link>
            {" · "}
            <Link href="/pricing" className="font-medium text-primary-600 hover:underline">
              Pricing
            </Link>
          </p>
        </div>
      </section>

      <section className="border-b border-neutral-200/80 bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="space-y-24">
            {features.map((f, i) => (
              <ScrollReveal key={i} variant={i % 2 === 0 ? "slide-right" : "slide-left"} delay={i * 80}>
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

      <section className="border-b border-neutral-200/80 bg-[#f5f5f7] py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <ScrollReveal variant="fade-up">
            <h2 className="text-center text-3xl font-bold text-neutral-900 sm:text-4xl">What people say</h2>
          </ScrollReveal>
          <div className="mt-16 grid gap-6 sm:grid-cols-3">
            {testimonials.map((t, i) => (
              <ScrollReveal key={i} variant="scale-in" delay={i * 120}>
                <blockquote className="rounded-3xl border border-neutral-200/80 bg-white p-8 shadow-bubble transition hover:shadow-bubble-lg">
                  <p className="text-neutral-700">&ldquo;{t.quote}&rdquo;</p>
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

      <section className="bg-[#f5f5f7] py-20 sm:py-28">
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
          <ScrollReveal variant="fade-up">
            <h2 className="text-3xl font-bold text-neutral-900 sm:text-4xl">Start with the Essay Writer</h2>
            <p className="mt-5 text-neutral-600">
              Or jump into grammar, summaries, translation, or paraphrasing from the Tools menu.
            </p>
            <Link href="/essay-writer" className={finalCtaClass}>
              Open Essay Writer
            </Link>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
