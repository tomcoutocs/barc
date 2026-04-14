import Image from "next/image";
import { Check } from "lucide-react";

const TIERS = [
  {
    name: "Basic",
    price: "$0",
    period: "/mo",
    highlight: false,
    dark: false,
    features: [
      { text: "1 consult / mo", included: true },
      { text: "Pet profile management", included: true },
      { text: "AI symptom checker", included: true },
      { text: "Priority chat", included: false },
    ],
    cta: "Current plan",
    ctaStyle: "outline" as const,
  },
  {
    name: "Plus",
    price: "$19",
    period: "/mo",
    highlight: true,
    dark: true,
    badge: "Most popular",
    features: [
      { text: "5 consults / mo", included: true },
      { text: "Priority chat access", included: true },
      { text: "Digital health vault", included: true },
      { text: "Emergency triage", included: true },
      { text: "Prescription renewal", included: true },
    ],
    cta: "Upgrade to Plus",
    ctaStyle: "coral" as const,
  },
  {
    name: "Premium",
    price: "$39",
    period: "/mo",
    highlight: false,
    dark: false,
    features: [
      { text: "Unlimited consults", included: true },
      { text: "Direct vet video calls", included: true },
      { text: "Multi-pet coverage (up to 3)", included: true },
      { text: "Personal health concierge", included: true },
    ],
    cta: "Go Premium",
    ctaStyle: "dark" as const,
  },
];

export default function PricingPage() {
  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-12 sm:px-6">
      <section className="text-center">
        <p className="inline-flex rounded-full bg-[var(--color-surface-high)] px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-[var(--color-secondary)]">
          Transparent pricing
        </p>
        <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-[var(--color-primary)] sm:text-5xl">
          Care that fits{" "}
          <span className="font-medium italic text-[var(--color-secondary-bright)]">
            your lifestyle
          </span>
          .
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-[var(--color-on-surface-muted)]">
          Choose a plan based on your dog’s needs. Upgrade or downgrade anytime
          as your pack grows.
        </p>
      </section>

      <section className="mt-16 grid gap-8 lg:grid-cols-3">
        {TIERS.map((tier) => (
          <div
            key={tier.name}
            className={`relative flex flex-col rounded-3xl p-8 shadow-[var(--shadow-float)] ${
              tier.dark
                ? "bg-[var(--color-primary-container)] text-[var(--color-on-primary)]"
                : "bg-[var(--color-surface-low)] text-[var(--color-on-surface)]"
            }`}
          >
            {tier.badge ? (
              <span className="absolute right-6 top-6 rounded-full bg-[var(--color-secondary-bright)] px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-[var(--color-on-primary)]">
                {tier.badge}
              </span>
            ) : null}
            <h2 className="text-lg font-bold uppercase tracking-wide opacity-90">
              {tier.name}
            </h2>
            <p className="mt-4 flex items-baseline gap-1">
              <span className="text-4xl font-extrabold">{tier.price}</span>
              <span className="text-sm opacity-80">{tier.period}</span>
            </p>
            <ul className="mt-8 flex-1 space-y-4 text-sm">
              {tier.features.map((f) => (
                <li
                  key={f.text}
                  className={`flex items-center gap-3 ${
                    f.included ? "" : "opacity-50 line-through"
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                      tier.dark
                        ? "bg-[color-mix(in_srgb,var(--color-secondary-bright)_35%,transparent)]"
                        : "bg-[color-mix(in_srgb,var(--color-secondary-bright)_22%,transparent)]"
                    }`}
                  >
                    <Check
                      className={`h-3.5 w-3.5 ${
                        f.included
                          ? "text-[var(--color-secondary-bright)]"
                          : "text-[var(--color-on-surface-muted)]"
                      }`}
                      strokeWidth={3}
                    />
                  </span>
                  {f.text}
                </li>
              ))}
            </ul>
            <button
              type="button"
              className={`mt-10 w-full rounded-2xl py-3.5 text-xs font-bold uppercase tracking-wide ${
                tier.ctaStyle === "outline"
                  ? "border-2 border-[color-mix(in_srgb,var(--color-on-surface)_22%,transparent)] text-[var(--color-on-surface-muted)]"
                  : tier.ctaStyle === "coral"
                    ? "bg-[var(--color-secondary-bright)] text-[var(--color-on-primary)] hover:brightness-110"
                    : "bg-[var(--color-primary-container)] text-[var(--color-on-primary)] hover:bg-[var(--color-primary)]"
              }`}
            >
              {tier.cta}
            </button>
          </div>
        ))}
      </section>

      <section className="mt-24 grid gap-12 lg:grid-cols-2 lg:items-center">
        <div>
          <h2 className="text-3xl font-extrabold text-[var(--color-primary)]">
            Why Barc Plus?
          </h2>
          <p className="mt-4 leading-relaxed text-[var(--color-on-surface-muted)]">
            Most pet parents choose Plus for the balance of speed, access, and
            peace of mind—without paying for features they won’t use yet.
          </p>
          <div className="mt-8 space-y-6">
            {[
              {
                title: "Lightning fast",
                body: "Average AI response under three minutes.",
              },
              {
                title: "Certified vets",
                body: "Board-certified professionals on call when you escalate.",
              },
            ].map((item) => (
              <div key={item.title} className="flex gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-container)] text-lg text-[var(--color-on-primary)]">
                  ✓
                </span>
                <div>
                  <p className="font-bold text-[var(--color-primary)]">
                    {item.title}
                  </p>
                  <p className="mt-1 text-sm text-[var(--color-on-surface-muted)]">
                    {item.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative">
          <div className="overflow-hidden rounded-3xl shadow-[var(--shadow-float)]">
            <Image
              src="https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=900&q=80"
              alt="Person with dog"
              width={800}
              height={560}
              className="h-auto w-full object-cover"
            />
          </div>
          <div className="absolute bottom-6 left-6 max-w-xs rounded-2xl bg-[var(--color-surface)] p-4 shadow-[var(--shadow-float)]">
            <p className="text-[var(--color-secondary-bright)]">★★★★★</p>
            <p className="mt-2 text-sm italic text-[var(--color-on-surface)]">
              “Plus saved us a trip to the ER when our pup ate something odd.”
            </p>
            <p className="mt-3 text-xs font-bold text-[var(--color-on-surface-muted)]">
              — Sarah K.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-24">
        <h2 className="text-center text-2xl font-extrabold text-[var(--color-primary)]">
          Common questions
        </h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {[
            {
              q: "Can I switch plans anytime?",
              a: "Yes—changes apply on your next billing cycle. Downgrades keep your data.",
            },
            {
              q: 'What counts as a "consult"?',
              a: "Each completed AI session or escalated vet touchpoint counts toward your monthly allowance.",
            },
            {
              q: "Is support really 24/7?",
              a: "AI is always on. Vet availability follows clinical hours with emergency triage on Plus and Premium.",
            },
            {
              q: "How do prescriptions work?",
              a: "Vets may recommend prescriptions where appropriate; fulfillment follows local pharmacy rules.",
            },
          ].map((item) => (
            <div
              key={item.q}
              className="rounded-3xl bg-[var(--color-surface-low)] p-6 shadow-[var(--shadow-float)]"
            >
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-secondary-bright)]">
                {item.q}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-[var(--color-on-surface)]">
                {item.a}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
