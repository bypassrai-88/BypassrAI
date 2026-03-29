import { EssayWriterClient } from "./EssayWriterClient";
import type { Metadata } from "next";
import { isPortfolioMode } from "@/config/site-variant";

export async function generateMetadata(): Promise<Metadata> {
  if (isPortfolioMode()) {
    return {
      title: "AI Essay Writer — Draft & Refine Essays | Bypassr AI",
      description:
        "Free AI essay writer: set topic, type, grade level, and style. Get a structured draft, then refine with grammar and paraphrase tools.",
    };
  }
  return {
    title: "AI Essay Writer — Write A+ Essays in Seconds | Bypassr AI",
    description:
      "Write A+ essays in seconds with our free AI essay writer. Set your topic, type, grade level, and style. Get a complete draft, then humanize it to pass AI detection.",
  };
}

export default function EssayWriterPage() {
  const portfolio = isPortfolioMode();

  return (
    <div className="border-b border-neutral-200 bg-page-gradient py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <p className="inline-flex items-center rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-800">
            Writing studio
          </p>
          <span className="hidden text-neutral-300 sm:inline" aria-hidden>
            ·
          </span>
          <p className="text-sm font-medium text-neutral-500">Configure → generate → refine</p>
        </div>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-neutral-900 sm:text-5xl">
          <span className="bg-gradient-to-r from-primary-600 via-emerald-600 to-violet-600 bg-clip-text text-transparent">
            AI Essay Writer
          </span>
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-relaxed text-neutral-600 sm:text-lg">
          {portfolio
            ? "Draft stronger essays in minutes. Set your topic, type, and style—get a structured outline or full draft, then polish with our grammar and paraphrase tools."
            : "Write A+ essays in seconds. Set your topic, type, and style—get a complete draft tailored to your requirements. Then humanize it so it sounds natural and passes AI checks."}
        </p>
        <div className="mt-10">
          <EssayWriterClient />
        </div>
      </div>
    </div>
  );
}
