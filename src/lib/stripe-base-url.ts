/**
 * Base URL for Stripe redirects (checkout success/cancel, portal return).
 * Prefer NEXT_PUBLIC_APP_URL, then Vercel deployment URL, then request origin, then localhost.
 */
export function getStripeBaseUrl(origin?: string): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  if (origin) {
    return origin;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}
