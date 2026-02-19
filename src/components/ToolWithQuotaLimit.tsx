"use client";

import React, { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Sets per-use word limit by plan:
 * - No plan / anonymous: defaultWordLimit (500).
 * - Free trial: paidWordLimit (2,500), same cap as paid.
 * - Paid (active): paidWordLimit (2,500) to avoid overwhelming the model.
 * Re-fetches when auth state changes so the limit updates after sign-in without refresh.
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

  const refreshWordLimit = useCallback(() => {
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

  useEffect(() => {
    refreshWordLimit();
  }, [refreshWordLimit]);

  useEffect(() => {
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        if (session?.user) refreshWordLimit();
      }
    });
    return () => subscription.unsubscribe();
  }, [refreshWordLimit]);

  return React.cloneElement(children, { wordLimit });
}
