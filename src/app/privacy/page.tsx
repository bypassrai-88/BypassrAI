import type { Metadata } from "next";
import { isPortfolioMode } from "@/config/site-variant";

export const metadata: Metadata = {
  title: "Privacy Policy — BypassrAI",
  description: "Privacy policy for BypassrAI.",
};

export default function PrivacyPage() {
  const portfolio = isPortfolioMode();

  return (
    <div className="border-b border-neutral-200 bg-white py-12 sm:py-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <h1 className="text-3xl font-bold text-neutral-900">Privacy Policy</h1>
        <p className="mt-2 text-sm text-neutral-500">Last updated: {new Date().toLocaleDateString("en-US")}</p>
        <div className="prose prose-neutral mt-8 max-w-none">
          <p className="text-neutral-600">
            This is a placeholder. Your privacy policy will describe how BypassrAI collects, uses,
            and protects user data, including{" "}
            {portfolio
              ? "text you submit to writing tools (e.g. essay writer, summarizer), "
              : "text submitted for humanization, "}
            account information, and cookies. Consult a lawyer to draft the full policy before launch.
          </p>
        </div>
      </div>
    </div>
  );
}
