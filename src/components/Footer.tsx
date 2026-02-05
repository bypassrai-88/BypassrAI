import Link from "next/link";

const products = [
  { href: "/humanize", label: "AI Humanizer" },
  { href: "/ai-check", label: "AI Detector" },
];

const tools = [
  { href: "/paraphrase", label: "Paraphraser" },
  { href: "/grammar-checker", label: "Grammar checker" },
  { href: "/summarizer", label: "Summarizer" },
  { href: "/translator", label: "Translator" },
];

const resources = [
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
  return (
    <footer className="border-t border-neutral-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-5">
          <div>
            <p className="mb-4 font-semibold text-neutral-900">
              <span className="text-primary-600">Bypassr</span>AI
            </p>
            <p className="text-sm text-neutral-500">
              Humanize AI text. Bypass detectors. Sound human.
            </p>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold text-neutral-900">Products</h3>
            <ul className="space-y-2">
              {products.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-neutral-500 hover:text-primary-600">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold text-neutral-900">Tools</h3>
            <ul className="space-y-2">
              {tools.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-neutral-500 hover:text-primary-600">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold text-neutral-900">Resources</h3>
            <ul className="space-y-2">
              {resources.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-neutral-500 hover:text-primary-600">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold text-neutral-900">Legal</h3>
            <ul className="space-y-2">
              {legal.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-neutral-500 hover:text-primary-600">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t border-neutral-200 pt-8 text-center text-sm text-neutral-500">
          © {new Date().getFullYear()} BypassrAI. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
