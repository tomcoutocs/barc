import type { SupabaseClient } from "@supabase/supabase-js";

/** Total stays under vet-rag `preference_hints` max (6000). */
const MAX_DOWN_CHARS = 2800;
const MAX_UP_CHARS = 2800;
const SNIPPET_LEN = 380;

function snippetLines(
  rows: { content: string | null }[],
  headerPrefix: string,
  maxChars: number,
): string {
  const parts: string[] = [];
  let total = 0;
  let n = 0;
  for (let i = 0; i < rows.length; i++) {
    const raw = String(rows[i].content ?? "")
      .replace(/\s+/g, " ")
      .trim();
    if (!raw) continue;
    n += 1;
    const snip = raw.length > SNIPPET_LEN ? `${raw.slice(0, SNIPPET_LEN)}…` : raw;
    const line = `${n}. ${snip}`;
    if (total + line.length > maxChars) break;
    parts.push(line);
    total += line.length + 1;
  }
  if (!parts.length) return "";
  return `${headerPrefix}\n${parts.join("\n")}`;
}

/**
 * Builds text for the model from recent thumbs-up/down assistant messages.
 * Downvotes steer away from patterns; thumbs-up reinforce tone/clarity when consistent with sources/safety.
 */
export async function fetchFeedbackHintsForUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const { data: threads } = await supabase.from("chat_threads").select("id").eq("user_id", userId);
  const threadIds = (threads ?? []).map((t) => t.id);
  if (threadIds.length === 0) return null;

  const base = () =>
    supabase
      .from("chat_messages")
      .select("content, feedback_at")
      .in("thread_id", threadIds)
      .eq("role", "assistant")
      .not("feedback_at", "is", null)
      .order("feedback_at", { ascending: false })
      .limit(14);

  const [downRes, upRes] = await Promise.all([
    base().eq("feedback_rating", "down"),
    base().eq("feedback_rating", "up"),
  ]);

  const downRows = downRes.error ? [] : downRes.data ?? [];
  const upRows = upRes.error ? [] : upRes.data ?? [];

  const downBlock = snippetLines(
    downRows,
    "Thumbs down — avoid similar problems (tone, depth, omissions, or misleading certainty):",
    MAX_DOWN_CHARS,
  );
  const upBlock = snippetLines(
    upRows,
    "Thumbs up — reinforce similar helpful qualities (clarity, empathy, actionable next steps) when consistent with retrieved sources and safety:",
    MAX_UP_CHARS,
  );

  const sections = [downBlock, upBlock].filter(Boolean);
  if (!sections.length) return null;

  return sections.join("\n\n");
}
