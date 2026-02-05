"use client";

import { useState } from "react";
import { useQuotaModal } from "@/components/QuotaModalContext";
import { isQuotaReachedError } from "@/lib/quota-messages";

type ToolEditorProps = {
  title: string;
  placeholder?: string;
  primaryAction: string;
  secondaryAction?: string;
  wordLimit?: number;
  showWordCount?: boolean;
  /** Placeholder text shown in result area before API is connected */
  resultPlaceholder?: string;
  /** Label for the output area (e.g. "Paraphrased text", "Corrected text", "Summary") */
  resultTitle?: string;
  /** If set, primary button POSTs text to this API and shows response (e.g. /api/humanize) */
  primaryApiEndpoint?: string;
  /** If set, secondary button POSTs text to this API and shows response (e.g. /api/ai-check) */
  secondaryApiEndpoint?: string;
};

export function ToolEditor({
  title,
  placeholder = "Paste your text here...",
  primaryAction,
  secondaryAction,
  wordLimit = 0,
  showWordCount = true,
  resultPlaceholder = "[Result will appear here after API is connected.]",
  resultTitle = "Result",
  primaryApiEndpoint,
  secondaryApiEndpoint,
}: ToolEditorProps) {
  const { openQuotaModal } = useQuotaModal();
  const [input, setInput] = useState("");
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

  const callApi = async (endpoint: string, text: string): Promise<string> => {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = data.error || `Error (${res.status}). Please try again.`;
      if (res.status === 403 && isQuotaReachedError(err)) {
        openQuotaModal();
        return "";
      }
      return err;
    }
    return data.humanized ?? data.result ?? data.error ?? "Something went wrong.";
  };

  const handlePrimary = async () => {
    if (!input.trim() || loading) return;
    setLoading(true);
    setOutput("");
    try {
      if (primaryApiEndpoint) {
        const result = await callApi(primaryApiEndpoint, trimmed);
        if (result !== "") setOutput(result);
      } else {
        await new Promise((r) => setTimeout(r, 800));
        setOutput(resultPlaceholder);
      }
    } catch {
      setOutput("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSecondary = async () => {
    if (!input.trim() || loading) return;
    setLoading(true);
    setOutput("");
    try {
      if (secondaryApiEndpoint) {
        const result = await callApi(secondaryApiEndpoint, trimmed);
        if (result !== "") setOutput(result);
      } else {
        await new Promise((r) => setTimeout(r, 600));
        setOutput(resultPlaceholder);
      }
    } catch {
      setOutput("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-neutral-900">{title}</h2>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          rows={8}
          className="w-full resize-y rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
        />
        {showWordCount && (
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
        )}
        <div className="mt-4 flex flex-wrap gap-3">
          {secondaryAction && (
            <button
              type="button"
              onClick={handleSecondary}
              disabled={!input.trim() || loading}
              className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-50"
            >
              {secondaryAction}
            </button>
          )}
          <button
            type="button"
            onClick={handlePrimary}
            disabled={!input.trim() || loading || atLimit}
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? "Processing…" : primaryAction}
          </button>
        </div>
      </div>

      {output && (
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-semibold text-neutral-900">{resultTitle}</h3>
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
