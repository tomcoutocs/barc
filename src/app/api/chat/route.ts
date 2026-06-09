import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchFeedbackHintsForUser } from "@/lib/chat-feedback-hints";
import { fetchTeachingHintsForModel, mergePreferenceHints } from "@/lib/teaching-hints";
import type { ConsultAgentResponse } from "@/types/consult-agent";
import { formatAgentForStorage, parseStoredAgentContent } from "@/types/consult-agent";

/** Vercel serverless limit (seconds). Pro (or higher) can use long RAG calls; Hobby plans enforce a lower cap—see Vercel docs. */
export const maxDuration = 120;

type Body = {
  threadId?: string | null;
  petId?: string | null;
  content: string;
};

type ConversationTurnPayload = { role: "user" | "assistant"; content: string };

/** Match vet-rag-api cap (see ``_MAX_CONVERSATION_TURNS``). */
const CONVERSATION_HISTORY_MAX_TURNS = 32;

const ASSISTANT_CONTEXT_CHAR_CAP = 2_800;
const USER_CONTEXT_CHAR_CAP = 6_000;
const FALLBACK_CHAT_HISTORY_MESSAGES = 16;

function assistantPlainForAgentContext(raw: string): string {
  const { fallbackText } = parseStoredAgentContent(raw);
  const base = (fallbackText || "").trim() || raw.trim();
  return base.slice(0, ASSISTANT_CONTEXT_CHAR_CAP).trimEnd();
}

async function generateAssistantReply(
  latestUserContent: string,
  preferenceHints: string | null,
  priorTurns?: ConversationTurnPayload[],
): Promise<string> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return [
      "This is a demo reply. Add OPENAI_API_KEY on the server for live AI.",
      "",
      `You said: ${latestUserContent.slice(0, 280)}${latestUserContent.length > 280 ? "…" : ""}`,
      "",
      "Barc does not replace an in-person veterinarian. Seek urgent care for emergencies.",
    ].join("\n");
  }

  const hintBlock = preferenceHints?.trim()
    ? `\n\nUser feedback (thumbs up and thumbs down on past replies—reinforce what worked, avoid what did not; still follow safety): ${preferenceHints.trim()}`
    : "";

  const systemPrompt =
    "You are Barc — warm and plain-spoken, like a vet walking an owner through a workup (not a formal handout). " +
    "Keep each reply short: one or two brief paragraphs. Use contractions when natural. " +
    "Conversation history may precede this turn: use it—do not re-ask what the owner already answered; reflect what they said, then ask the next thing. " +
    "For sick-pet concerns, interview first: ask ONE specific, granular follow-up per turn (timing, progression, appetite, exposure, symptom details) until you have a clear picture—usually several back-and-forths. " +
    "Do not jump to conclusions, numbered question lists, or full treatment plans in the first few messages. " +
    "Only after enough detail, give your best read on what might be going on, what to watch for, and practical next steps. " +
    "For clear emergencies, give urgent guidance immediately while you can still ask one focused question if needed. " +
    "Remind owners you are not a substitute for an in-person exam." +
    hintBlock;

  type ChatMsg = {
    role: "system" | "user" | "assistant";
    content: string;
  };
  const messages: ChatMsg[] = [{ role: "system", content: systemPrompt }];

  if (priorTurns?.length) {
    const tail = priorTurns.slice(-FALLBACK_CHAT_HISTORY_MESSAGES);
    for (const t of tail) {
      if (t.role !== "assistant" && t.role !== "user") continue;
      const c = (t.content || "").trim();
      if (!c) continue;
      messages.push({ role: t.role, content: c });
    }
  }

  messages.push({ role: "user", content: latestUserContent });

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages,
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
  conversationHistory: ConversationTurnPayload[] | undefined,
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
        conversation_history: conversationHistory?.length ? conversationHistory : null,
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
    const [userHints, teachingHints] = await Promise.all([
      fetchFeedbackHintsForUser(supabase, user.id),
      fetchTeachingHintsForModel(supabase),
    ]);
    preferenceHints = mergePreferenceHints(userHints, teachingHints);
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

  let conversationHistory: ConversationTurnPayload[] | undefined;

  const { data: threadRows } = await supabase
    .from("chat_messages")
    .select("role, content")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true })
    .limit(60);

  if (threadRows && threadRows.length >= 2) {
    const last = threadRows[threadRows.length - 1];
    if (last?.role !== "user") {
      conversationHistory = undefined;
    } else {
      const prior = threadRows.slice(0, -1);
      const turns: ConversationTurnPayload[] = [];
      for (const row of prior) {
        const roleRaw = typeof row.role === "string" ? row.role.trim() : "";
        if (roleRaw !== "user" && roleRaw !== "assistant") continue;
        if (typeof row.content !== "string") continue;

        let text = row.content.trim();
        if (!text) continue;
        if (roleRaw === "user") text = text.slice(0, USER_CONTEXT_CHAR_CAP);
        else text = assistantPlainForAgentContext(text);

        if (!text.trim()) continue;
        turns.push({ role: roleRaw, content: text });
      }
      conversationHistory =
        turns.length > CONVERSATION_HISTORY_MAX_TURNS
          ? turns.slice(-CONVERSATION_HISTORY_MAX_TURNS)
          : turns;
    }
  }

  let assistantText: string;
  let agentResponse: ConsultAgentResponse | null = null;

  const agent = await callVetRagAgent(
    ragMessage,
    ragSpecies,
    preferenceHints,
    conversationHistory,
  );
  if (agent) {
    agentResponse = agent;
    assistantText = formatAgentForStorage(agent);
  } else {
    assistantText = await generateAssistantReply(
      ragMessage,
      preferenceHints,
      conversationHistory,
    );
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
