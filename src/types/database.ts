/**
 * Hand-maintained schema snapshot for editor hints.
 * Regenerate from Supabase when the schema changes, e.g.:
 * npx supabase gen types typescript --project-id <ref> --schema public > src/types/database.gen.ts
 */

export type SubscriptionPlan = "basic" | "plus" | "premium";

export type Profile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Pet = {
  id: string;
  user_id: string;
  name: string;
  breed: string | null;
  age_years: number | null;
  weight_kg: number | null;
  activity_level: string | null;
  photo_url: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};
