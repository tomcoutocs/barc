import type { SupabaseClient } from "@supabase/supabase-js";

const MAX_TEACHING_CHARS = 3_200;
const EXCERPT_LEN = 320;
const SCENARIO_LEN = 240;
const NOTES_LEN = 400;

type TeachingRow = {
  verdict: string;
  scenario_context: string | null;
  assistant_excerpt: string | null;
  correction_notes: string | null;
  species: string | null;
  created_at: string;
};

function clip(text: string, max: number): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

function formatRow(row: TeachingRow, index: number): string {
  const tag =
    row.verdict === "correct"
      ? "REINFORCE"
      : row.verdict === "partial"
        ? "PARTIAL"
        : "CORRECT";
  const species = row.species ? ` (${row.species})` : "";
  const scenario = clip(row.scenario_context ?? "", SCENARIO_LEN);
  const excerpt = clip(row.assistant_excerpt ?? "", EXCERPT_LEN);
  const notes = clip(row.correction_notes ?? "", NOTES_LEN);
  const lines = [`${index}. [${tag}]${species}`];
  if (scenario) lines.push(`   Scenario: ${scenario}`);
  if (excerpt) lines.push(`   Model said: ${excerpt}`);
  if (notes) lines.push(`   Trainer notes: ${notes}`);
  return lines.join("\n");
}

/**
 * Global vet teaching corrections — merged into preference_hints for all consults.
 */
export async function fetchTeachingHintsForModel(
  supabase: SupabaseClient,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("model_teaching_corrections")
    .select("verdict, scenario_context, assistant_excerpt, correction_notes, species, created_at")
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(24);

  if (error || !data?.length) return null;

  const parts: string[] = [];
  let total = 0;
  let n = 0;
  for (const row of data as TeachingRow[]) {
    const block = formatRow(row, n + 1);
    if (total + block.length > MAX_TEACHING_CHARS) break;
    parts.push(block);
    total += block.length + 2;
    n += 1;
  }

  if (!parts.length) return null;

  return [
    "VET TEACHING CORRECTIONS (from trainer review — apply when relevant to similar cases):",
    "- INCORRECT / PARTIAL: avoid repeating the mistake; use the trainer notes instead.",
    "- REINFORCE: keep using patterns marked correct when they fit retrieved sources and safety.",
    "- Safety and RETRIEVED_CONTEXT always override teaching notes.",
    "",
    ...parts,
  ].join("\n");
}

export function mergePreferenceHints(
  userHints: string | null,
  teachingHints: string | null,
): string | null {
  const sections = [teachingHints, userHints].filter((s) => s?.trim());
  if (!sections.length) return null;
  const merged = sections.join("\n\n");
  return merged.length > 5_800 ? `${merged.slice(0, 5_800)}…` : merged;
}
