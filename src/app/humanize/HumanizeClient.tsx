"use client";

import { useEffect, useState } from "react";
import { ToolEditor } from "@/components/ToolEditor";
import { ToolWithQuotaLimit } from "@/components/ToolWithQuotaLimit";
import { HUMANIZE_INPUT_STORAGE_KEY } from "@/lib/humanize-storage";

export function HumanizeClient() {
  const [initialInput, setInitialInput] = useState<string | undefined>(undefined);
  const [autoRun, setAutoRun] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = sessionStorage.getItem(HUMANIZE_INPUT_STORAGE_KEY);
      if (stored) {
        sessionStorage.removeItem(HUMANIZE_INPUT_STORAGE_KEY);
        setInitialInput(stored);
        setAutoRun(true);
      }
    } catch {
      // ignore
    }
  }, []);

  return (
    <ToolWithQuotaLimit defaultWordLimit={500}>
      <ToolEditor
        title="Your Text"
        placeholder="Paste any content — homework, assignment, or AI-generated draft..."
        primaryAction="Humanize"
        secondaryAction="Check for AI"
        wordLimit={500}
        showWordCount
        resultTitle="Humanized text"
        resultPlaceholder="Your humanized text will appear here after you click Humanize."
        primaryApiEndpoint="/api/humanize"
        secondaryApiEndpoint="/api/ai-check"
        layout="sideBySide"
        showHumanizeAgain
        humanizeAgainLabel="Humanize again"
        initialInput={initialInput}
        autoRunPrimary={autoRun}
      />
    </ToolWithQuotaLimit>
  );
}
