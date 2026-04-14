import Link from "next/link";
import Image from "next/image";
import { BriefcaseMedical, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/sign-out-button";

const PLAN_TITLE: Record<string, string> = {
  basic: "Barc Basic",
  plus: "Barc Plus",
  premium: "Barc Premium",
};

const PLAN_PRICE: Record<string, string> = {
  basic: "$0/mo",
  plus: "$19/mo",
  premium: "$39/mo",
};

const PLAN_BLURB: Record<string, string> = {
  basic: "Starter access with AI guidance and essential pet profiles.",
  plus: "Priority chat, digital health vault, and faster escalations.",
  premium: "Unlimited consults and direct vet touches where available.",
};

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let displayName = user?.email?.split("@")[0] ?? "there";
  type PetCard = {
    id: string;
    name: string;
    breed: string;
    age_years: number;
    weight_kg: number;
    activity_level: string;
    status: string;
    photo_url: string;
  };
  let pets: PetCard[] = [];

  let planKey = "basic";
  let renewalLabel = "—";
  let priceLabel = PLAN_PRICE.basic;

  const activities: {
    id: string;
    title: string;
    sub: string;
    status: string;
    when: string;
  }[] = [];

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle();
    if (profile?.display_name) displayName = profile.display_name;

    const { data: dbPets } = await supabase
      .from("pets")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (dbPets && dbPets.length > 0) {
      pets = dbPets.map((p) => ({
        id: p.id,
        name: p.name,
        breed: p.breed ?? "",
        age_years: p.age_years ?? 0,
        weight_kg: p.weight_kg != null ? Number(p.weight_kg) : 0,
        activity_level: p.activity_level ?? "—",
        status: (p.status ?? "healthy").toLowerCase(),
        photo_url:
          p.photo_url ??
          "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200&q=80",
      }));
    }

    const { data: sub } = await supabase
      .from("subscriptions")
      .select("plan, status, current_period_end")
      .eq("user_id", user.id)
      .maybeSingle();

    if (sub?.plan) {
      planKey = sub.plan;
      priceLabel = PLAN_PRICE[sub.plan] ?? PLAN_PRICE.basic;
      renewalLabel = sub.current_period_end
        ? formatWhen(sub.current_period_end)
        : sub.status === "active"
          ? "Active"
          : "—";
    }

    const { data: logRows } = await supabase
      .from("activity_log")
      .select("id, title, subtitle, status, occurred_at, kind")
      .eq("user_id", user.id)
      .order("occurred_at", { ascending: false })
      .limit(12);

    for (const row of logRows ?? []) {
      activities.push({
        id: row.id,
        title: row.title,
        sub: row.subtitle ?? row.kind ?? "",
        status: row.status,
        when: formatWhen(row.occurred_at),
      });
    }
  }

  const planTitle = PLAN_TITLE[planKey] ?? PLAN_TITLE.basic;
  const planBlurb = PLAN_BLURB[planKey] ?? PLAN_BLURB.basic;
  const firstPetName = pets[0]?.name;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-12 px-4 py-12 sm:px-6">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-secondary-bright)]">
            Welcome back, {displayName}.
          </p>
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-[var(--color-primary)] sm:text-5xl">
            Health is a{" "}
            <span className="font-medium italic text-[var(--color-secondary-bright)]">
              shared
            </span>{" "}
            journey.
          </h1>
          <div className="mt-4">
            <SignOutButton />
          </div>
        </div>
        <div className="flex w-full max-w-sm flex-col gap-3">
          <Link
            href="/consult"
            className="flex items-center justify-between gap-4 rounded-2xl bg-[var(--color-primary-container)] px-5 py-4 text-sm font-bold text-[var(--color-on-primary)] shadow-[var(--shadow-float)] transition hover:bg-[var(--color-primary)]"
          >
            Start New Consultation
            <BriefcaseMedical className="h-5 w-5 shrink-0" strokeWidth={1.75} />
          </Link>
          <Link
            href="/settings"
            className="flex items-center justify-between gap-4 rounded-2xl border-2 border-[color-mix(in_srgb,var(--color-primary-container)_22%,transparent)] bg-[var(--color-surface-low)] px-5 py-4 text-sm font-bold text-[var(--color-primary)] transition hover:bg-[var(--color-surface-high)]"
          >
            Update Pet Info
            <Pencil className="h-5 w-5 shrink-0" strokeWidth={1.75} />
          </Link>
        </div>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
        <section>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-[var(--color-primary)]">
              My Dogs
            </h2>
            <Link
              href="/settings"
              className="text-sm font-bold text-[var(--color-secondary-bright)] hover:underline"
            >
              Manage pets
            </Link>
          </div>
          <div className="space-y-4">
            {pets.length === 0 ? (
              <div className="rounded-3xl border-2 border-dashed border-[color-mix(in_srgb,var(--color-on-surface)_15%,transparent)] bg-[var(--color-surface-low)] p-8 text-center shadow-[var(--shadow-float)]">
                <p className="text-[var(--color-on-surface-muted)]">
                  No dogs yet.{" "}
                  <Link
                    href="/settings/pets/new"
                    className="font-bold text-[var(--color-secondary-bright)] underline"
                  >
                    Add your first dog
                  </Link>{" "}
                  to unlock your dashboard.
                </p>
              </div>
            ) : (
              pets.map((pet) => (
                <div
                  key={pet.id}
                  className="flex gap-4 rounded-3xl bg-[var(--color-surface-low)] p-4 shadow-[var(--shadow-float)]"
                >
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl">
                    <Image
                      src={pet.photo_url}
                      alt={pet.name}
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-bold text-[var(--color-primary)]">
                          {pet.name}
                        </p>
                        <p className="text-sm text-[var(--color-on-surface-muted)]">
                          {pet.age_years} Years · {pet.breed}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                          pet.status === "healthy"
                            ? "bg-[color-mix(in_srgb,var(--color-tertiary)_35%,transparent)] text-[var(--color-primary-container)]"
                            : "bg-[color-mix(in_srgb,var(--color-secondary-bright)_28%,transparent)] text-[var(--color-secondary)]"
                        }`}
                      >
                        {pet.status === "healthy" ? "Healthy" : "Checkup due"}
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div className="rounded-xl bg-[var(--color-surface)] px-3 py-2">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--color-on-surface-muted)]">
                          Weight
                        </p>
                        <p className="text-sm font-semibold">{pet.weight_kg}kg</p>
                      </div>
                      <div className="rounded-xl bg-[var(--color-surface)] px-3 py-2">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--color-on-surface-muted)]">
                          Activity
                        </p>
                        <p className="text-sm font-semibold capitalize">
                          {pet.activity_level}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-3xl bg-[var(--color-primary-container)] p-6 text-[var(--color-on-primary)] shadow-[var(--shadow-float)]">
            <p className="text-xs font-bold uppercase tracking-widest text-[color-mix(in_srgb,white_70%,transparent)]">
              Subscription
            </p>
            <h3 className="mt-3 text-2xl font-extrabold">{planTitle}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[color-mix(in_srgb,white_82%,transparent)]">
              {planBlurb}
            </p>
            <div className="my-5 h-px bg-[color-mix(in_srgb,var(--color-secondary-bright)_55%,transparent)]" />
            <div className="flex items-end justify-between text-sm">
              <div>
                <p className="text-[color-mix(in_srgb,white_70%,transparent)]">
                  Next renewal
                </p>
                <p className="font-semibold">{renewalLabel}</p>
              </div>
              <p className="text-lg font-extrabold">{priceLabel}</p>
            </div>
            <Link
              href="/pricing"
              className="mt-4 inline-block text-xs font-bold uppercase tracking-wide text-[var(--color-secondary-bright)] hover:underline"
            >
              View plans
            </Link>
          </div>
          <div className="rounded-3xl bg-[var(--color-secondary-bright)] p-6 text-[var(--color-on-primary)] shadow-[var(--shadow-float)]">
            <p className="text-xs font-bold uppercase tracking-widest text-[color-mix(in_srgb,white_85%,transparent)]">
              Daily tip
            </p>
            <p className="mt-3 text-sm italic leading-relaxed">
              {firstPetName
                ? `${firstPetName} stays healthiest with steady routines—consistent walks, fresh water, and scheduled checkups.`
                : "Add a dog to your profile to personalize tips and consult context."}
            </p>
          </div>
        </aside>
      </div>

      <section>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-[var(--color-primary)]">
              Recent Activity
            </h2>
            <p className="text-sm text-[var(--color-on-surface-muted)]">
              Detailed logs of health interactions.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-full border border-[color-mix(in_srgb,var(--color-on-surface)_15%,transparent)] px-4 py-2 text-xs font-bold uppercase tracking-wide text-[var(--color-primary)]"
            >
              Export PDF
            </button>
            <button
              type="button"
              className="rounded-full border border-[color-mix(in_srgb,var(--color-on-surface)_15%,transparent)] px-4 py-2 text-xs font-bold uppercase tracking-wide text-[var(--color-primary)]"
            >
              Filter
            </button>
          </div>
        </div>
        <ul className="space-y-3">
          {activities.length === 0 ? (
            <li className="rounded-3xl bg-[var(--color-surface-low)] px-5 py-6 text-sm text-[var(--color-on-surface-muted)] shadow-[var(--shadow-float)]">
              No activity yet. Start a consult to see your history here.
            </li>
          ) : (
            activities.map((row) => (
              <li
                key={row.id}
                className="flex cursor-pointer items-center justify-between gap-4 rounded-3xl bg-[var(--color-surface-low)] px-5 py-4 shadow-[var(--shadow-float)] transition hover:bg-[color-mix(in_srgb,var(--color-surface-high)_70%,var(--color-surface-low))]"
              >
                <div>
                  <p className="font-semibold text-[var(--color-primary)]">
                    {row.title}
                  </p>
                  <p className="text-sm text-[var(--color-on-surface-muted)]">
                    {row.sub}
                  </p>
                </div>
                <div className="text-right text-sm">
                  <p className="font-bold text-[var(--color-secondary-bright)]">
                    {row.status}
                  </p>
                  <p className="text-xs uppercase tracking-wide text-[var(--color-on-surface-muted)]">
                    {row.when}
                  </p>
                </div>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
