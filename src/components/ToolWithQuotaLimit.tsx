"use client";

import React, { useEffect, useState } from "react";

/**
 * Sets per-use word limit by plan:
 * - No plan / anonymous: defaultWordLimit (500).
 * - Free trial: paidWordLimit (2,500), same cap as paid.
 * - Paid (active): paidWordLimit (2,500) to avoid overwhelming the model.
 */
export function ToolWithQuotaLimit({
  children,
  defaultWordLimit = 500,
  paidWordLimit = 2500,
}: {
  children: React.ReactElement;
  defaultWordLimit?: number;
  paidWordLimit?: number;
}) {
  const [wordLimit, setWordLimit] = useState(defaultWordLimit);

  useEffect(() => {
    fetch("/api/account")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data?.subscription) return;
        if (data.subscription.status === "active" || data.subscription.status === "trial") {
          setWordLimit(paidWordLimit);
        }
      })
      .catch(() => {});
  }, [paidWordLimit]);

  return React.cloneElement(children, { wordLimit });
}
