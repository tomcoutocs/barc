"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronRight, MessageSquare } from "lucide-react";
import type { ChatSessionFeedbackRow } from "@/types/chat-session-feedback";
import { parseStoredAgentContent } from "@/types/consult-agent";

function messagePreview(content: string, role: string): string {
  if (role !== "assistant") return content;
  const { fallbackText, structured } = parseStoredAgentContent(content);
  if (structured?.summary) return structured.summary;
  return fallbackText.slice(0, 280);
}

function FeedbackCard({ row }: { row: ChatSessionFeedbackRow }) {
  const [open, setOpen] = useState(false);
  const snap = row.snapshot;
  const petLabel = snap.pet_name
    ? `${snap.pet_name}${snap.pet_species ? ` (${snap.pet_species})` : ""}`
    : "No pet";

  return (
    <article className="rounded-2xl border border-[color-mix(in_srgb,var(--color-on-surface)_12%,transparent)] bg-[var(--color-surface)] shadow-[var(--shadow-float)]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start gap-3 px-5 py-4 text-left"
      >
        {open ? (
          <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-on-surface-muted)]" />
        ) : (
          <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-on-surface-muted)]" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-on-surface-muted)]">
            <time dateTime={row.created_at}>
              {new Date(row.created_at).toLocaleString()}
            </time>
            <span>·</span>
            <span>{row.user_email ?? row.user_id.slice(0, 8)}</span>
            <span>·</span>
            <span>{petLabel}</span>
            <span>·</span>
            <span className="inline-flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {snap.messages.length} messages
            </span>
          </div>
          <p className="mt-2 text-sm font-semibold text-[var(--color-primary)]">
            {row.comment}
          </p>
        </div>
      </button>
      {open ? (
        <div className="border-t border-[color-mix(in_srgb,var(--color-on-surface)_8%,transparent)] px-5 py-4">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-wide text-[var(--color-on-surface-muted)]">
            Full chat snapshot
          </p>
          <div className="flex max-h-[28rem] flex-col gap-3 overflow-y-auto">
            {snap.messages.map((m) => (
              <div
                key={m.id}
                className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "ml-8 bg-[var(--color-primary-container)] text-[var(--color-on-primary)]"
                    : "mr-8 bg-[var(--color-surface-low)] text-[var(--color-on-surface)]"
                }`}
              >
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wide opacity-70">
                  {m.role}
                </p>
                <p className="whitespace-pre-wrap">{messagePreview(m.content, m.role)}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </article>
  );
}

export function DevFeedbackViewer({ embedded = false }: { embedded?: boolean }) {
  const [rows, setRows] = useState<ChatSessionFeedbackRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/dev/session-feedback");
      const data = (await res.json()) as {
        error?: string;
        feedback?: ChatSessionFeedbackRow[];
      };
      if (!res.ok) {
        setError(data.error ?? "Could not load feedback");
        setRows([]);
        return;
      }
      setRows(data.feedback ?? []);
    } catch {
      setError("Network error");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div
      className={
        embedded
          ? "w-full"
          : "mx-auto w-full max-w-4xl px-4 py-10 sm:px-6"
      }
    >
      <div
        className={`flex flex-wrap items-end justify-between gap-4 ${embedded ? "mb-4" : "mb-8"}`}
      >
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-secondary)]">
            Development only
          </p>
          {!embedded ? (
            <h1 className="mt-1 text-2xl font-extrabold text-[var(--color-primary)]">
              Chat feedback review
            </h1>
          ) : null}
          <p
            className={`max-w-xl text-sm text-[var(--color-on-surface-muted)] ${embedded ? "mt-1" : "mt-2"}`}
          >
            Stored in the database — not emailed. Expand any row to read the full chat
            snapshot.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="rounded-2xl border border-[color-mix(in_srgb,var(--color-on-surface)_18%,transparent)] px-4 py-2 text-xs font-bold uppercase tracking-wide text-[var(--color-primary)] disabled:opacity-50"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-[var(--color-on-surface-muted)]">Loading…</p>
      ) : error ? (
        <p className="text-sm font-medium text-[var(--color-secondary)]" role="alert">
          {error}
        </p>
      ) : rows.length === 0 ? (
        <p className="rounded-2xl bg-[var(--color-surface-low)] px-5 py-8 text-center text-sm text-[var(--color-on-surface-muted)]">
          No session feedback yet. Finish a consult chat and submit feedback to see it
          here.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {rows.map((row) => (
            <FeedbackCard key={row.id} row={row} />
          ))}
        </div>
      )}
    </div>
  );
}
