import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createPet } from "@/app/settings/actions";
import { PetFields } from "@/components/pet-fields";

export default async function NewPetPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/settings/pets/new");
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
        Add a dog
      </h1>
      <form action={createPet} className="mt-8 space-y-5 rounded-3xl bg-[var(--color-surface-low)] p-6 shadow-[var(--shadow-float)] sm:p-8">
        <PetFields />
        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="submit"
            className="rounded-2xl bg-[var(--color-primary-container)] px-5 py-2.5 text-sm font-bold text-[var(--color-on-primary)] transition hover:bg-[var(--color-primary)]"
          >
            Save
          </button>
          <Link
            href="/settings"
            className="rounded-2xl border-2 border-[color-mix(in_srgb,var(--color-on-surface)_18%,transparent)] px-5 py-2.5 text-sm font-bold text-[var(--color-primary)]"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
