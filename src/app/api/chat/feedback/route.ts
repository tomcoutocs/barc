import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Body = {
  messageId: string;
  /** Set to null to clear a vote */
  rating: "up" | "down" | null;
};

export async function POST(request: Request) {
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

  const rating = body.rating;
  if (rating != null && rating !== "up" && rating !== "down") {
    return NextResponse.json({ error: "Invalid rating" }, { status: 400 });
  }

  const { data: msg, error: qErr } = await supabase
    .from("chat_messages")
    .select("id, thread_id, role")
    .eq("id", messageId)
    .maybeSingle();

  if (qErr || !msg) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }
  if (msg.role !== "assistant") {
    return NextResponse.json({ error: "Only assistant messages can be rated" }, { status: 400 });
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

  const feedback_at = rating ? new Date().toISOString() : null;

  const { data: updated, error: uErr } = await supabase
    .from("chat_messages")
    .update({
      feedback_rating: rating,
      feedback_at,
    })
    .eq("id", messageId)
    .select("id, feedback_rating, feedback_at")
    .single();

  if (uErr || !updated) {
    return NextResponse.json(
      { error: uErr?.message ?? "Could not save feedback" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    messageId: updated.id,
    feedback_rating: updated.feedback_rating as "up" | "down" | null,
    feedback_at: updated.feedback_at,
  });
}
