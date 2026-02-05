"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type AuthState = "loading" | "authenticated" | "anonymous";

function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>("loading");
  useEffect(() => {
    fetch("/api/account")
      .then((r) => setState(r.ok ? "authenticated" : "anonymous"))
      .catch(() => setState("anonymous"));
  }, []);
  return state;
}

type AccountSubscription = {
  loading: boolean;
  hasSubscription: boolean;
  isAuthenticated: boolean;
};

function useAccountSubscription(): AccountSubscription {
  const [loading, setLoading] = useState(true);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    fetch("/api/account")
      .then(async (r) => {
        if (!r.ok) {
          setIsAuthenticated(false);
          setHasSubscription(false);
          return;
        }
        setIsAuthenticated(true);
        const data = await r.json();
        const status = data?.subscription?.status;
        setHasSubscription(status === "active" || status === "trial");
      })
      .catch(() => {
        setIsAuthenticated(false);
        setHasSubscription(false);
      })
      .finally(() => setLoading(false));
  }, []);

  return { loading, hasSubscription, isAuthenticated };
}

function openCheckoutPopup(url: string) {
  const w = 500;
  const h = 700;
  const left = Math.round((window.screen?.width ?? 800) / 2 - w / 2);
  const top = Math.round((window.screen?.height ?? 600) / 2 - h / 2);
  window.open(url, "stripe-checkout", `width=${w},height=${h},left=${left},top=${top},scrollbars=yes`);
}

export function StartTrialButton() {
  const auth = useAuth();
  const [loading, setLoading] = useState(false);

  if (auth === "loading") {
    return (
      <div className="mt-6 block w-full rounded-lg bg-primary-600 py-3 text-center font-medium text-white opacity-70">
        Loading…
      </div>
    );
  }
  if (auth === "anonymous") {
    return (
      <Link
        href="/signup"
        className="mt-6 block w-full rounded-lg bg-primary-600 py-3 text-center font-medium text-white hover:bg-primary-700"
      >
        Start free trial
      </Link>
    );
  }
  return (
    <button
      type="button"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        try {
          const res = await fetch("/api/trial/start", { method: "POST" });
          const json = await res.json();
          if (!res.ok) throw new Error(json.error || "Could not start trial");
          if (json.url) openCheckoutPopup(json.url);
          else throw new Error("No checkout URL");
        } catch (e) {
          alert(e instanceof Error ? e.message : "Something went wrong.");
        } finally {
          setLoading(false);
        }
      }}
      className="mt-6 block w-full rounded-lg bg-primary-600 py-3 text-center font-medium text-white hover:bg-primary-700 disabled:opacity-70"
    >
      {loading ? "Opening…" : "Start free trial"}
    </button>
  );
}

type PlanCheckoutButtonProps = {
  planId: "lite" | "pro" | "premium";
  cta: string;
  primary?: boolean;
};

export function PlanCheckoutButton({ planId, cta, primary }: PlanCheckoutButtonProps) {
  const auth = useAuth();
  const [loading, setLoading] = useState(false);

  if (auth === "loading") {
    return (
      <div
        className={`mt-8 block w-full rounded-lg py-3 text-center font-medium opacity-70 ${
          primary ? "bg-primary-600 text-white" : "border-2 border-neutral-300 text-neutral-800"
        }`}
      >
        Loading…
      </div>
    );
  }
  if (auth === "anonymous") {
    return (
      <Link
        href="/login"
        className={`mt-8 block w-full rounded-lg py-3 text-center font-medium transition-colors ${
          primary
            ? "bg-primary-600 text-white hover:bg-primary-700"
            : "border-2 border-neutral-300 text-neutral-800 hover:border-neutral-400 hover:bg-neutral-50"
        }`}
      >
        {cta}
      </Link>
    );
  }
  return (
    <button
      type="button"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        try {
          const res = await fetch("/api/stripe/create-checkout-session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ plan: planId }),
          });
          const json = await res.json();
          if (!res.ok) throw new Error(json.error || "Could not start checkout");
          if (json.url) openCheckoutPopup(json.url);
          else throw new Error("No checkout URL");
        } catch (e) {
          alert(e instanceof Error ? e.message : "Something went wrong.");
        } finally {
          setLoading(false);
        }
      }}
      className={`mt-8 block w-full rounded-lg py-3 text-center font-medium transition-colors disabled:opacity-70 ${
        primary
          ? "bg-primary-600 text-white hover:bg-primary-700"
          : "border-2 border-neutral-300 text-neutral-800 hover:border-neutral-400 hover:bg-neutral-50"
      }`}
    >
      {loading ? "Opening…" : cta}
    </button>
  );
}

