"use client";

import { useState } from "react";
import { useQuotaModal } from "@/components/QuotaModalContext";
import { isQuotaReachedError } from "@/lib/quota-messages";

const MARKER_OPEN = "[[C]]";
const MARKER_CLOSE = "[[/C]]";

/** Split grammar API result into segments; odd-indexed segments are changes. */
function parseGrammarResult(result: string): { text: string; changed: boolean }[] {
  const segments: { text: string; changed: boolean }[] = [];
  const regex = /\[\[C\]\]([\s\S]*?)\[\[\/C\]\]/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(result)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: result.slice(lastIndex, match.index), changed: false });
    }
    segments.push({ text: match[1], changed: true });
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < result.length) {
    segments.push({ text: result.slice(lastIndex), changed: false });
  }
  if (segments.length === 0) {
    segments.push({ text: result.replace(/\s*\[\[C\]\]|\[\[\/C\]\]\s*/g, ""), changed: false });
  }
  return segments;
}

/** Strip markers for copy. */
function stripMarkers(text: string): string {
  return text.replace(/\[\[C\]\]|\[\[\/C\]\]/g, "").trim();
}

export function GrammarChecker({ wordLimit = 0 }: { wordLimit?: number }) {
  const { openQuotaModal } = useQuotaModal();
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(stripMarkers(output)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 10000);
    });
  };

  const trimmed = input.trim();
  const words = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;
  const atLimit = wordLimit > 0 && words >= wordLimit;

  const runCheck = async () => {
    if (!trimmed || loading) return;
    setLoading(true);
    setOutput("");
    try {
      const res = await fetch("/api/grammar-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed }),
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
      setOutput(data.result ?? "");
    } catch {
      setOutput("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const segments = output ? parseGrammarResult(output) : [];
  const hasMarkers = segments.some((s) => s.changed);
  const displayOutput = hasMarkers ? (
    <span className="whitespace-pre-wrap">
      {segments.map((seg, i) =>
        seg.changed ? (
          <mark
            key={i}
            className="rounded bg-emerald-200/80 px-0.5 text-neutral-900"
            title="Corrected"
          >
            {seg.text}
          </mark>
        ) : (
          <span key={i}>{seg.text}</span>
        )
      )}
    </span>
  ) : (
    <span className="whitespace-pre-wrap">{stripMarkers(output)}</span>
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-neutral-900">Text to check</h2>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste or type the text you want to proofread for grammar, spelling, and punctuation..."
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
        <button
          type="button"
          onClick={runCheck}
          disabled={!trimmed || loading || atLimit}
          className="mt-4 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
        >
          {loading ? "Checking…" : "Check grammar"}
        </button>
      </div>

      {output && (
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-neutral-900">Corrected text</h3>
              {hasMarkers && (
                <p className="mt-0.5 text-xs text-neutral-500">
                  Green highlights show what was changed.
                </p>
              )}
            </div>
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
          <div className="min-h-[120px] rounded-lg bg-neutral-50 p-4 text-neutral-700">
            {displayOutput}
          </div>
        </div>
      )}
    </div>
  );
}
