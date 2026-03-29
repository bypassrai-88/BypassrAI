/** Messages returned by API when quota is reached. Frontend shows modal instead of result/error. */
export const QUOTA_REACHED_ANONYMOUS = "Create an account to use more.";
export const QUOTA_REACHED_USER = "Start a free trial or upgrade to continue.";

/** Portfolio / demo site: subscription-free tier; modal shows a soft limit message, not signup. */
export const QUOTA_PORTFOLIO_PREFIX = "Portfolio demo:";

export function isQuotaReachedError(error: unknown): boolean {
  if (typeof error !== "string") return false;
  return (
    error.includes(QUOTA_REACHED_ANONYMOUS) ||
    error.includes(QUOTA_REACHED_USER) ||
    error.includes(QUOTA_PORTFOLIO_PREFIX)
  );
}
