"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useQuotaModal } from "@/components/QuotaModalContext";
import { isQuotaReachedError } from "@/lib/quota-messages";
import { HUMANIZE_INPUT_STORAGE_KEY } from "@/lib/humanize-storage";

const PAPER_TYPES = [
  "Essay",
  "Narrative",
  "Argumentative",
  "Analytical",
  "Expository",
  "Comparative",
  "Research paper",
  "Literature review",
];

const PURPOSES = [
  "Inform",
  "Persuade",
  "Analyze",
  "Compare and contrast",
  "Describe",
  "Explain",
  "Argue",
  "Reflect",
];

const GRADE_LEVELS = ["Middle school", "High school", "University"];

const FORMATS = ["APA", "MLA", "Chicago", "No specific format"];

const TONES = ["Formal", "Semi-formal", "Creative", "Emotional", "Neutral"];

const VOCABULARY_LEVELS = ["Simple", "Intermediate", "Advanced"];

const POINTS_OF_VIEW = ["First person (I)", "Third person (he/she/they)"];

const LOADING_MESSAGES = [
  "Analyzing your requirements…",
  "Structuring the essay…",
  "Drafting sections…",
  "Refining tone and style…",
  "Finalizing your essay…",
];

type FormState = {
  typeOfPaper: string;
  topic: string;
  purpose: string;
  gradeLevel: string;
  format: string;
  wordCount: number;
  tone: string;
  vocabulary: string;
  pointOfView: string;
  includeQuotes: boolean;
  additionalRequirements: string;
};

const defaultForm: FormState = {
  typeOfPaper: "Essay",
  topic: "",
  purpose: "Inform",
  gradeLevel: "High school",
  format: "No specific format",
  wordCount: 500,
  tone: "Formal",
  vocabulary: "Intermediate",
  pointOfView: "Third person (he/she/they)",
  includeQuotes: false,
  additionalRequirements: "",
};

const selectClass =
  "w-full rounded-2xl border-0 bg-white/80 px-4 py-3 text-neutral-800 shadow-sm ring-1 ring-neutral-200/80 transition focus:ring-2 focus:ring-primary-400/50 focus:outline-none";

const inputClass =
  "w-full rounded-2xl border-0 bg-white/80 px-4 py-3 text-neutral-800 shadow-sm ring-1 ring-neutral-200/80 placeholder:text-neutral-400 transition focus:ring-2 focus:ring-primary-400/50 focus:outline-none";

