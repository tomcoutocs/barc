import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ChangePasswordForm } from "@/components/change-password-form";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/settings");
  }

  const { data: pets } = await supabase
    .from("pets")
    .select("id, name, breed, status")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-extrabold tracking-tight text-[var(--color-primary)]">
        Settings
      </h1>
      <p className="mt-2 text-sm text-[var(--color-on-surface-muted)]">
        Account security and your dogs.
      </p>

      <section className="mt-10 rounded-3xl bg-[var(--color-surface-low)] p-6 shadow-[var(--shadow-float)] sm:p-8">
        <h2 className="text-lg font-bold text-[var(--color-primary)]">Account</h2>
        <p className="mt-1 text-sm text-[var(--color-on-surface-muted)]">
          Signed in as{" "}
          <span className="font-semibold text-[var(--color-on-surface)]">
            {user.email}
          </span>
        </p>
        <p className="mt-4 text-sm text-[var(--color-on-surface-muted)]">
          Forgot your password? Use{" "}
          <Link
            href="/forgot-password"
            className="font-bold text-[var(--color-secondary)] underline-offset-4 hover:underline"
          >
            reset link
          </Link>{" "}
          while signed out, or set a new password below.
        </p>
        <div className="mt-6 border-t border-[color-mix(in_srgb,var(--color-on-surface)_8%,transparent)] pt-6">
          <h3 className="text-sm font-bold uppercase tracking-wide text-[var(--color-on-surface-muted)]">
            Change password
          </h3>
          <div className="mt-4">
            <ChangePasswordForm />
          </div>
        </div>
        <div className="mt-8 border-t border-[color-mix(in_srgb,var(--color-on-surface)_8%,transparent)] pt-6">
          <h3 className="text-sm font-bold uppercase tracking-wide text-[var(--color-on-surface-muted)]">
            Delete account
          </h3>
          <p className="mt-2 text-sm text-[var(--color-on-surface-muted)]">
            To delete your account and data, contact support from the Help page
            before launch; self-serve deletion can be wired to your support
            process.
          </p>
        </div>
      </section>

      <section className="mt-8 rounded-3xl bg-[var(--color-surface-low)] p-6 shadow-[var(--shadow-float)] sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-bold text-[var(--color-primary)]">My dogs</h2>
          <Link
            href="/settings/pets/new"
            className="inline-flex justify-center rounded-2xl bg-[var(--color-primary-container)] px-4 py-2.5 text-sm font-bold text-[var(--color-on-primary)] transition hover:bg-[var(--color-primary)]"
          >
            Add a dog
          </Link>
        </div>
        <ul className="mt-6 space-y-3">
          {pets && pets.length > 0 ? (
            pets.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-4 rounded-2xl bg-[var(--color-surface)] px-4 py-3"
              >
                <div>
                  <p className="font-bold text-[var(--color-primary)]">{p.name}</p>
                  <p className="text-sm text-[var(--color-on-surface-muted)]">
                    {p.breed ?? "—"} · {p.status === "healthy" ? "Healthy" : "Checkup due"}
                  </p>
                </div>
                <Link
                  href={`/settings/pets/${p.id}/edit`}
                  className="text-sm font-bold text-[var(--color-secondary-bright)] hover:underline"
                >
                  Edit
                </Link>
              </li>
            ))
          ) : (
            <li className="text-sm text-[var(--color-on-surface-muted)]">
              No dogs yet. Add one to power your dashboard and consults.
            </li>
          )}
        </ul>
      </section>

      <section className="mt-8 rounded-3xl border-2 border-dashed border-[color-mix(in_srgb,var(--color-on-surface)_15%,transparent)] bg-[var(--color-surface-low)] p-6 sm:p-8">
        <h2 className="text-lg font-bold text-[var(--color-primary)]">
          Notifications
        </h2>
        <p className="mt-2 text-sm text-[var(--color-on-surface-muted)]">
          Email and push preferences are disabled in v1. You’ll configure them
          here in a future release.
        </p>
      </section>
    </div>
  );
}
