import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — BypassrAI",
  description: "Terms of service for BypassrAI.",
};

export default function TermsPage() {
  return (
    <div className="border-b border-neutral-200 bg-white py-12 sm:py-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <h1 className="text-3xl font-bold text-neutral-900">Terms of Service</h1>
        <p className="mt-2 text-sm text-neutral-500">Last updated: {new Date().toLocaleDateString("en-US")}</p>
        <div className="prose prose-neutral mt-8 max-w-none">
          <p className="text-neutral-600">
            This is a placeholder. Your terms of service will cover acceptable use, account
            responsibilities, subscription terms, and limitations of liability. Consult a lawyer
            to draft the full terms before launch.
          </p>
        </div>
      </div>
    </div>
  );
}
