import { NextResponse } from "next/server";
import { canAccessDevFeedback } from "@/lib/dev-access";
import { createClient } from "@/lib/supabase/server";
import { parseStoredAgentContent } from "@/types/consult-agent";

type Body = {
  messageId: string;
  threadId?: string | null;
  scenarioContext?: string;
  verdict: "correct" | "incorrect" | "partial";
  correctionNotes?: string;
  species?: "dog" | "cat" | null;
};

function assistantExcerpt(raw: string): string {
  const { fallbackText, structured } = parseStoredAgentContent(raw);
  if (structured?.summary) return structured.summary;
  return (fallbackText || raw).slice(0, 2_000);
}

export async function POST(request: Request) {
  if (!canAccessDevFeedback()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const messageId = body.messageId?.trim();
  if (!messageId) {
    return NextResponse.json({ error: "messageId required" }, { status: 400 });
  }

  const verdict = body.verdict;
  if (verdict !== "correct" && verdict !== "incorrect" && verdict !== "partial") {
    return NextResponse.json({ error: "Invalid verdict" }, { status: 400 });
  }

  const correctionNotes = (body.correctionNotes ?? "").trim();
  if (verdict !== "correct" && !correctionNotes) {
    return NextResponse.json(
      { error: "Add correction notes when marking incorrect or partial" },
      { status: 400 },
    );
  }

  const { data: msg } = await supabase
    .from("chat_messages")
    .select("id, thread_id, role, content")
    .eq("id", messageId)
    .maybeSingle();

  if (!msg || msg.role !== "assistant") {
    return NextResponse.json({ error: "Assistant message not found" }, { status: 404 });
  }

  const { data: thread } = await supabase
    .from("chat_threads")
    .select("id")
    .eq("id", msg.thread_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!thread) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: existing } = await supabase
    .from("model_teaching_corrections")
    .select("id")
    .eq("message_id", messageId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "This reply was already reviewed" }, { status: 409 });
  }

  const species =
    body.species === "dog" || body.species === "cat" ? body.species : null;

  const { data: row, error: iErr } = await supabase
    .from("model_teaching_corrections")
    .insert({
      created_by: user.id,
      message_id: messageId,
      thread_id: msg.thread_id,
      scenario_context: (body.scenarioContext ?? "").trim().slice(0, 4_000),
      assistant_excerpt: assistantExcerpt(msg.content),
      verdict,
      correction_notes: correctionNotes || "Marked accurate — reinforce this pattern.",
      species,
    })
    .select("id, created_at")
    .single();

  if (iErr || !row) {
    return NextResponse.json({ error: iErr?.message ?? "Could not save" }, { status: 500 });
  }

  return NextResponse.json({ id: row.id, created_at: row.created_at });
}
