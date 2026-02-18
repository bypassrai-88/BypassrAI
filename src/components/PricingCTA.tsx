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
  currentPlan: "lite" | "pro" | "premium" | null;
};

function useAccountSubscription(): AccountSubscription {
  const [loading, setLoading] = useState(true);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<"lite" | "pro" | "premium" | null>(null);

  useEffect(() => {
    fetch("/api/account")
      .then(async (r) => {
        if (!r.ok) {
          setIsAuthenticated(false);
          setHasSubscription(false);
          setCurrentPlan(null);
          return;
        }
        setIsAuthenticated(true);
        const data = await r.json();
        const status = data?.subscription?.status;
        setHasSubscription(status === "active" || status === "trial");
        const plan = data?.subscription?.plan;
        setCurrentPlan(plan === "lite" || plan === "pro" || plan === "premium" ? plan : plan === "trial" ? "lite" : null);
      })
      .catch(() => {
        setIsAuthenticated(false);
        setHasSubscription(false);
        setCurrentPlan(null);
      })
      .finally(() => setLoading(false));
  }, []);

  return { loading, hasSubscription, isAuthenticated, currentPlan };
}

/** Redirect to Stripe (same tab). Avoids popup blockers; Stripe redirects back to our success URL. */
function goToStripe(url: string) {
  window.location.href = url;
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
          if (json.url) goToStripe(json.url);
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
  const { currentPlan } = useAccountSubscription();
  const [loading, setLoading] = useState(false);
  const isCurrentPlan = currentPlan === planId;
  const buttonLabel = isCurrentPlan ? "Manage subscription" : cta;

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
          const json = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(json.error || "Could not start checkout");
          if (json.url) {
            if (json.fullRedirect) {
              window.location.href = json.url;
            } else {
              goToStripe(json.url);
            }
            return;
          }
          throw new Error("No checkout URL");
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
      {loading ? "Opening…" : buttonLabel}
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
  "inline-flex shrink-0 rounded-full bg-primary-600 px-8 py-4 text-base font-semibold text-white shadow-bubble transition hover:bg-primary-700 hover:shadow-bubble-lg";
const finalCtaClass =
  "mt-6 inline-flex rounded-full bg-primary-600 px-8 py-4 text-base font-semibold text-white shadow-bubble transition hover:bg-primary-700 hover:shadow-bubble-lg";

/** Hero CTA: Use the AI Humanizer. Try free; we prompt to sign in / free trial when limit is reached. */
export function HeroCTA() {
  const { loading, hasSubscription } = useAccountSubscription();

  if (loading) {
    return (
      <div className="mt-8 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
        <span className={heroCtaClass} style={{ opacity: 0.7 }}>
          Loading…
        </span>
      </div>
    );
  }

  return (
    <div className="mt-8 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
      <Link href="/humanize" className={heroCtaClass}>
        {hasSubscription ? "Go to Humanizer" : "Try AI Humanizer"}
      </Link>
      {!hasSubscription && (
        <span className="text-sm text-neutral-500">
          Try free · Sign in for free trial or more
        </span>
      )}
    </div>
  );
}

/** Final CTA: Use the humanizer; try free, then sign in / free trial when prompted. */
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

  return (
    <div>
      <Link href="/humanize" className={finalCtaClass}>
        {hasSubscription ? "Go to Humanizer" : "Try AI Humanizer"}
      </Link>
      {!hasSubscription && (
        <p className="mt-3 text-sm text-neutral-500">
          Try free · Sign in for free trial or paid plan
        </p>
      )}
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
