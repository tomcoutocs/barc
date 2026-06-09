import { NextResponse } from "next/server";
import { canAccessDevFeedback } from "@/lib/dev-access";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { TeachingCorrectionRow, TeachingVerdict } from "@/types/teaching-correction";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !canAccessDevFeedback()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("model_teaching_corrections")
      .select(
        "id, created_by, message_id, thread_id, scenario_context, assistant_excerpt, verdict, correction_notes, species, active, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(300);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ corrections: (data ?? []) as TeachingCorrectionRow[] });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Admin client unavailable";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

type PatchBody = {
  id: string;
  verdict?: TeachingVerdict;
  correction_notes?: string;
  active?: boolean;
};

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !canAccessDevFeedback()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: PatchBody;
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const id = body.id?.trim();
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};

  if (body.verdict !== undefined) {
    if (
      body.verdict !== "correct" &&
      body.verdict !== "incorrect" &&
      body.verdict !== "partial"
    ) {
      return NextResponse.json({ error: "Invalid verdict" }, { status: 400 });
    }
    updates.verdict = body.verdict;
  }

  if (body.correction_notes !== undefined) {
    const notes = body.correction_notes.trim();
    if (!notes) {
      return NextResponse.json({ error: "correction_notes cannot be empty" }, { status: 400 });
    }
    updates.correction_notes = notes;
  }

  if (body.active !== undefined) {
    updates.active = Boolean(body.active);
  }

  if (!Object.keys(updates).length) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("model_teaching_corrections")
      .update(updates)
      .eq("id", id)
      .select(
        "id, created_by, message_id, thread_id, scenario_context, assistant_excerpt, verdict, correction_notes, species, active, created_at",
      )
      .single();

    if (error || !data) {
      return NextResponse.json({ error: error?.message ?? "Not found" }, { status: 500 });
    }

    return NextResponse.json({ correction: data as TeachingCorrectionRow });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Admin client unavailable";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
