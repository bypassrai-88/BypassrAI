/**
 * Two site modes (swap via env — no duplicate codebase):
 *
 *   NEXT_PUBLIC_SITE_VARIANT=default   → full product (humanizer, detector messaging, SEO)
 *   NEXT_PUBLIC_SITE_VARIANT=portfolio → AI writing suite positioning for demos / resume
 *
 * Aliases for portfolio: experimental | adjusted | alt
 *
 * Vercel: set per environment (Production vs Preview) or toggle when you want to switch.
 */

export type SiteVariant = "default" | "portfolio";

const raw = (process.env.NEXT_PUBLIC_SITE_VARIANT ?? "default").trim().toLowerCase();

export function getSiteVariant(): SiteVariant {
  if (raw === "portfolio" || raw === "experimental" || raw === "adjusted" || raw === "alt") {
    return "portfolio";
  }
  return "default";
}

/** Portfolio / demo mode: de-emphasize humanizer & detector positioning. */
export function isPortfolioMode(): boolean {
  return getSiteVariant() === "portfolio";
}

/** @deprecated use isPortfolioMode */
export function isExperimental(): boolean {
  return isPortfolioMode();
}
