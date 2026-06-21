"use client";

import Image from "next/image";
import Link from "next/link";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  MessageSquarePlus,
  Paperclip,
  Send,
  Shield,
  Lock,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  parseStoredAgentContent,
  type ConsultAgentResponse,
} from "@/types/consult-agent";
import { DevFeedbackViewer } from "@/app/dev/feedback/dev-feedback-viewer";
import { TeachingChat } from "./teaching-chat";

export type ConsultPet = {
  id: string;
  name: string;
  breed: string | null;
  age_years: number | null;
  photo_url: string | null;
  /** dog | cat — drives vet-rag retrieval */
  species?: string | null;
};

export type ConsultMessage = {
  id: string;
  role: string;
  content: string;
  created_at: string;
};

function triageBubbleClass(level: string): string {
  switch (level) {
    case "emergency":
      return "consult-triage-emergency";
    case "high":
      return "consult-triage-high";
    case "moderate":
      return "consult-triage-moderate";
    default:
      return "consult-triage-low";
  }
}

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

function SessionFeedbackPanel({
  threadId,
  onSubmitted,
  onCancel,
}: {
  threadId: string;
  onSubmitted: () => void;
  onCancel: () => void;
}) {
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const text = comment.trim();
    if (!text || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/chat/session-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId, comment: text }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not submit feedback");
        return;
      }
      onSubmitted();
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-2xl border-2 border-[color-mix(in_srgb,var(--color-secondary)_35%,transparent)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-float)]">
      <p className="text-sm font-bold text-[var(--color-primary)]">
        How did this chat go?
      </p>
      <p className="mt-1 text-xs leading-relaxed text-[var(--color-on-surface-muted)]">
        Your notes and the full conversation are saved to the dev Feedback tab (not
        emailed). Then you&apos;ll start a fresh chat.
      </p>
      <form onSubmit={submit} className="mt-4 flex flex-col gap-3">
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          placeholder="What worked, what felt off, what was missing…"
          className="w-full resize-y rounded-2xl border border-[color-mix(in_srgb,var(--color-on-surface)_15%,transparent)] bg-[var(--color-surface-low)] px-4 py-3 text-sm text-[var(--color-on-surface)] outline-none placeholder:text-[var(--color-on-surface-muted)] focus:border-[var(--color-secondary)]"
          disabled={submitting}
        />
        {error ? (
          <p className="text-sm font-medium text-[var(--color-secondary)]" role="alert">
            {error}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={submitting || !comment.trim()}
            className="rounded-2xl bg-[var(--color-primary-container)] px-4 py-2 text-xs font-bold uppercase tracking-wide text-[var(--color-on-primary)] disabled:opacity-50"
          >
            {submitting ? "Saving…" : "Submit & new chat"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="rounded-2xl border border-[color-mix(in_srgb,var(--color-on-surface)_18%,transparent)] px-4 py-2 text-xs font-bold uppercase tracking-wide text-[var(--color-primary)]"
          >
            Keep chatting
          </button>
        </div>
      </form>
    </div>
  );
}

type BubbleChunk = { key: string; children: ReactNode };

function petLabel(species?: string | null): { noun: string } {
  if (species === "cat") return { noun: "cat" };
  return { noun: "dog" };
}

function splitSummarySentences(summary: string, max = 3): string[] {
  const trimmed = summary.trim();
  if (!trimmed) return [];
  const parts =
    trimmed.match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map((s) => s.trim()).filter(Boolean) ??
    [];
  if (parts.length <= 1) return [trimmed];
  return parts.slice(0, max);
}

function buildStructuredChunks(
  a: ConsultAgentResponse,
  species?: string | null,
  petName?: string | null,
): BubbleChunk[] {
  const { noun } = petLabel(species);
  const name = petName?.trim() || `your ${noun}`;
  const stillInvestigating =
    a.possible_causes.length === 0 && a.recommended_action.length === 0;
  const chunks: BubbleChunk[] = [];

  if (stillInvestigating) {
    if (a.triage_level === "high" || a.triage_level === "emergency") {
      chunks.push({
        key: "triage-urgent",
        children: (
          <p className="text-sm font-semibold leading-snug text-secondary">
            {a.urgency_message}
          </p>
        ),
      });
    }
  } else {
    if (a.triage_level === "emergency" || a.triage_level === "high") {
      chunks.push({
        key: "triage",
        children: (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-primary-container px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-on-primary">
                {a.triage_level}
              </span>
              {a.triage_level === "emergency" ? (
                <AlertTriangle className="h-4 w-4 shrink-0 text-secondary" aria-hidden />
              ) : null}
            </div>
            <p className="mt-2 font-semibold leading-snug text-secondary">
              {a.urgency_message}
            </p>
          </>
        ),
      });
    }
  }

  const summaryParts = splitSummarySentences(a.summary, stillInvestigating ? 4 : 3);
  for (const [i, sentence] of summaryParts.entries()) {
    chunks.push({
      key: `summary-${i}`,
      children: <p className="leading-relaxed">{sentence}</p>,
    });
  }

  if (a.possible_causes.length > 0) {
    chunks.push({
      key: "causes-intro",
      children: (
        <p className="text-sm leading-relaxed text-on-surface-muted">
          A few possibilities vets often consider for {name} — not a diagnosis:
        </p>
      ),
    });
    for (const [i, item] of a.possible_causes.entries()) {
      chunks.push({
        key: `cause-${i}`,
        children: <p className="leading-relaxed">{item}</p>,
      });
    }
  }

  if (a.what_to_monitor.length > 0) {
    chunks.push({
      key: "monitor-intro",
      children: (
        <p className="text-sm font-semibold text-on-surface">Watch for</p>
      ),
    });
    for (const [i, item] of a.what_to_monitor.entries()) {
      chunks.push({
        key: `monitor-${i}`,
        children: <p className="leading-relaxed">{item}</p>,
      });
    }
  }

  if (a.recommended_action.length > 0) {
    chunks.push({
      key: "actions-intro",
      children: (
        <p className="text-sm font-semibold text-on-surface">What I&apos;d do next</p>
      ),
    });
    for (const [i, item] of a.recommended_action.entries()) {
      chunks.push({
        key: `action-${i}`,
        children: <p className="leading-relaxed">{item}</p>,
      });
    }
  }

  return chunks;
}

function buildPlainChunks(content: string): BubbleChunk[] {
  const blocks = content
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (blocks.length <= 1) {
    return [{ key: "plain", children: content }];
  }
  return blocks.slice(0, 5).map((block, i) => ({
    key: `plain-${i}`,
    children: <p className="whitespace-pre-wrap leading-relaxed">{block}</p>,
  }));
}

export function AssistantConsultMessage({
  content,
  species,
  petName,
  stagger,
  onStaggerProgress,
  onStaggerComplete,
}: {
  content: string;
  species?: string | null;
  petName?: string | null;
  stagger?: boolean;
  onStaggerProgress?: () => void;
  onStaggerComplete?: () => void;
}) {
  const { chunks, structured } = useMemo(() => {
    const parsed = parseStoredAgentContent(content);
    const ch = parsed.structured
      ? buildStructuredChunks(parsed.structured, species, petName)
      : buildPlainChunks(content);
    return { chunks: ch, structured: parsed.structured };
  }, [content, species, petName]);

  const level = structured?.triage_level ?? "low";
  const totalChunks = chunks.length;

  const [animatedCount, setAnimatedCount] = useState(0);
  const visibleCount = stagger ? animatedCount : totalChunks;

  useEffect(() => {
    if (!stagger) return;
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(
      setTimeout(() => {
        let shown = 0;
        const showNext = () => {
          if (cancelled) return;
          shown += 1;
          setAnimatedCount(shown);
          onStaggerProgress?.();
          if (shown >= totalChunks) {
            onStaggerComplete?.();
            return;
          }
          timers.push(setTimeout(showNext, 520));
        };
        showNext();
      }, 320),
    );
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [stagger, totalChunks, onStaggerProgress, onStaggerComplete]);

  if (!structured) {
    return (
      <div className="flex flex-col gap-3">
        {chunks.slice(0, visibleCount).map((chunk, idx) => (
          <div
            key={chunk.key}
            className={`max-w-[92%] rounded-3xl rounded-bl-md bg-[var(--color-surface)] px-5 py-4 text-sm leading-relaxed text-[var(--color-on-surface)] shadow-[var(--shadow-float)] ${
              stagger && idx === visibleCount - 1 ? "consult-bubble-enter" : ""
            }`}
          >
            {chunk.children}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {chunks.slice(0, visibleCount).map((chunk, idx) => (
        <div
          key={chunk.key}
          className={`max-w-[92%] rounded-3xl rounded-bl-md border-2 px-5 py-4 text-sm leading-relaxed text-[var(--color-on-surface)] shadow-[var(--shadow-float)] ${triageBubbleClass(level)} ${
            stagger && idx === visibleCount - 1 ? "consult-bubble-enter" : ""
          }`}
        >
          {chunk.children}
        </div>
      ))}
    </div>
  );
}

type ConsultMainTab = "chat" | "teach" | "feedback";

function ConsultDevTabs({
  active,
  onChange,
}: {
  active: ConsultMainTab;
  onChange: (tab: ConsultMainTab) => void;
}) {
  const tabs: { id: ConsultMainTab; label: string }[] = [
    { id: "chat", label: "Chat" },
    { id: "teach", label: "Teach" },
    { id: "feedback", label: "Feedback" },
  ];

  return (
    <div className="mx-auto mb-6 flex w-full max-w-6xl px-4 sm:px-6">
      <div className="segmented-control" role="tablist" aria-label="Consult modes">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active === tab.id}
            data-active={active === tab.id}
            onClick={() => onChange(tab.id)}
            className="segmented-control-item"
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ConsultChat({
  pets,
  initialThreadId,
  initialMessages,
  showDevTab = false,
}: {
  pets: ConsultPet[];
  initialThreadId: string | null;
  initialMessages: ConsultMessage[];
  showDevTab?: boolean;
}) {
  const [mainTab, setMainTab] = useState<ConsultMainTab>("chat");
  const [threadId, setThreadId] = useState<string | null>(initialThreadId);
  const [messages, setMessages] = useState<ConsultMessage[]>(initialMessages);
  const [activePetId, setActivePetId] = useState<string | null>(
    pets[0]?.id ?? null,
  );
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [staggerAssistantId, setStaggerAssistantId] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const activePet = useMemo(
    () => pets.find((p) => p.id === activePetId) ?? pets[0],
    [pets, activePetId],
  );

  const bumpScroll = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const completeStagger = useCallback(() => {
    setStaggerAssistantId(null);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending, staggerAssistantId]);

  function startNewChat() {
    setThreadId(null);
    setMessages([]);
    setError(null);
    setStaggerAssistantId(null);
    setShowFeedback(false);
  }

  function handleFeedbackSubmitted() {
    startNewChat();
  }

  const canSubmitFeedback =
    Boolean(threadId) &&
    messages.some((m) => m.role === "assistant" && !m.id.startsWith("local-"));

  async function sendMessage(e?: React.FormEvent) {
    e?.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;

    const optimisticId = `local-${crypto.randomUUID()}`;
    const optimisticMessage: ConsultMessage = {
      id: optimisticId,
      role: "user",
      content: text,
      created_at: new Date().toISOString(),
    };

    setMessages((m) => [...m, optimisticMessage]);
    setSending(true);
    setError(null);
    setDraft("");

    const dropOptimistic = () => {
      setMessages((m) => m.filter((x) => x.id !== optimisticId));
    };

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
        agentResponse?: ConsultAgentResponse | null;
      };
      if (!res.ok) {
        dropOptimistic();
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
      } else {
        dropOptimistic();
        setError("Something went wrong");
        setDraft(text);
      }
    } catch {
      dropOptimistic();
      setError("Network error");
      setDraft(text);
    } finally {
      setSending(false);
    }
  }

  const defaultYourPet =
    activePet?.species === "cat"
      ? "your cat"
      : activePet?.species === "dog"
        ? "your dog"
        : "your pet";
  const placeholderPetName = activePet?.name ?? defaultYourPet;

  if (showDevTab && mainTab === "teach") {
    return (
      <div className="flex flex-1 flex-col py-10">
        <ConsultDevTabs active={mainTab} onChange={setMainTab} />
        <TeachingChat pets={pets} />
      </div>
    );
  }

  if (showDevTab && mainTab === "feedback") {
    return (
      <div className="flex flex-1 flex-col py-10">
        <ConsultDevTabs active={mainTab} onChange={setMainTab} />
        <div className="mx-auto w-full max-w-6xl flex-1 px-4 sm:px-6">
          <DevFeedbackViewer embedded />
        </div>
      </div>
    );
  }

  return (
    <div className="page-mesh flex flex-1 flex-col py-8 sm:py-10">
      {showDevTab ? <ConsultDevTabs active={mainTab} onChange={setMainTab} /> : null}
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 sm:px-6 lg:grid lg:grid-cols-[minmax(0,260px)_1fr] lg:gap-8">
      {pets.length > 0 ? (
        <div className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
          {pets.map((pet) => {
            const active = pet.id === (activePetId ?? pets[0]?.id);
            const img =
              pet.photo_url ??
              "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=120&q=80";
            return (
              <button
                key={pet.id}
                type="button"
                onClick={() => setActivePetId(pet.id)}
                className={`flex shrink-0 items-center gap-2 rounded-2xl px-3 py-2 transition ${
                  active
                    ? "bg-surface-high shadow-soft ring-1 ring-secondary/20"
                    : "bg-surface-low/80"
                }`}
              >
                <div className="relative h-9 w-9 overflow-hidden rounded-xl">
                  <Image src={img} alt={pet.name} fill className="object-cover" sizes="36px" />
                </div>
                <span className="text-sm font-bold text-primary">{pet.name}</span>
              </button>
            );
          })}
        </div>
      ) : null}
      <aside className="hidden flex-col gap-6 lg:flex">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-on-surface-muted">
            Your pets
          </h2>
          {pets.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--color-on-surface-muted)]">
              Add a pet in{" "}
              <Link
                href="/settings/pets/new"
                className="font-bold text-[var(--color-secondary-bright)] underline"
              >
                Settings
              </Link>{" "}
              so consults can reference them.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {pets.map((pet) => {
                const active = pet.id === (activePetId ?? pets[0]?.id);
                const detail = [
                  pet.breed ?? (pet.species === "cat" ? "Cat" : "Dog"),
                  pet.age_years != null ? `${pet.age_years}y` : null,
                ]
                  .filter(Boolean)
                  .join(" · ");
                const img =
                  pet.photo_url ??
                  "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=120&q=80";
                return (
                  <button
                    key={pet.id}
                    type="button"
                    onClick={() => setActivePetId(pet.id)}
                    className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left transition duration-200 ${
                      active
                        ? "bg-surface-high shadow-soft ring-1 ring-secondary/15"
                        : "bg-surface-low/60 hover:bg-surface-low"
                    }`}
                  >
                    <div className="relative h-12 w-12 overflow-hidden rounded-xl">
                      <Image
                        src={img}
                        alt={pet.name}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold text-[var(--color-primary)]">
                        {pet.name}
                      </p>
                      <p className="truncate text-xs text-[var(--color-on-surface-muted)]">
                        {detail}
                      </p>
                    </div>
                    {active ? (
                      <span className="rounded-full bg-[color-mix(in_srgb,var(--color-secondary-bright)_25%,transparent)] px-2 py-0.5 text-[10px] font-bold uppercase text-[var(--color-secondary)]">
                        Active
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          )}
          <Link
            href="/settings/pets/new"
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[color-mix(in_srgb,var(--color-on-surface)_18%,transparent)] py-3 text-sm font-bold text-[var(--color-primary)] transition hover:bg-[var(--color-surface-low)]"
          >
            + Add new pet
          </Link>
        </div>
        <div className="mt-auto overflow-hidden rounded-3xl bg-primary-container p-5 text-sm leading-relaxed text-on-primary shadow-elevated">
          <p className="text-xs font-bold uppercase tracking-wider text-white/75">
            Daily tip
          </p>
          <p className="mt-2">
            Consistent daily motion is essential for maintaining joint health in
            larger breeds.
          </p>
        </div>
      </aside>

      <div className="glass-panel flex min-h-[70vh] flex-col rounded-[2rem] p-4 sm:p-6">
        <div className="flex flex-col gap-4 border-b border-primary/[0.06] pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-12 overflow-hidden rounded-2xl shadow-soft ring-2 ring-white/80">
              <Image
                src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=120&q=80"
                alt="Barc AI"
                fill
                className="object-cover"
                sizes="48px"
              />
            </div>
            <div>
              <p className="font-bold text-primary">Barc AI Consultant</p>
              <p className="flex items-center gap-1.5 text-xs font-medium text-on-surface-muted">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-tertiary" aria-hidden />
                Online · research-backed
                <CheckCircle2 className="h-3.5 w-3.5 text-tertiary" aria-hidden />
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {canSubmitFeedback ? (
              <button
                type="button"
                onClick={() => setShowFeedback(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-secondary/10 px-3 py-2 text-xs font-bold text-secondary transition hover:bg-secondary/15"
              >
                <MessageSquarePlus className="h-4 w-4" />
                Done — feedback
              </button>
            ) : null}
            <button
              type="button"
              onClick={startNewChat}
              className="rounded-xl bg-surface-high/80 px-3 py-2 text-xs font-bold text-primary transition hover:bg-surface-high"
            >
              New chat
            </button>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-xl bg-primary-container px-3 py-2 text-xs font-bold text-on-primary shadow-soft transition hover:bg-primary"
            >
              Book a vet
              <Camera className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-6 overflow-y-auto py-6">
          {messages.length === 0 ? (
            <div className="mx-auto max-w-md space-y-3 text-center">
              <p className="text-sm leading-relaxed text-on-surface-muted">
                Hi — I&apos;m here to help with{" "}
                {activePet?.name ? (
                  <span className="font-semibold text-primary">{activePet.name}</span>
                ) : (
                  placeholderPetName
                )}
                . Tell me what&apos;s going on in your own words; I&apos;ll ask only if I
                need something important to give useful guidance.
              </p>
              <p className="text-xs text-on-surface-muted/80">
                Educational only — not a diagnosis. For emergencies, contact a vet or ER
                clinic right away.
              </p>
            </div>
          ) : (
            messages.map((m) =>
              m.role === "user" ? (
                <div
                  key={m.id}
                  className={`ml-auto max-w-[85%] rounded-3xl rounded-br-md bg-primary-container px-5 py-3.5 text-sm leading-relaxed text-on-primary shadow-soft ${
                    m.id.startsWith("local-") ? "opacity-90" : ""
                  }`}
                  aria-busy={m.id.startsWith("local-") ? true : undefined}
                >
                  {m.content}
                </div>
              ) : (
                <div key={m.id} className="flex max-w-[92%] flex-col gap-2">
                  <AssistantConsultMessage
                    content={m.content}
                    species={activePet?.species}
                    petName={activePet?.name}
                    stagger={m.id === staggerAssistantId}
                    onStaggerProgress={bumpScroll}
                    onStaggerComplete={completeStagger}
                  />
                </div>
              ),
            )
          )}
          {sending ? <TypingIndicator /> : null}
          <div ref={bottomRef} />
        </div>

        {error ? (
          <p className="text-sm font-medium text-[var(--color-secondary)]" role="alert">
            {error}
          </p>
        ) : null}

        {showFeedback && threadId ? (
          <SessionFeedbackPanel
            threadId={threadId}
            onSubmitted={handleFeedbackSubmitted}
            onCancel={() => setShowFeedback(false)}
          />
        ) : null}

        <div className="mt-auto pt-4">
          <form
            onSubmit={sendMessage}
            className="flex items-center gap-2 rounded-2xl bg-surface p-2 shadow-elevated ring-1 ring-primary/[0.05]"
          >
            <Paperclip className="ml-2 h-5 w-5 shrink-0 text-on-surface-muted" aria-hidden />
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={`Message about ${placeholderPetName}…`}
              className="min-w-0 flex-1 border-0 bg-transparent px-1 py-2.5 text-sm text-on-surface outline-none placeholder:text-on-surface-muted"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={sending || !draft.trim()}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-container text-on-primary shadow-soft transition hover:bg-primary disabled:opacity-50"
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
          <p className="mt-3 text-center text-[11px] leading-relaxed text-[var(--color-on-surface-muted)]">
            When connected to the Barc knowledge backend, answers use retrieved
            veterinary sources plus safety triage. This is still not a diagnosis.
            Emergencies: contact your vet or an ER clinic immediately.
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-wide text-[var(--color-on-surface-muted)]">
            <span className="inline-flex items-center gap-1">
              <Shield className="h-3.5 w-3.5" aria-hidden /> Encrypted in transit
            </span>
            <span className="inline-flex items-center gap-1">
              <Lock className="h-3.5 w-3.5" aria-hidden /> Private to your account
            </span>
            <span className="ml-auto">Barc consult</span>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
