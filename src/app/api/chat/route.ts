import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Body = {
  threadId?: string | null;
  petId?: string | null;
  content: string;
};

async function generateAssistantReply(userMessage: string): Promise<string> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return [
      "This is a demo reply. Add OPENAI_API_KEY on the server for live AI.",
      "",
      `You said: ${userMessage.slice(0, 280)}${userMessage.length > 280 ? "…" : ""}`,
      "",
      "Barc does not replace an in-person veterinarian. Seek urgent care for emergencies.",
    ].join("\n");
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are Barc, a careful veterinary information assistant. Give practical, empathetic guidance and always remind users that you are not a substitute for an in-person exam. If symptoms sound severe, urge emergency care.",
        },
        { role: "user", content: userMessage },
      ],
      max_tokens: 600,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    return `The AI service returned an error (${res.status}). ${errText.slice(0, 120)}`;
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = data.choices?.[0]?.message?.content?.trim();
  return text && text.length > 0 ? text : "I couldn’t generate a reply. Please try again.";
}

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

  const content = body.content?.trim();
  if (!content) {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }

  let threadId = body.threadId ?? null;
  const petId = body.petId ?? null;

  if (petId) {
    const { data: pet } = await supabase
      .from("pets")
      .select("id")
      .eq("id", petId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!pet) {
      return NextResponse.json({ error: "Invalid pet" }, { status: 400 });
    }
  }

  if (!threadId) {
    const { data: thread, error: tErr } = await supabase
      .from("chat_threads")
      .insert({ user_id: user.id, pet_id: petId })
      .select("id")
      .single();
    if (tErr || !thread) {
      return NextResponse.json(
        { error: tErr?.message ?? "Could not start thread" },
        { status: 500 },
      );
    }
    threadId = thread.id;
  } else {
    const { data: existing } = await supabase
      .from("chat_threads")
      .select("id")
      .eq("id", threadId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!existing) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }
  }

  const { data: userRow, error: uErr } = await supabase
    .from("chat_messages")
    .insert({
      thread_id: threadId,
      role: "user",
      content,
    })
    .select("id, role, content, created_at")
    .single();

  if (uErr || !userRow) {
    return NextResponse.json(
      { error: uErr?.message ?? "Could not save message" },
      { status: 500 },
    );
  }

  const assistantText = await generateAssistantReply(content);

  const { data: assistantRow, error: aErr } = await supabase
    .from("chat_messages")
    .insert({
      thread_id: threadId,
      role: "assistant",
      content: assistantText,
    })
    .select("id, role, content, created_at")
    .single();

  if (aErr || !assistantRow) {
    return NextResponse.json(
      { error: aErr?.message ?? "Could not save reply" },
      { status: 500 },
    );
  }

  await supabase.from("activity_log").insert({
    user_id: user.id,
    pet_id: petId,
    kind: "ai",
    title: "AI consultation",
    subtitle: content.length > 100 ? `${content.slice(0, 100)}…` : content,
    status: "Completed",
  });

  return NextResponse.json({
    threadId,
    userMessage: userRow,
    assistantMessage: assistantRow,
  });
}

