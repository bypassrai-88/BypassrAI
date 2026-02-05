"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { QuotaModal } from "./QuotaModal";

type QuotaModalContextValue = {
  openQuotaModal: () => void;
};

const QuotaModalContext = createContext<QuotaModalContextValue | null>(null);

export function QuotaModalProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const openQuotaModal = useCallback(() => setOpen(true), []);
  const closeQuotaModal = useCallback(() => setOpen(false), []);

  const reopenAfterSignIn = useCallback(() => {
    setOpen(false);
    setTimeout(() => setOpen(true), 200);
  }, []);

  return (
    <QuotaModalContext.Provider value={{ openQuotaModal }}>
      {children}
      <QuotaModal
        open={open}
        onClose={closeQuotaModal}
        onSignInSuccess={reopenAfterSignIn}
      />
    </QuotaModalContext.Provider>
  );
}

export function useQuotaModal(): QuotaModalContextValue {
  const ctx = useContext(QuotaModalContext);
  if (!ctx) {
    throw new Error("useQuotaModal must be used within QuotaModalProvider");
  }
  return ctx;
}
