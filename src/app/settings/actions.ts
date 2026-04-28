"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type ActionState = { error?: string; ok?: boolean };

export async function updatePassword(_: ActionState, formData: FormData): Promise<ActionState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (password !== confirm) {
    return { error: "Passwords do not match." };
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { error: error.message };
  }
  revalidatePath("/settings");
  return { ok: true };
}

export async function createPet(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login?next=/settings/pets/new");
  }

  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    return;
  }

  const breed = String(formData.get("breed") ?? "").trim() || null;
  const speciesRaw = String(formData.get("species") ?? "dog").trim().toLowerCase();
  const species = speciesRaw === "cat" ? "cat" : "dog";
  const ageRaw = String(formData.get("age_years") ?? "").trim();
  const weightRaw = String(formData.get("weight_kg") ?? "").trim();
  const activity_level = String(formData.get("activity_level") ?? "").trim() || null;
  const photo_url = String(formData.get("photo_url") ?? "").trim() || null;
  const status = String(formData.get("status") ?? "healthy").trim() || "healthy";

  const age_years = ageRaw ? Number.parseInt(ageRaw, 10) : null;
  const weight_kg = weightRaw ? Number.parseFloat(weightRaw) : null;

  const { error } = await supabase.from("pets").insert({
    user_id: user.id,
    name,
    species,
    breed,
    age_years: Number.isFinite(age_years) ? age_years : null,
    weight_kg: Number.isFinite(weight_kg) ? weight_kg : null,
    activity_level,
    photo_url,
    status,
  });

  if (error) {
    throw new Error(error.message);
  }
  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/consult");
  redirect("/settings");
}

export async function updatePet(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const id = String(formData.get("id") ?? "");
  if (!id) {
    return;
  }

  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    return;
  }

  const breed = String(formData.get("breed") ?? "").trim() || null;
  const speciesRaw = String(formData.get("species") ?? "dog").trim().toLowerCase();
  const species = speciesRaw === "cat" ? "cat" : "dog";
  const ageRaw = String(formData.get("age_years") ?? "").trim();
  const weightRaw = String(formData.get("weight_kg") ?? "").trim();
  const activity_level = String(formData.get("activity_level") ?? "").trim() || null;
  const photo_url = String(formData.get("photo_url") ?? "").trim() || null;
  const status = String(formData.get("status") ?? "healthy").trim() || "healthy";

  const age_years = ageRaw ? Number.parseInt(ageRaw, 10) : null;
  const weight_kg = weightRaw ? Number.parseFloat(weightRaw) : null;

  const { error } = await supabase
    .from("pets")
    .update({
      name,
      species,
      breed,
      age_years: Number.isFinite(age_years) ? age_years : null,
      weight_kg: Number.isFinite(weight_kg) ? weight_kg : null,
      activity_level,
      photo_url,
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }
  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/consult");
  redirect("/settings");
}

export async function deletePet(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }
  const id = String(formData.get("id") ?? "");
  if (!id) {
    return;
  }
  await supabase.from("pets").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/consult");
  redirect("/settings");
}
