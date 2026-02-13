"use client";

import { useState, useEffect, useRef } from "react";
import { useQuotaModal } from "@/components/QuotaModalContext";
import { isQuotaReachedError } from "@/lib/quota-messages";

const DEFAULT_LOADING_MESSAGES = [
  "Analyzing structure and flow…",
  "Rewriting with natural variation…",
  "Refining word choice and phrasing…",
  "Adjusting rhythm and tone…",
  "Applying human writing patterns…",
  "Finalizing your humanized text…",
];

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
  /** "sideBySide" = input left, output right; "stacked" = classic vertical */
  layout?: "stacked" | "sideBySide";
  /** Rotating messages shown in loading overlay (e.g. humanizer steps). Uses default list if not provided and overlay is used. */
  loadingMessages?: string[];
  /** When true, show "Humanize again" on output that re-runs primary action on the current output */
  showHumanizeAgain?: boolean;
  /** Label for the "humanize again" button (e.g. "Humanize again") */
  humanizeAgainLabel?: string;
  /** Pre-fill the input (e.g. from essay writer "Humanize next") */
  initialInput?: string;
  /** When true, run primary action once with initialInput after mount */
  autoRunPrimary?: boolean;
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
  layout = "stacked",
  loadingMessages,
  showHumanizeAgain = false,
  humanizeAgainLabel = "Humanize again",
  initialInput,
  autoRunPrimary = false,
}: ToolEditorProps) {
  const { openQuotaModal } = useQuotaModal();
  const [input, setInput] = useState(initialInput ?? "");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const messages = loadingMessages ?? (layout === "sideBySide" ? DEFAULT_LOADING_MESSAGES : undefined);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const autoRunDone = useRef(false);

  useEffect(() => {
    if (initialInput != null) setInput(initialInput);
  }, [initialInput]);

  useEffect(() => {
    if (!autoRunPrimary || !initialInput?.trim() || !primaryApiEndpoint || autoRunDone.current) return;
    autoRunDone.current = true;
    setInput(initialInput);
    setLoading(true);
    setOutput("");
    (async () => {
      try {
        const result = await callApi(primaryApiEndpoint, initialInput.trim());
        if (result !== "") setOutput(result);
      } catch {
        setOutput("Something went wrong. Please try again.");
      } finally {
        setLoading(false);
      }
    })();
  }, [autoRunPrimary, initialInput, primaryApiEndpoint]);

  useEffect(() => {
    if (!loading || !messages?.length) return;
    const id = setInterval(() => {
      setLoadingMessageIndex((i) => (i + 1) % messages.length);
    }, 1800);
    return () => clearInterval(id);
  }, [loading, messages]);

  const handleCopy = () => {
    navigator.clipboard.writeText(output).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 10000);
    });
  };

  const trimmed = input.trim();
  const words = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;
  const atLimit = wordLimit > 0 && words >= wordLimit;

  const callApi = async (endpoint: string, text: string, extra?: Record<string, unknown>): Promise<string> => {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, ...extra }),
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

  const handleHumanizeAgain = async () => {
    if (!output.trim() || !primaryApiEndpoint || loading) return;
    const outputWords = output.trim().split(/\s+/).filter(Boolean).length;
    if (wordLimit > 0 && outputWords > wordLimit) return;
    setLoading(true);
    try {
      const result = await callApi(primaryApiEndpoint, output.trim(), { refine: true });
      if (result !== "") setOutput(result);
    } catch {
      setOutput("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const outputWords = output.trim() ? output.trim().split(/\s+/).filter(Boolean).length : 0;
  const outputAtLimit = wordLimit > 0 && outputWords >= wordLimit;

  const inputPanel = (
    <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-neutral-900">{title}</h2>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={placeholder}
        rows={layout === "sideBySide" ? 14 : 8}
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
  );

  const outputPanel = (
    <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm flex flex-col min-h-[320px]">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold text-neutral-900">{resultTitle}</h3>
        <div className="flex items-center gap-2">
          {showHumanizeAgain && output.trim() && (
            <button
              type="button"
              onClick={handleHumanizeAgain}
              disabled={loading || outputAtLimit}
              className="rounded-lg border border-primary-300 bg-primary-50 px-4 py-2 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-100 disabled:opacity-50"
            >
              {humanizeAgainLabel}
            </button>
          )}
          {output && (
            <button
              type="button"
              onClick={handleCopy}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                copied ? "bg-emerald-100 text-emerald-800" : "bg-primary-100 text-primary-700 hover:bg-primary-200"
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
          )}
        </div>
      </div>
      <div className="min-h-[120px] flex-1 rounded-lg bg-neutral-50 p-4 text-neutral-700 whitespace-pre-wrap">
        {loading && !output ? (
          <span className="text-neutral-400">Processing…</span>
        ) : output ? (
          output
        ) : (
          <span className="text-neutral-400">{resultPlaceholder}</span>
        )}
      </div>
    </div>
  );

  return (
    <div className="relative mx-auto max-w-7xl">
      {/* Loading overlay: pop-up spinner + rotating message */}
      {loading && messages?.length ? (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-black/40 backdrop-blur-sm"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="flex flex-col items-center gap-4 rounded-2xl bg-white px-8 py-8 shadow-xl">
            <div className="h-14 w-14 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
            <p className="text-center text-lg font-medium text-neutral-800">
              {messages[loadingMessageIndex]}
            </p>
          </div>
        </div>
      ) : null}

      {layout === "sideBySide" ? (
        <div className="grid gap-6 md:grid-cols-2">
          {inputPanel}
          {outputPanel}
        </div>
      ) : (
        <div className="space-y-6">
          {inputPanel}
          {output ? outputPanel : null}
        </div>
      )}
    </div>
  );
}
