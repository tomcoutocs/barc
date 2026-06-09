/**
 * Dev-only tools (feedback viewer). Set DEV_FEEDBACK_VIEWER_EMAILS in env:
 * comma-separated list of allowed emails (case-insensitive).
 */
export function isDevFeedbackViewer(email: string | null | undefined): boolean {
  if (!email?.trim()) return false;
  const raw = process.env.DEV_FEEDBACK_VIEWER_EMAILS?.trim();
  if (!raw) return false;
  const allowed = raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return allowed.includes(email.trim().toLowerCase());
}
