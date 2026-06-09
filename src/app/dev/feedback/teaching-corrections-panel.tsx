"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronRight, GraduationCap } from "lucide-react";
import type { TeachingCorrectionRow, TeachingVerdict } from "@/types/teaching-correction";

function verdictLabel(v: TeachingVerdict): string {
  if (v === "correct") return "Accurate";
  if (v === "partial") return "Partial";
  return "Wrong";
}

function verdictClass(v: TeachingVerdict): string {
  if (v === "correct") return "bg-[color-mix(in_srgb,var(--color-tertiary)_25%,transparent)] text-[var(--color-primary)]";
  if (v === "partial") return "bg-[color-mix(in_srgb,var(--color-secondary)_18%,transparent)] text-[var(--color-secondary)]";
  return "bg-[color-mix(in_srgb,var(--color-secondary)_30%,transparent)] text-[var(--color-secondary)]";
}

function TeachingCorrectionCard({
  row,
  onUpdated,
}: {
  row: TeachingCorrectionRow;
  onUpdated: (row: TeachingCorrectionRow) => void;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [verdict, setVerdict] = useState(row.verdict);
  const [notes, setNotes] = useState(row.correction_notes);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setVerdict(row.verdict);
    setNotes(row.correction_notes);
  }, [row]);

  async function patch(fields: {
    verdict?: TeachingVerdict;
    correction_notes?: string;
    active?: boolean;
  }) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/dev/teaching-corrections", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: row.id, ...fields }),
      });
      const data = (await res.json()) as {
        error?: string;
        correction?: TeachingCorrectionRow;
      };
      if (!res.ok || !data.correction) {
        setError(data.error ?? "Could not save");
        return;
      }
      onUpdated(data.correction);
      setEditing(false);
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (verdict !== "correct" && !notes.trim()) {
      setError("Add notes for partial or incorrect verdicts");
      return;
    }
    await patch({ verdict, correction_notes: notes.trim() });
  }

  return (
    <article
      className={`rounded-2xl border bg-[var(--color-surface)] shadow-[var(--shadow-float)] ${
        row.active
          ? "border-[color-mix(in_srgb,var(--color-on-surface)_12%,transparent)]"
          : "border-dashed border-[color-mix(in_srgb,var(--color-on-surface)_20%,transparent)] opacity-75"
      }`}
    >
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
            {row.species ? (
              <>
                <span>·</span>
                <span>{row.species}</span>
              </>
            ) : null}
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${verdictClass(row.verdict)}`}
            >
              {verdictLabel(row.verdict)}
            </span>
            {!row.active ? (
              <span className="rounded-full bg-[color-mix(in_srgb,var(--color-on-surface)_12%,transparent)] px-2 py-0.5 text-[10px] font-bold uppercase">
                Inactive
              </span>
            ) : null}
          </div>
          <p className="mt-2 line-clamp-2 text-sm font-semibold text-[var(--color-primary)]">
            {row.correction_notes}
          </p>
          {row.scenario_context ? (
            <p className="mt-1 line-clamp-1 text-xs text-[var(--color-on-surface-muted)]">
              Scenario: {row.scenario_context}
            </p>
          ) : null}
        </div>
      </button>

      {open ? (
        <div className="space-y-4 border-t border-[color-mix(in_srgb,var(--color-on-surface)_8%,transparent)] px-5 py-4">
          {row.scenario_context ? (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--color-on-surface-muted)]">
                Scenario
              </p>
              <p className="mt-1 text-sm leading-relaxed">{row.scenario_context}</p>
            </div>
          ) : null}
          {row.assistant_excerpt ? (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--color-on-surface-muted)]">
                Model said
              </p>
              <p className="mt-1 text-sm leading-relaxed text-[var(--color-on-surface-muted)]">
                {row.assistant_excerpt}
              </p>
            </div>
          ) : null}

          {editing ? (
            <form onSubmit={saveEdit} className="space-y-3 rounded-xl bg-[var(--color-surface-low)] p-4">
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["correct", "Accurate"],
                    ["partial", "Partial"],
                    ["incorrect", "Wrong"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setVerdict(value)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold ${
                      verdict === value
                        ? "bg-[var(--color-primary-container)] text-[var(--color-on-primary)]"
                        : "border border-[color-mix(in_srgb,var(--color-on-surface)_15%,transparent)]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full resize-y rounded-xl border border-[color-mix(in_srgb,var(--color-on-surface)_12%,transparent)] bg-[var(--color-surface)] px-3 py-2 text-sm outline-none"
                disabled={saving}
              />
              {error ? (
                <p className="text-xs font-medium text-[var(--color-secondary)]">{error}</p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-[var(--color-primary-container)] px-4 py-2 text-xs font-bold uppercase text-[var(--color-on-primary)] disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save changes"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setVerdict(row.verdict);
                    setNotes(row.correction_notes);
                    setError(null);
                  }}
                  className="rounded-xl border px-4 py-2 text-xs font-bold uppercase"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="rounded-xl border border-[color-mix(in_srgb,var(--color-on-surface)_18%,transparent)] px-4 py-2 text-xs font-bold uppercase text-[var(--color-primary)]"
              >
                Edit
              </button>
              {row.active ? (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void patch({ active: false })}
                  className="rounded-xl border border-[color-mix(in_srgb,var(--color-secondary)_35%,transparent)] px-4 py-2 text-xs font-bold uppercase text-[var(--color-secondary)] disabled:opacity-50"
                >
                  Deactivate
                </button>
              ) : (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void patch({ active: true })}
                  className="rounded-xl bg-[var(--color-tertiary)] px-4 py-2 text-xs font-bold uppercase text-[var(--color-on-primary)] disabled:opacity-50"
                >
                  Reactivate
                </button>
              )}
            </div>
          )}
          {!editing && error ? (
            <p className="text-xs font-medium text-[var(--color-secondary)]">{error}</p>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

export function TeachingCorrectionsPanel() {
  const [rows, setRows] = useState<TeachingCorrectionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/dev/teaching-corrections");
      const data = (await res.json()) as {
        error?: string;
        corrections?: TeachingCorrectionRow[];
      };
      if (!res.ok) {
        setError(data.error ?? "Could not load corrections");
        setRows([]);
        return;
      }
      setRows(data.corrections ?? []);
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

  const visible = showInactive ? rows : rows.filter((r) => r.active);
  const activeCount = rows.filter((r) => r.active).length;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-[var(--color-tertiary)]" />
          <p className="text-sm font-bold text-[var(--color-primary)]">
            Teaching corrections
          </p>
          <span className="text-xs text-[var(--color-on-surface-muted)]">
            {activeCount} active in model hints
          </span>
        </div>
        <label className="flex items-center gap-2 text-xs text-[var(--color-on-surface-muted)]">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="rounded"
          />
          Show inactive
        </label>
      </div>

      {loading ? (
        <p className="text-sm text-[var(--color-on-surface-muted)]">Loading…</p>
      ) : error ? (
        <p className="text-sm font-medium text-[var(--color-secondary)]">{error}</p>
      ) : visible.length === 0 ? (
        <p className="rounded-2xl bg-[var(--color-surface-low)] px-5 py-8 text-center text-sm text-[var(--color-on-surface-muted)]">
          No teaching corrections yet. Use the Teach tab to review AI replies and save
          notes.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {visible.map((row) => (
            <TeachingCorrectionCard
              key={row.id}
              row={row}
              onUpdated={(updated) =>
                setRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
