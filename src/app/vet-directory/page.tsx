import Image from "next/image";
import Link from "next/link";
import { Briefcase, Calendar, Check, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

const FALLBACK_VETS = [
  {
    id: "1",
    name: "Dr. Sarah Woof, DVM",
    title: "Chief Medical Officer",
    specialties: ["Internal Medicine", "AI Safety"],
    years_experience: 15,
    image_url:
      "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&q=80",
    is_active: true,
  },
  {
    id: "2",
    name: "Dr. James Paws, DVM",
    title: "Emergency & Triage",
    specialties: ["Emergency", "Pain Management"],
    years_experience: 12,
    image_url:
      "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&q=80",
    is_active: true,
  },
  {
    id: "3",
    name: "Dr. Mia Clawson, DVM",
    title: "Dermatology Lead",
    specialties: ["Dermatology", "Allergy"],
    years_experience: 10,
    image_url:
      "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&q=80",
    is_active: true,
  },
];

export default async function VetDirectoryPage() {
  const supabase = await createClient();
  const { data: rows, error } = await supabase
    .from("veterinarians")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const vets = !error && rows && rows.length > 0 ? rows : FALLBACK_VETS;

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-12 sm:px-6">
      <section className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-start">
        <div>
          <p className="inline-flex rounded-full bg-[color-mix(in_srgb,var(--color-secondary-bright)_22%,var(--color-surface))] px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-[var(--color-secondary)]">
            Expert supervision
          </p>
          <h1 className="mt-6 max-w-xl text-4xl font-extrabold leading-tight tracking-tight text-[var(--color-primary)] sm:text-5xl">
            Clinical oversight for{" "}
            <span className="font-medium italic text-[var(--color-secondary-bright)]">
              every interaction
            </span>
            .
          </h1>
          <p className="mt-6 max-w-xl leading-relaxed text-[var(--color-on-surface-muted)]">
            AI provides fast insights—protocols and escalations are monitored by
            a board of licensed veterinarians.
          </p>
        </div>
        <div className="flex flex-col gap-3 lg:max-w-sm">
          <div className="flex items-center gap-3 rounded-2xl bg-[var(--color-surface-high)] px-4 py-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--color-secondary-bright)_25%,transparent)] text-[var(--color-secondary)]">
              <Check className="h-5 w-5" strokeWidth={2.5} />
            </span>
            <p className="text-sm font-semibold text-[var(--color-primary)]">
              100% licensed US-based experts
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-[var(--color-primary-container)] px-4 py-3 text-[var(--color-on-primary)]">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--color-secondary-bright)_35%,transparent)]">
              <Star className="h-5 w-5 fill-[var(--color-secondary-bright)] text-[var(--color-secondary-bright)]" />
            </span>
            <p className="text-sm font-semibold">
              Board-certified specialized care
            </p>
          </div>
        </div>
      </section>

      <section className="mt-16 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {vets.map((v) => (
          <article
            key={v.id}
            className="flex flex-col rounded-3xl bg-[var(--color-surface-low)] p-5 shadow-[var(--shadow-float)]"
          >
            <div className="relative mx-auto aspect-square w-full max-w-[200px] overflow-hidden rounded-3xl bg-[var(--color-surface-high)]">
              <Image
                src={v.image_url ?? ""}
                alt={v.name}
                fill
                className="object-cover grayscale"
                sizes="(max-width: 768px) 100vw, 200px"
              />
            </div>
            <div className="mt-5 flex items-start justify-between gap-2">
              <h2 className="text-lg font-bold text-[var(--color-primary)]">
                {v.name}
              </h2>
              <span className="rounded-full bg-[var(--color-primary)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--color-on-primary)]">
                Active
              </span>
            </div>
            <p className="mt-1 text-xs font-bold uppercase tracking-wide text-[var(--color-secondary-bright)]">
              {v.title}
            </p>
            <div className="mt-4 space-y-2 text-sm text-[var(--color-on-surface-muted)]">
              <p className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 shrink-0 text-[var(--color-secondary)]" />
                {Array.isArray(v.specialties)
                  ? v.specialties.join(", ")
                  : ""}
              </p>
              <p className="flex items-center gap-2">
                <Calendar className="h-4 w-4 shrink-0 text-[var(--color-secondary)]" />
                {"years_experience" in v && v.years_experience != null
                  ? `${v.years_experience} years experience`
                  : ""}
              </p>
            </div>
            <button
              type="button"
              className="mt-6 w-full rounded-2xl bg-[var(--color-primary-container)] py-3 text-xs font-bold uppercase tracking-wide text-[var(--color-on-primary)] transition hover:bg-[var(--color-primary)]"
            >
              View credentials
            </button>
          </article>
        ))}

        <div className="relative flex flex-col justify-between overflow-hidden rounded-3xl bg-[var(--color-primary-container)] p-8 text-[var(--color-on-primary)] shadow-[var(--shadow-float)] sm:col-span-2 xl:col-span-1">
          <div className="relative z-10">
            <h2 className="text-2xl font-extrabold leading-tight">
              Join the{" "}
              <span className="italic text-[var(--color-secondary-bright)]">
                medical frontier
              </span>
              .
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-[color-mix(in_srgb,white_82%,transparent)]">
              Licensed DVM? Help shape veterinary telehealth with a team obsessed
              with safety and outcomes.
            </p>
            <Link
              href="/contact"
              className="mt-8 inline-flex rounded-2xl bg-[var(--color-secondary-bright)] px-6 py-3 text-xs font-bold uppercase tracking-wide text-[var(--color-on-primary)] transition hover:brightness-110"
            >
              Apply to the board
            </Link>
          </div>
          <div
            className="pointer-events-none absolute -bottom-6 -right-6 text-[color-mix(in_srgb,white_8%,transparent)]"
            aria-hidden
          >
            <svg width="180" height="180" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
            </svg>
          </div>
        </div>
      </section>
    </div>
  );
}
