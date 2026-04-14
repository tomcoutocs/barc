import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { deletePet, updatePet } from "@/app/settings/actions";
import { PetFields } from "@/components/pet-fields";

type PageProps = { params: Promise<{ id: string }> };

export default async function EditPetPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/settings/pets/${id}/edit`);
  }

  const { data: pet, error } = await supabase
    .from("pets")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !pet) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-lg flex-1 px-4 py-12 sm:px-6">
      <Link
        href="/settings"
        className="text-sm font-bold text-[var(--color-secondary-bright)] hover:underline"
      >
        ← Settings
      </Link>
      <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-[var(--color-primary)]">
        Edit {pet.name}
      </h1>
      <form
        action={updatePet}
        className="mt-8 space-y-5 rounded-3xl bg-[var(--color-surface-low)] p-6 shadow-[var(--shadow-float)] sm:p-8"
      >
        <PetFields
          showId
          petId={pet.id}
          defaults={{
            name: pet.name,
            breed: pet.breed,
            age_years: pet.age_years,
            weight_kg: pet.weight_kg != null ? Number(pet.weight_kg) : null,
            activity_level: pet.activity_level,
            photo_url: pet.photo_url,
            status: pet.status ?? "healthy",
          }}
        />
        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="submit"
            className="rounded-2xl bg-[var(--color-primary-container)] px-5 py-2.5 text-sm font-bold text-[var(--color-on-primary)] transition hover:bg-[var(--color-primary)]"
          >
            Save changes
          </button>
          <Link
            href="/settings"
            className="rounded-2xl border-2 border-[color-mix(in_srgb,var(--color-on-surface)_18%,transparent)] px-5 py-2.5 text-sm font-bold text-[var(--color-primary)]"
          >
            Cancel
          </Link>
        </div>
      </form>

      <form
        action={deletePet}
        className="mt-8 rounded-3xl border border-[color-mix(in_srgb,var(--color-secondary)_35%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_6%,transparent)] p-6"
      >
        <input type="hidden" name="id" value={pet.id} />
        <p className="text-sm font-bold text-[var(--color-primary)]">
          Remove this dog
        </p>
        <p className="mt-2 text-sm text-[var(--color-on-surface-muted)]">
          This cannot be undone. Related consult data may be detached per your
          schema.
        </p>
        <button
          type="submit"
          className="mt-4 rounded-2xl bg-[var(--color-secondary)] px-5 py-2.5 text-sm font-bold text-white transition hover:brightness-110"
        >
          Delete dog
        </button>
      </form>
    </div>
  );
}
