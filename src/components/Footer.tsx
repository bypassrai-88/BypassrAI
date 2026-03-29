import Link from "next/link";
import { isPortfolioMode } from "@/config/site-variant";

const productsDefault = [
  { href: "/humanize", label: "AI Humanizer" },
  { href: "/essay-writer", label: "Essay Writer" },
  { href: "/summarizer", label: "Summarizer" },
];

const productsPortfolio = [
  { href: "/essay-writer", label: "Essay Writer" },
  { href: "/summarizer", label: "Summarizer" },
];

const toolsDefault = [
  { href: "/grammar-checker", label: "Grammar checker" },
  { href: "/translator", label: "Translator" },
];

const toolsPortfolio = [
  { href: "/grammar-checker", label: "Grammar checker" },
  { href: "/translator", label: "Translator" },
  { href: "/paraphrase", label: "Paraphrase" },
];

const resourcesDefault = [
  { href: "/pricing", label: "Pricing" },
  { href: "/help", label: "FAQ" },
  { href: "/help/how-it-works", label: "How it works" },
  { href: "/help/humanize-ai-text-for-school", label: "Humanize AI for school" },
  { href: "/help/bypass-turnitin", label: "How to bypass Turnitin" },
  { href: "/help/ai-detector-tips", label: "How to pass AI detection" },
  { href: "/contact", label: "Contact" },
];

const resourcesPortfolio = [
  { href: "/pricing", label: "Pricing" },
  { href: "/help", label: "FAQ" },
  { href: "/help/how-it-works", label: "How it works" },
  { href: "/contact", label: "Contact" },
];

const legal = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
];

export function Footer() {
  const portfolio = isPortfolioMode();
  const products = portfolio ? productsPortfolio : productsDefault;
  const tools = portfolio ? toolsPortfolio : toolsDefault;
  const resources = portfolio ? resourcesPortfolio : resourcesDefault;
  const tagline = portfolio
    ? "Essays, grammar, summaries, translation, and more."
    : "Humanize AI text. Bypass detectors. Sound human.";

  return (
    <footer className="border-t border-neutral-200/80 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-5">
          <div>
            <p className="mb-4 font-semibold text-neutral-900">
              <span className="text-primary-600">Bypassr</span>AI
            </p>
            <p className="text-sm text-neutral-500">{tagline}</p>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold text-neutral-900">Products</h3>
            <ul className="space-y-2.5">
              {products.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="inline-block rounded-xl px-2 py-1 text-sm text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-primary-600 hover:no-underline">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold text-neutral-900">Tools</h3>
            <ul className="space-y-2.5">
              {tools.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="inline-block rounded-xl px-2 py-1 text-sm text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-primary-600 hover:no-underline">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold text-neutral-900">Resources</h3>
            <ul className="space-y-2.5">
              {resources.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="inline-block rounded-xl px-2 py-1 text-sm text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-primary-600 hover:no-underline">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold text-neutral-900">Legal</h3>
            <ul className="space-y-2.5">
              {legal.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="inline-block rounded-xl px-2 py-1 text-sm text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-primary-600 hover:no-underline">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-12 rounded-2xl border border-neutral-200/80 bg-neutral-50/50 py-6 text-center text-sm text-neutral-500">
          © {new Date().getFullYear()} BypassrAI. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
