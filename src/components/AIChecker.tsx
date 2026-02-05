"use client";

import { useState } from "react";
import { useQuotaModal } from "@/components/QuotaModalContext";
import { isQuotaReachedError } from "@/lib/quota-messages";

type AICheckResult = {
  score: number;
  summary: string;
  flaggedPhrases: string[];
};

/** Find all [start, end] ranges for phrases in text; merge overlapping. */
function getFlaggedRanges(text: string, phrases: string[]): [number, number][] {
  const ranges: [number, number][] = [];
  for (const phrase of phrases) {
    if (!phrase.trim()) continue;
    let pos = 0;
    while (true) {
      const i = text.indexOf(phrase, pos);
      if (i === -1) break;
      ranges.push([i, i + phrase.length]);
      pos = i + 1;
    }
  }
  if (ranges.length === 0) return [];
  ranges.sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [ranges[0]];
  for (let i = 1; i < ranges.length; i++) {
    const [s, e] = ranges[i];
    const last = merged[merged.length - 1];
    if (s <= last[1]) {
      last[1] = Math.max(last[1], e);
    } else {
      merged.push([s, e]);
    }
  }
  return merged;
}

function HighlightedText({
  text,
  flaggedPhrases,
}: {
  text: string;
  flaggedPhrases: string[];
}) {
  const ranges = getFlaggedRanges(text, flaggedPhrases);
  if (ranges.length === 0) {
    return <span className="whitespace-pre-wrap">{text}</span>;
  }
  const parts: { text: string; highlight: boolean }[] = [];
  let pos = 0;
  for (const [start, end] of ranges) {
    if (pos < start) {
      parts.push({ text: text.slice(pos, start), highlight: false });
    }
    parts.push({ text: text.slice(start, end), highlight: true });
    pos = end;
  }
  if (pos < text.length) {
    parts.push({ text: text.slice(pos), highlight: false });
  }
  return (
    <span className="whitespace-pre-wrap">
      {parts.map((p, i) =>
        p.highlight ? (
          <mark
            key={i}
            className="rounded bg-amber-200/80 px-0.5 text-neutral-900"
            title="Flagged as likely AI-generated"
          >
            {p.text}
          </mark>
        ) : (
          <span key={i}>{p.text}</span>
        )
      )}
    </span>
  );
}

function scoreColor(score: number): string {
  if (score <= 30) return "text-emerald-600";
  if (score <= 60) return "text-amber-600";
  return "text-red-600";
}

function scoreBgColor(score: number): string {
  if (score <= 30) return "bg-emerald-50 border-emerald-200";
  if (score <= 60) return "bg-amber-50 border-amber-200";
  return "bg-red-50 border-red-200";
}

export function AIChecker({
  wordLimit = 0,
}: {
  wordLimit?: number;
}) {
  const { openQuotaModal } = useQuotaModal();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AICheckResult | null>(null);

  const trimmed = input.trim();
  const words = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;
  const atLimit = wordLimit > 0 && words >= wordLimit;

  const runCheck = async () => {
    if (!trimmed || loading) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/ai-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const err = data.error || `Error (${res.status}). Please try again.`;
        if (res.status === 403 && isQuotaReachedError(err)) {
          openQuotaModal();
          return;
        }
        setError(err);
        return;
      }
      if (typeof data.score !== "number") {
        setError("Invalid response from server.");
        return;
      }
      setResult({
        score: data.score,
        summary: data.summary ?? "",
        flaggedPhrases: Array.isArray(data.flaggedPhrases) ? data.flaggedPhrases : [],
      });
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-neutral-900">Your Text</h2>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste the text you want to check for AI..."
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
          {loading ? "Checking…" : "Check for AI"}
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {result && (
        <>
          <div
            className={`rounded-xl border p-6 shadow-sm ${scoreBgColor(result.score)}`}
          >
            <h3 className="mb-4 font-semibold text-neutral-900">AI Score</h3>
            <div className="flex flex-wrap items-center gap-6">
              <div
                className={`flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-full border-2 bg-white text-2xl font-bold ${scoreColor(result.score)}`}
                aria-label={`${result.score}% AI likelihood`}
              >
                {result.score}%
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-neutral-600">
                  {result.score <= 30 && "Likely human-written"}
                  {result.score > 30 && result.score <= 60 && "Mixed — some AI-like patterns"}
                  {result.score > 60 && "Likely AI-generated"}
                </p>
                {result.summary && (
                  <p className="mt-2 text-neutral-700">{result.summary}</p>
                )}
              </div>
            </div>
          </div>

          {result.flaggedPhrases.length > 0 && (
            <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
              <h3 className="mb-2 font-semibold text-neutral-900">
                Flagged phrases
              </h3>
              <p className="mb-4 text-sm text-neutral-500">
                These parts of your text were flagged as likely AI-generated.
              </p>
              <div className="min-h-[120px] rounded-lg bg-neutral-50 p-4 text-neutral-700">
                <HighlightedText
                  text={trimmed}
                  flaggedPhrases={result.flaggedPhrases}
                />
              </div>
            </div>
          )}

          {result.flaggedPhrases.length === 0 && result.summary && (
            <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
              <h3 className="mb-2 font-semibold text-neutral-900">Your text</h3>
              <div className="min-h-[80px] rounded-lg bg-neutral-50 p-4 text-neutral-700 whitespace-pre-wrap">
                {trimmed}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