/** "Start free trial" link: goes to /pricing if logged in (to start trial), /signup if not. */
export function StartFreeTrialLink({
  className,
  children = "Start free trial",
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  const auth = useAuth();
  const href = auth === "authenticated" ? "/pricing" : "/signup";
  if (auth === "loading") {
    return (
      <span className={className} style={{ opacity: 0.7 }}>
        {children}
      </span>
    );
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

const heroCtaClass =
  "inline-flex shrink-0 rounded-xl bg-primary-600 px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-primary-600/25 transition hover:bg-primary-700";
const finalCtaClass =
  "mt-6 inline-flex rounded-xl bg-primary-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-primary-600/25 hover:bg-primary-700";

/** Hero CTA: "Go to Humanizer" when subscribed, "Start free trial" + subtext when not. */
export function HeroCTA() {
  const { loading, hasSubscription, isAuthenticated } = useAccountSubscription();

  if (loading) {
    return (
      <div className="mt-8 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
        <span className={heroCtaClass} style={{ opacity: 0.7 }}>
          Loading…
        </span>
      </div>
    );
  }

  if (hasSubscription) {
    return (
      <div className="mt-8 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
        <Link href="/humanize" className={heroCtaClass}>
          Go to Humanizer
        </Link>
      </div>
    );
  }

  const href = isAuthenticated ? "/pricing" : "/signup";
  return (
    <div className="mt-8 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
      <Link href={href} className={heroCtaClass}>
        Start free trial
      </Link>
      <span className="text-sm text-neutral-500">
        7-day free trial when you sign up · Cancel anytime
      </span>
    </div>
  );
}

/** Final CTA: "Go to Humanizer" when subscribed, "Start free trial" + subtext when not. */
export function FinalCTA() {
  const { loading, hasSubscription } = useAccountSubscription();

  if (loading) {
    return (
      <div className="mt-6">
        <span className={finalCtaClass} style={{ opacity: 0.7 }}>
          Loading…
        </span>
      </div>
    );
  }

  if (hasSubscription) {
    return (
      <Link href="/humanize" className={finalCtaClass}>
        Go to Humanizer
      </Link>
    );
  }

  return (
    <div>
      <StartFreeTrialLink className={finalCtaClass} />
      <p className="mt-3 text-sm text-neutral-500">
        250 words free · 7-day free trial when you sign up
      </p>
    </div>
  );
}

/** Renders the "Already have an account?" and "Questions? FAQ · Contact" block only when user is not logged in. */
export function PricingFooter() {
  const auth = useAuth();
  if (auth !== "anonymous") return null;
  return (
    <div className="border-t border-neutral-200 bg-neutral-50/50 py-8">
      <div className="mx-auto max-w-4xl px-4 text-center text-sm text-neutral-600 sm:px-6">
        <p>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary-600 hover:underline">Log in</Link>
          {" "}or go to{" "}
          <Link href="/account" className="font-medium text-primary-600 hover:underline">Account</Link>
          {" "}to subscribe or manage your plan.
        </p>
        <p className="mt-4">
          Questions?{" "}
          <Link href="/help" className="font-medium text-primary-600 hover:underline">FAQ</Link>
          {" · "}
          <Link href="/contact" className="font-medium text-primary-600 hover:underline">Contact</Link>
        </p>
      </div>
    </div>
  );
}
