"use client";

import { useState } from "react";
import { useQuotaModal } from "@/components/QuotaModalContext";
import { isQuotaReachedError } from "@/lib/quota-messages";

const TARGET_LANGUAGES = [
  { value: "English", label: "English" },
  { value: "Spanish", label: "Spanish" },
  { value: "French", label: "French" },
  { value: "German", label: "German" },
  { value: "Italian", label: "Italian" },
  { value: "Portuguese", label: "Portuguese" },
  { value: "Japanese", label: "Japanese" },
  { value: "Chinese", label: "Chinese" },
] as const;

export function TranslatorTool({ wordLimit = 0 }: { wordLimit?: number }) {
  const { openQuotaModal } = useQuotaModal();
  const [input, setInput] = useState("");
  const [targetLanguage, setTargetLanguage] = useState<string>("English");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(output).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 10000);
    });
  };

  const trimmed = input.trim();
  const words = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;
  const atLimit = wordLimit > 0 && words >= wordLimit;

  const translate = async () => {
    if (!trimmed || loading) return;
    setLoading(true);
    setOutput("");
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed, targetLanguage }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const err = data.error || "Something went wrong. Please try again.";
        if (res.status === 403 && isQuotaReachedError(err)) {
          openQuotaModal();
          return;
        }
        setOutput(err);
        return;
      }
      setOutput(data.result ?? "No translation returned.");
    } catch {
      setOutput("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-neutral-900">
          Text to translate
        </h2>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste or type text in any language..."
          rows={8}
          className="w-full resize-y rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
        />
        <div className="mt-2">
          <p className="text-sm text-neutral-500">
            {wordLimit > 0 ? `${words} / ${wordLimit} words` : `${words} words`}
          </p>
          {wordLimit > 0 && (
            <p className="mt-1 text-xs text-neutral-500">
              {wordLimit === 2500 ? "2,500 words per use per request." : `${wordLimit.toLocaleString()} words per use. With a subscription, up to 2,500 words per use.`}
            </p>
          )}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm font-medium text-neutral-700">
            <span>Translate to:</span>
            <select
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
              className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            >
              {TARGET_LANGUAGES.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={translate}
            disabled={!trimmed || loading || atLimit}
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? "Translating…" : "Translate"}
          </button>
        </div>
      </div>

      {output && (
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-semibold text-neutral-900">Translation</h3>
            <button
              type="button"
              onClick={handleCopy}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                copied
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-primary-100 text-primary-700 hover:bg-primary-200"
              }`}
            >
              {copied ? (
                <>
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copied
                </>
              ) : (
                "Copy"
              )}
            </button>
          </div>
          <div className="min-h-[120px] rounded-lg bg-neutral-50 p-4 text-neutral-700 whitespace-pre-wrap">
            {output}
          </div>
        </div>
      )}
    </div>
  );
}
