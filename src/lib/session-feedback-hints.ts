import { createAdminClient } from "@/lib/supabase/admin";

const MAX_SESSION_FEEDBACK_CHARS = 2_000;

/**
 * Recent end-of-chat tester feedback — injected globally into consult hints.
 */
export async function fetchSessionFeedbackHints(): Promise<string | null> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("chat_session_feedback")
      .select("comment, created_at")
      .order("created_at", { ascending: false })
      .limit(12);

    if (error || !data?.length) return null;

    const lines: string[] = [];
    let total = 0;
    for (let i = 0; i < data.length; i++) {
      const comment = String(data[i].comment ?? "").replace(/\s+/g, " ").trim();
      if (!comment) continue;
      const line = `${i + 1}. ${comment}`;
      if (total + line.length > MAX_SESSION_FEEDBACK_CHARS) break;
      lines.push(line);
      total += line.length + 1;
    }

    if (!lines.length) return null;

    return [
      "SESSION FEEDBACK FROM TESTERS (apply to tone and structure — safety and retrieved sources still win):",
      ...lines,
    ].join("\n");
  } catch {
    return null;
  }
}
