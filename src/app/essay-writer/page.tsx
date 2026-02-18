import { EssayWriterClient } from "./EssayWriterClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Essay Writer — Write A+ Essays in Seconds | Bypassr AI",
  description:
    "Write A+ essays in seconds with our free AI essay writer. Set your topic, type, grade level, and style. Get a complete draft, then humanize it to pass AI detection.",
};

export default function EssayWriterPage() {
  return (
    <div className="border-b border-neutral-200 bg-page-gradient py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <h1 className="text-3xl font-bold text-neutral-900 sm:text-4xl">
          <span className="text-gradient">AI Essay Writer</span>
        </h1>
        <p className="mt-2 text-neutral-600">
          Write A+ essays in seconds. Set your topic, type, and style—get a complete draft tailored to your requirements. Then humanize it so it sounds natural and passes AI checks.
        </p>
        <div className="mt-8">
          <EssayWriterClient />
        </div>
      </div>
    </div>
  );
}
