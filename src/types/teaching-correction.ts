export type TeachingVerdict = "correct" | "incorrect" | "partial";

export type TeachingCorrectionRow = {
  id: string;
  created_by: string;
  message_id: string | null;
  thread_id: string | null;
  scenario_context: string;
  assistant_excerpt: string;
  verdict: TeachingVerdict;
  correction_notes: string;
  species: string | null;
  active: boolean;
  created_at: string;
};
