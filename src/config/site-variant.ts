/**
 * Two site modes (swap via env — no duplicate codebase):
 *
 *   NEXT_PUBLIC_SITE_VARIANT=portfolio   → AI writing suite (recommended on Vercel)
 *   SITE_VARIANT=portfolio               → optional alias; next.config copies it to NEXT_PUBLIC at build
 *
 * Aliases for portfolio: experimental | adjusted | alt
 *
 * Vercel: add the variable, then **Redeploy** (Deploy → … → Redeploy). NEXT_PUBLIC_* is baked in at
 * build time — changing env without a new build leaves the old variant.
 */

export type SiteVariant = "default" | "portfolio";

function normalizeVariantInput(value: string | undefined): string {
  if (value == null) return "default";
  const v = value.trim().toLowerCase().replace(/^["']|["']$/g, "");
  return v === "" ? "default" : v;
}

const raw = normalizeVariantInput(process.env.NEXT_PUBLIC_SITE_VARIANT ?? "default");

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
