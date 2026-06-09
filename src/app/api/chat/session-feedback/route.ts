import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ChatSessionSnapshot } from "@/types/chat-session-feedback";

type Body = {
  threadId: string;
  comment?: string;
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

  const threadId = body.threadId?.trim();
  if (!threadId) {
    return NextResponse.json({ error: "threadId required" }, { status: 400 });
  }

  const comment = (body.comment ?? "").trim();
  if (!comment) {
    return NextResponse.json({ error: "Please add feedback before submitting" }, { status: 400 });
  }

  const { data: thread } = await supabase
    .from("chat_threads")
    .select("id, pet_id")
    .eq("id", threadId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!thread) {
    return NextResponse.json({ error: "Thread not found" }, { status: 404 });
  }

  const { data: existing } = await supabase
    .from("chat_session_feedback")
    .select("id")
    .eq("thread_id", threadId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "Feedback already submitted for this chat" }, { status: 409 });
  }

  const { data: messages, error: mErr } = await supabase
    .from("chat_messages")
    .select("id, role, content, created_at")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  if (mErr) {
    return NextResponse.json({ error: mErr.message }, { status: 500 });
  }

  if (!messages?.length) {
    return NextResponse.json({ error: "No messages to snapshot" }, { status: 400 });
  }

  let petName: string | null = null;
  let petSpecies: string | null = null;
  if (thread.pet_id) {
    const { data: pet } = await supabase
      .from("pets")
      .select("name, species")
      .eq("id", thread.pet_id)
      .maybeSingle();
    petName = pet?.name ?? null;
    petSpecies = pet?.species ?? null;
  }

  const snapshot: ChatSessionSnapshot = {
    messages: messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      created_at: m.created_at,
    })),
    pet_id: thread.pet_id,
    pet_name: petName,
    pet_species: petSpecies,
    captured_at: new Date().toISOString(),
  };

  const { data: row, error: iErr } = await supabase
    .from("chat_session_feedback")
    .insert({
      thread_id: threadId,
      user_id: user.id,
      user_email: user.email ?? null,
      pet_id: thread.pet_id,
      comment,
      snapshot,
    })
    .select("id, created_at")
    .single();

  if (iErr || !row) {
    return NextResponse.json({ error: iErr?.message ?? "Could not save feedback" }, { status: 500 });
  }

  return NextResponse.json({ id: row.id, created_at: row.created_at });
}
