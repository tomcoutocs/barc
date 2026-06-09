"use client";

import Image from "next/image";
import { CheckCircle2, GraduationCap, Send } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AssistantConsultMessage,
  type ConsultMessage,
  type ConsultPet,
} from "./consult-chat";

function TypingIndicator() {
  return (
    <div
      className="consult-typing-bubble-shell max-w-[92%] rounded-3xl rounded-bl-md border bg-[var(--color-surface)] px-5 py-4 shadow-[var(--shadow-float)]"
      role="status"
      aria-label="Assistant is typing"
    >
      <div className="flex items-center gap-1.5 px-1 py-0.5">
        <span className="consult-typing-dot inline-block h-2 w-2 rounded-full bg-[var(--color-on-surface-muted)]" />
        <span className="consult-typing-dot inline-block h-2 w-2 rounded-full bg-[var(--color-on-surface-muted)]" />
        <span className="consult-typing-dot inline-block h-2 w-2 rounded-full bg-[var(--color-on-surface-muted)]" />
      </div>
    </div>
  );
}

function TeachingReviewPanel({
  messageId,
  threadId,
  scenarioContext,
  species,
  onSaved,
}: {
  messageId: string;
  threadId: string;
  scenarioContext: string;
  species?: string | null;
  onSaved: (messageId: string) => void;
}) {
  const [verdict, setVerdict] = useState<"correct" | "incorrect" | "partial">("incorrect");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting || saved) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/chat/teaching-correction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId,
          threadId,
          scenarioContext,
          verdict,
          correctionNotes: notes,
          species: species === "cat" ? "cat" : species === "dog" ? "dog" : null,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not save");
        return;
      }
      setSaved(true);
      onSaved(messageId);
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  if (saved) {
    return (
      <p className="flex items-center gap-2 text-xs font-semibold text-[var(--color-tertiary)]">
        <CheckCircle2 className="h-4 w-4" />
        Saved — future owner chats will use this correction.
      </p>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-[color-mix(in_srgb,var(--color-tertiary)_35%,transparent)] bg-[color-mix(in_srgb,var(--color-tertiary)_6%,transparent)] p-4"
    >
      <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-primary)]">
        Trainer review
      </p>
      <p className="mt-1 text-[11px] text-[var(--color-on-surface-muted)]">
        Rate this reply — your notes are stored and injected into future consults.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {(
          [
            ["correct", "Accurate"],
            ["partial", "Partially right"],
            ["incorrect", "Wrong / fix"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setVerdict(value)}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
              verdict === value
                ? "bg-[var(--color-primary-container)] text-[var(--color-on-primary)]"
                : "border border-[color-mix(in_srgb,var(--color-on-surface)_15%,transparent)] text-[var(--color-primary)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={3}
        placeholder={
          verdict === "correct"
            ? "Optional: what was especially good about this reply?"
            : "What should the model do differently next time?"
        }
        className="mt-3 w-full resize-y rounded-xl border border-[color-mix(in_srgb,var(--color-on-surface)_12%,transparent)] bg-[var(--color-surface)] px-3 py-2 text-sm outline-none focus:border-[var(--color-tertiary)]"
        disabled={submitting}
      />
      {error ? (
        <p className="mt-2 text-xs font-medium text-[var(--color-secondary)]">{error}</p>
      ) : null}
      <button
        type="submit"
        disabled={submitting || (verdict !== "correct" && !notes.trim())}
        className="mt-3 rounded-xl bg-[var(--color-primary-container)] px-4 py-2 text-xs font-bold uppercase tracking-wide text-[var(--color-on-primary)] disabled:opacity-50"
      >
        {submitting ? "Saving…" : "Save for model learning"}
      </button>
    </form>
  );
}

export function TeachingChat({ pets }: { pets: ConsultPet[] }) {
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ConsultMessage[]>([]);
  const [activePetId, setActivePetId] = useState<string | null>(pets[0]?.id ?? null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [staggerAssistantId, setStaggerAssistantId] = useState<string | null>(null);
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const activePet = useMemo(
    () => pets.find((p) => p.id === activePetId) ?? pets[0],
    [pets, activePetId],
  );

  const bumpScroll = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  function scenarioForMessage(assistantIndex: number): string {
    for (let i = assistantIndex - 1; i >= 0; i--) {
      if (messages[i]?.role === "user") return messages[i].content;
    }
    return "";
  }

  function startNewSession() {
    setThreadId(null);
    setMessages([]);
    setError(null);
    setStaggerAssistantId(null);
    setReviewedIds(new Set());
  }

  async function sendMessage(e?: React.FormEvent) {
    e?.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;

    const optimisticId = `local-${crypto.randomUUID()}`;
    setMessages((m) => [
      ...m,
      {
        id: optimisticId,
        role: "user",
        content: text,
        created_at: new Date().toISOString(),
      },
    ]);
    setSending(true);
    setError(null);
    setDraft("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threadId,
          petId: activePet?.id ?? null,
          content: text,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        threadId?: string;
        userMessage?: ConsultMessage;
        assistantMessage?: ConsultMessage;
      };
      if (!res.ok) {
        setMessages((m) => m.filter((x) => x.id !== optimisticId));
        setError(data.error ?? "Could not send");
        setDraft(text);
        return;
      }
      if (data.threadId) setThreadId(data.threadId);
      if (data.userMessage && data.assistantMessage) {
        setStaggerAssistantId(data.assistantMessage.id);
        setMessages((m) => [
          ...m.filter((x) => x.id !== optimisticId),
          data.userMessage!,
          data.assistantMessage!,
        ]);
      }
    } catch {
      setMessages((m) => m.filter((x) => x.id !== optimisticId));
      setError("Network error");
      setDraft(text);
    } finally {
      setSending(false);
    }
  }

  const placeholderPet = activePet?.name ?? "the pet";

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 gap-8 px-4 sm:px-6 lg:grid lg:grid-cols-[minmax(0,240px)_1fr]">
      <aside className="hidden flex-col gap-4 lg:flex">
        <div className="rounded-2xl bg-[color-mix(in_srgb,var(--color-tertiary)_12%,transparent)] p-4">
          <p className="flex items-center gap-2 text-sm font-bold text-[var(--color-primary)]">
            <GraduationCap className="h-4 w-4" />
            Teaching mode
          </p>
          <p className="mt-2 text-xs leading-relaxed text-[var(--color-on-surface-muted)]">
            Pose owner scenarios, review each AI reply, and save corrections. Those
            notes are loaded into future owner consults automatically.
          </p>
        </div>
        {pets.length > 0 ? (
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-on-surface-muted)]">
              Species context
            </p>
            <select
              value={activePetId ?? ""}
              onChange={(e) => setActivePetId(e.target.value || null)}
              className="mt-2 w-full rounded-xl border border-[color-mix(in_srgb,var(--color-on-surface)_15%,transparent)] bg-[var(--color-surface)] px-3 py-2 text-sm"
            >
              {pets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.species === "cat" ? "cat" : "dog"})
                </option>
              ))}
            </select>
          </div>
        ) : null}
        <button
          type="button"
          onClick={startNewSession}
          className="rounded-2xl border border-[color-mix(in_srgb,var(--color-on-surface)_18%,transparent)] px-4 py-2 text-xs font-bold uppercase tracking-wide text-[var(--color-primary)]"
        >
          New teaching session
        </button>
      </aside>

      <div className="flex min-h-[70vh] flex-col rounded-[2rem] bg-[var(--color-surface-low)] p-4 shadow-[var(--shadow-float)] sm:p-6">
        <div className="border-b border-[color-mix(in_srgb,var(--color-on-surface)_8%,transparent)] pb-4">
          <p className="font-bold text-[var(--color-primary)]">Train the consultant</p>
          <p className="mt-1 text-xs text-[var(--color-on-surface-muted)]">
            Act as the vet trainer — send a scenario, then mark each AI response.
          </p>
        </div>

        <div className="flex flex-1 flex-col gap-6 overflow-y-auto py-6">
          {messages.length === 0 ? (
            <p className="text-center text-sm text-[var(--color-on-surface-muted)]">
              Example: &quot;Owner says their {placeholderPet} has been vomiting since
              yesterday and won&apos;t eat.&quot;
            </p>
          ) : (
            messages.map((m, idx) =>
              m.role === "user" ? (
                <div
                  key={m.id}
                  className="ml-auto max-w-[85%] rounded-3xl rounded-br-md bg-[var(--color-primary-container)] px-5 py-4 text-sm text-[var(--color-on-primary)]"
                >
                  {m.content}
                </div>
              ) : (
                <div key={m.id} className="flex max-w-[92%] flex-col gap-3">
                  <AssistantConsultMessage
                    content={m.content}
                    species={activePet?.species}
                    stagger={m.id === staggerAssistantId}
                    onStaggerProgress={bumpScroll}
                    onStaggerComplete={() => setStaggerAssistantId(null)}
                  />
                  {threadId && !m.id.startsWith("local-") && !reviewedIds.has(m.id) ? (
                    <TeachingReviewPanel
                      messageId={m.id}
                      threadId={threadId}
                      scenarioContext={scenarioForMessage(idx)}
                      species={activePet?.species}
                      onSaved={(id) =>
                        setReviewedIds((prev) => new Set(prev).add(id))
                      }
                    />
                  ) : null}
                  {reviewedIds.has(m.id) ? (
                    <p className="text-xs text-[var(--color-tertiary)]">Review saved</p>
                  ) : null}
                </div>
              ),
            )
          )}
          {sending ? <TypingIndicator /> : null}
          <div ref={bottomRef} />
        </div>

        {error ? (
          <p className="text-sm font-medium text-[var(--color-secondary)]">{error}</p>
        ) : null}

        <form
          onSubmit={sendMessage}
          className="mt-auto flex items-center gap-3 rounded-3xl bg-[var(--color-surface)] px-4 py-3 shadow-inner"
        >
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Describe an owner scenario or follow up…"
            className="min-w-0 flex-1 border-0 bg-transparent text-sm outline-none"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={sending || !draft.trim()}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary-container)] text-[var(--color-on-primary)] disabled:opacity-50"
            aria-label="Send"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
