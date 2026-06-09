import { NextResponse } from "next/server";
import { isDevFeedbackViewer } from "@/lib/dev-access";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ChatSessionFeedbackRow, ChatSessionSnapshot } from "@/types/chat-session-feedback";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isDevFeedbackViewer(user.email)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("chat_session_feedback")
      .select("id, thread_id, user_id, user_email, pet_id, comment, snapshot, created_at")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rows: ChatSessionFeedbackRow[] = (data ?? []).map((r) => ({
      id: r.id,
      thread_id: r.thread_id,
      user_id: r.user_id,
      user_email: r.user_email,
      pet_id: r.pet_id,
      comment: r.comment,
      snapshot: r.snapshot as ChatSessionSnapshot,
      created_at: r.created_at,
    }));

    return NextResponse.json({ feedback: rows });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Admin client unavailable";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
