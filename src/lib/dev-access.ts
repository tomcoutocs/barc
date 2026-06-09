/**
 * Dev-only feedback viewer. No email is sent — feedback is stored in Supabase
 * and shown in the dev tab when enabled.
 *
 * Enabled when:
 * - NODE_ENV is "development" (local), or
 * - DEV_FEEDBACK_ENABLED=true in env (e.g. Vercel preview / staging)
 */
export function isDevFeedbackEnabled(): boolean {
  if (process.env.NODE_ENV === "development") return true;
  const flag = process.env.DEV_FEEDBACK_ENABLED?.trim().toLowerCase();
  return flag === "1" || flag === "true" || flag === "yes";
}

/** Any logged-in user may open the dev tab when feedback mode is enabled. */
export function canAccessDevFeedback(): boolean {
  return isDevFeedbackEnabled();
}