export function EssayWriterClient() {
  const router = useRouter();
  const { openQuotaModal } = useQuotaModal();
  const [form, setForm] = useState<FormState>(defaultForm);
  const [essay, setEssay] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingIndex, setLoadingIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading) return;
    const id = setInterval(() => setLoadingIndex((i) => (i + 1) % LOADING_MESSAGES.length), 1800);
    return () => clearInterval(id);
  }, [loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const topic = form.topic.trim();
    if (!topic) {
      setError("Topic or question is required.");
      return;
    }
    setError("");
    setLoading(true);
    setEssay("");
    try {
      const res = await fetch("/api/essay-writer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          typeOfPaper: form.typeOfPaper,
          topic,
          purpose: form.purpose,
          gradeLevel: form.gradeLevel,
          format: form.format,
          wordCount: form.wordCount,
          tone: form.tone,
          vocabulary: form.vocabulary,
          pointOfView: form.pointOfView,
          additionalRequirements: [
            form.includeQuotes ? "Include relevant quotes where appropriate." : "",
            form.additionalRequirements.trim(),
          ]
            .filter(Boolean)
            .join(" "),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const err = data.error || `Error (${res.status}). Please try again.`;
        if (res.status === 403 && isQuotaReachedError(err)) {
          openQuotaModal();
        } else {
          setError(err);
        }
        return;
      }
      if (data.essay) setEssay(data.essay);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(essay).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleHumanizeNext = () => {
    if (!essay.trim()) return;
    navigator.clipboard.writeText(essay).catch(() => {});
    try {
      sessionStorage.setItem(HUMANIZE_INPUT_STORAGE_KEY, essay);
    } catch {
      // ignore
    }
    router.push("/humanize");
  };

  return (
    <div className="relative">
      {loading && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-black/40 backdrop-blur-sm"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="flex flex-col items-center gap-4 rounded-3xl bg-white px-10 py-10 shadow-2xl">
            <div className="h-14 w-14 animate-spin rounded-full border-4 border-primary-200 border-t-primary-500" />
            <p className="text-center text-lg font-medium text-neutral-800">
              {LOADING_MESSAGES[loadingIndex]}
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Form: 4 bubbly category cards */}
        <div className="space-y-5">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 1. Type & topic */}
            <div className="rounded-3xl bg-gradient-to-br from-primary-50/90 to-primary-100/50 p-5 shadow-lg shadow-primary-200/20 ring-1 ring-primary-200/30">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-primary-800/90">
                Type & topic
              </h3>
              <div className="space-y-3">
                <select
                  value={form.typeOfPaper}
                  onChange={(e) => setForm((f) => ({ ...f, typeOfPaper: e.target.value }))}
                  className={selectClass}
                >
                  {PAPER_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={form.topic}
                  onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))}
                  placeholder="Topic or question *"
                  className={inputClass}
                  required
                />
                <select
                  value={form.purpose}
                  onChange={(e) => setForm((f) => ({ ...f, purpose: e.target.value }))}
                  className={selectClass}
                >
                  {PURPOSES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 2. Academic */}
            <div className="rounded-3xl bg-gradient-to-br from-emerald-50/90 to-emerald-100/50 p-5 shadow-lg shadow-emerald-200/20 ring-1 ring-emerald-200/30">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-emerald-800/90">
                Academic
              </h3>
              <div className="space-y-3">
                <select
                  value={form.gradeLevel}
                  onChange={(e) => setForm((f) => ({ ...f, gradeLevel: e.target.value }))}
                  className={selectClass}
                >
                  {GRADE_LEVELS.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
                <select
                  value={form.format}
                  onChange={(e) => setForm((f) => ({ ...f, format: e.target.value }))}
                  className={selectClass}
                >
                  {FORMATS.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
                <input
                  type="number"
                  min={200}
                  max={2000}
                  step={100}
                  value={form.wordCount}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, wordCount: parseInt(e.target.value, 10) || 500 }))
                  }
                  className={inputClass}
                />
                <p className="text-xs text-emerald-700/80">Word count (200–2000)</p>
              </div>
            </div>

            {/* 3. Style & tone */}
            <div className="rounded-3xl bg-gradient-to-br from-violet-50/90 to-violet-100/50 p-5 shadow-lg shadow-violet-200/20 ring-1 ring-violet-200/30">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-violet-800/90">
                Style & tone
              </h3>
              <div className="space-y-3">
                <select
                  value={form.tone}
                  onChange={(e) => setForm((f) => ({ ...f, tone: e.target.value }))}
                  className={selectClass}
                >
                  {TONES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <select
                  value={form.vocabulary}
                  onChange={(e) => setForm((f) => ({ ...f, vocabulary: e.target.value }))}
                  className={selectClass}
                >
                  {VOCABULARY_LEVELS.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
                <select
                  value={form.pointOfView}
                  onChange={(e) => setForm((f) => ({ ...f, pointOfView: e.target.value }))}
                  className={selectClass}
                >
                  {POINTS_OF_VIEW.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 4. Extras */}
            <div className="rounded-3xl bg-gradient-to-br from-amber-50/90 to-amber-100/50 p-5 shadow-lg shadow-amber-200/20 ring-1 ring-amber-200/30">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-amber-800/90">
                Extras
              </h3>
              <div className="space-y-3">
                <label className="flex cursor-pointer items-center gap-3 rounded-2xl bg-white/80 px-4 py-3 shadow-sm ring-1 ring-amber-200/50">
                  <input
                    type="checkbox"
                    checked={form.includeQuotes}
                    onChange={(e) => setForm((f) => ({ ...f, includeQuotes: e.target.checked }))}
                    className="h-4 w-4 rounded border-amber-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-neutral-700">Include quotes</span>
                </label>
                <textarea
                  value={form.additionalRequirements}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, additionalRequirements: e.target.value }))
                  }
                  placeholder="Additional requirements (optional)"
                  rows={2}
                  className={inputClass}
                />
              </div>
            </div>

            {error && (
              <p className="rounded-2xl bg-red-50 px-4 py-2 text-sm text-red-600 ring-1 ring-red-200/50">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading || !form.topic.trim()}
              className="w-full rounded-2xl bg-primary-500 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-primary-300/40 transition hover:bg-primary-600 hover:shadow-primary-400/50 disabled:opacity-50"
            >
              {loading ? "Writing…" : "Write essay"}
            </button>
          </form>
        </div>

        {/* Output panel */}
        <div className="flex flex-col rounded-3xl bg-gradient-to-br from-neutral-50 to-white p-6 shadow-xl ring-1 ring-neutral-200/60 min-h-[420px]">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-semibold text-neutral-800">Your essay</h3>
            {essay && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleHumanizeNext}
                  className="rounded-2xl bg-primary-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary-300/30 transition hover:bg-primary-600"
                >
                  Humanize next
                </button>
                <button
                  type="button"
                  onClick={handleCopy}
                  className={`rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
                    copied
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-white text-neutral-700 shadow-sm ring-1 ring-neutral-200 hover:bg-neutral-50"
                  }`}
                >
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            )}
          </div>
          <div className="min-h-[320px] flex-1 rounded-2xl bg-white/80 p-5 text-neutral-700 whitespace-pre-wrap shadow-inner ring-1 ring-neutral-200/50">
            {essay ? (
              essay
            ) : (
              <span className="text-neutral-400">
                Your essay will appear here after you click &quot;Write essay.&quot; Use &quot;Humanize next&quot; to copy it to the humanizer and make it pass AI detection.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
