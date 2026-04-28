import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchFeedbackHintsForUser } from "@/lib/chat-feedback-hints";
import type { ConsultAgentResponse } from "@/types/consult-agent";
import { formatAgentForStorage } from "@/types/consult-agent";

/** Vercel serverless limit (seconds). Pro (or higher) can use long RAG calls; Hobby plans enforce a lower cap—see Vercel docs. */
export const maxDuration = 120;

type Body = {
  threadId?: string | null;
  petId?: string | null;
  content: string;
};

async function generateAssistantReply(
  userMessage: string,
  preferenceHints: string | null,
): Promise<string> {
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

  const hintBlock = preferenceHints?.trim()
    ? `\n\nUser feedback (thumbs up and thumbs down on past replies—reinforce what worked, avoid what did not; still follow safety): ${preferenceHints.trim()}`
    : "";

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
            "You are Barc, a careful veterinary information assistant. Give practical, empathetic guidance and always remind users that you are not a substitute for an in-person exam. If symptoms sound severe, urge emergency care." +
            hintBlock,
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

async function callVetRagAgent(
  message: string,
  species: "dog" | "cat",
  preferenceHints: string | null,
): Promise<ConsultAgentResponse | null> {
  const base = process.env.VET_RAG_API_URL?.replace(/\/$/, "").trim();
  if (!base) return null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const secret = process.env.VET_RAG_API_SECRET?.trim();
  if (secret) {
    headers.Authorization = `Bearer ${secret}`;
  }

  try {
    const res = await fetch(`${base}/chat`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        message,
        species,
        preference_hints: preferenceHints?.trim() || null,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(120_000),
    });
    if (!res.ok) {
      const t = await res.text();
      console.error("[vet-rag] /chat error", res.status, t.slice(0, 500));
      return null;
    }
    const data = (await res.json()) as ConsultAgentResponse;
    if (!data?.summary || !data?.triage_level) return null;
    return data;
  } catch (e) {
    console.error("[vet-rag] /chat fetch failed", e);
    return null;
  }
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

  let petPrefix = "";
  let ragSpecies: "dog" | "cat" = "dog";
  if (petId) {
    const { data: pet } = await supabase
      .from("pets")
      .select("id, name, breed, age_years, species")
      .eq("id", petId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!pet) {
      return NextResponse.json({ error: "Invalid pet" }, { status: 400 });
    }
    ragSpecies = pet.species === "cat" ? "cat" : "dog";
    const label = ragSpecies === "cat" ? "Cat" : "Dog";
    const bits = [
      `${label}: ${pet.name}`,
      pet.breed ?? null,
      pet.age_years != null ? `age ${pet.age_years}y` : null,
    ].filter(Boolean);
    petPrefix = `[${bits.join(", ")}] `;
  }

  const ragMessage = `${petPrefix}${content}`;

  let preferenceHints: string | null = null;
  try {
    preferenceHints = await fetchFeedbackHintsForUser(supabase, user.id);
  } catch {
    preferenceHints = null;
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
    .select("id, role, content, created_at, feedback_rating, feedback_at")
    .single();

  if (uErr || !userRow) {
    return NextResponse.json(
      { error: uErr?.message ?? "Could not save message" },
      { status: 500 },
    );
  }

  let assistantText: string;
  let agentResponse: ConsultAgentResponse | null = null;

  const agent = await callVetRagAgent(ragMessage, ragSpecies, preferenceHints);
  if (agent) {
    agentResponse = agent;
    assistantText = formatAgentForStorage(agent);
  } else {
    assistantText = await generateAssistantReply(ragMessage, preferenceHints);
  }

  const { data: assistantRow, error: aErr } = await supabase
    .from("chat_messages")
    .insert({
      thread_id: threadId,
      role: "assistant",
      content: assistantText,
    })
    .select("id, role, content, created_at, feedback_rating, feedback_at")
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
    agentResponse,
  });
}
