import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col">
      <section className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-24">
        <div className="space-y-8">
          <p className="inline-flex rounded-full bg-[color-mix(in_srgb,var(--color-tertiary)_22%,var(--color-surface))] px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-[var(--color-primary-container)]">
            Trusted by 100K+ pet parents
          </p>
          <h1 className="max-w-xl text-4xl font-extrabold leading-[1.1] tracking-tight text-[var(--color-primary)] [-webkit-letter-spacing:-0.02em] sm:text-5xl">
            <span className="font-semibold">Professional</span> vet advice,{" "}
            <span className="text-[var(--color-secondary-bright)]">
              now in your pocket.
            </span>
          </h1>
          <p className="max-w-lg text-lg leading-relaxed text-[var(--color-on-surface-muted)]">
            AI-driven symptom checks and live consultations with certified
            veterinarians—built for dogs and the people who love them.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/consult"
              className="inline-flex rounded-2xl bg-[var(--color-primary-container)] px-8 py-3.5 text-sm font-bold text-[var(--color-on-primary)] shadow-[var(--shadow-float)] transition hover:bg-[var(--color-primary)]"
            >
              Start consultation
            </Link>
            <Link
              href="/pricing"
              className="inline-flex rounded-2xl border-2 border-[color-mix(in_srgb,var(--color-primary-container)_35%,transparent)] px-8 py-3.5 text-sm font-bold text-[var(--color-primary-container)] transition hover:bg-[var(--color-surface-low)]"
            >
              How it works
            </Link>
          </div>
        </div>
        <div className="relative">
          <div className="overflow-hidden rounded-3xl bg-[var(--color-surface-low)] shadow-[var(--shadow-float)]">
            <Image
              src="https://images.unsplash.com/photo-1552053831-71594a27632d?w=800&q=80"
              alt="Happy dog outdoors"
              width={640}
              height={640}
              className="aspect-square h-auto w-full object-cover"
              priority
            />
          </div>
          <div className="absolute -bottom-4 left-4 max-w-xs rounded-2xl bg-[var(--color-surface)] p-4 shadow-[var(--shadow-float)] sm:-bottom-6 sm:left-8">
            <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-secondary)]">
              Vet on demand
            </p>
            <p className="mt-1 text-sm leading-relaxed text-[var(--color-on-surface)]">
              “Barc saved us an emergency trip at 2 AM. Truly a lifesaver.”
            </p>
          </div>
        </div>
      </section>

      <section className="bg-[var(--color-surface-low)] py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-[var(--color-primary)] sm:text-4xl">
              Care at the speed of light
            </h2>
            <p className="mt-4 text-[var(--color-on-surface-muted)]">
              From first question to a clear plan—without the waiting room.
            </p>
          </div>
          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {[
              {
                title: "Consult",
                body: "AI triage or direct chat with a vet when it matters.",
                accent: "bg-[color-mix(in_srgb,var(--color-secondary-bright)_18%,var(--color-surface))]",
              },
              {
                title: "Diagnose",
                body: "Clinical-grade assessments from history and visuals.",
                accent: "bg-[color-mix(in_srgb,var(--color-primary-container)_12%,var(--color-surface))]",
              },
              {
                title: "Resolve",
                body: "Plans, referrals, and follow-ups you can act on.",
                accent: "bg-[color-mix(in_srgb,var(--color-tertiary)_20%,var(--color-surface))]",
              },
            ].map((card) => (
              <div
                key={card.title}
                className={`rounded-3xl p-8 ${card.accent} shadow-[var(--shadow-float)]`}
              >
                <h3 className="text-xl font-bold text-[var(--color-primary)]">
                  {card.title}
                </h3>
                <p className="mt-3 leading-relaxed text-[var(--color-on-surface-muted)]">
                  {card.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div className="grid grid-cols-2 gap-4 sm:gap-6">
            <div className="rounded-3xl bg-[var(--color-primary-container)] p-8 text-[var(--color-on-primary)]">
              <p className="text-sm font-bold opacity-90">24/7</p>
              <p className="mt-2 text-lg font-extrabold">Instant support</p>
            </div>
            <div className="row-span-2 rounded-3xl bg-[var(--color-secondary-bright)] p-6 text-[var(--color-on-primary)]">
              <p className="text-sm font-bold uppercase tracking-wide">
                AI precision
              </p>
              <p className="mt-4 text-2xl font-extrabold leading-tight">
                Human-verified care
              </p>
            </div>
            <div className="rounded-3xl bg-[var(--color-surface-high)] p-6">
              <p className="text-xs font-bold uppercase text-[var(--color-secondary)]">
                Accuracy
              </p>
              <p className="mt-2 text-xl font-bold text-[var(--color-primary)]">
                99.4% benchmark
              </p>
            </div>
            <div className="col-span-2 overflow-hidden rounded-3xl sm:col-span-1">
              <Image
                src="https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&q=80"
                alt="Dog portrait"
                width={400}
                height={280}
                className="h-48 w-full object-cover"
              />
            </div>
          </div>
          <div className="space-y-6">
            <h2 className="text-3xl font-extrabold tracking-tight text-[var(--color-primary)] sm:text-4xl">
              AI-powered precision.{" "}
              <span className="text-[var(--color-secondary-bright)]">
                Human-verified care.
              </span>
            </h2>
            <p className="leading-relaxed text-[var(--color-on-surface-muted)]">
              Our models are trained on clinical patterns and reviewed by
              licensed veterinarians—so you get fast answers without guessing.
            </p>
            <ul className="space-y-3">
              {[
                "Vision-based symptom analysis",
                "Predictive health alerts",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-3 text-[var(--color-on-surface)]"
                >
                  <span
                    className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--color-secondary-bright)_22%,transparent)] text-xs font-bold text-[var(--color-secondary)]"
                    aria-hidden
                  >
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-[var(--color-primary)] sm:text-4xl">
            Trusted by veterinary experts
          </h2>
          <p className="mt-4 text-[var(--color-on-surface-muted)]">
            Real clinicians shape our safety rails—so AI stays helpful, not
            reckless.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {[
            {
              quote:
                "Barc gives pet parents a calm, structured way to decide when to wait and when to escalate—exactly what triage should feel like.",
              name: "Dr. Amara Ellis, DVM",
              role: "Telehealth lead",
            },
            {
              quote:
                "The product respects clinical limits. That transparency is what makes it viable in real practice.",
              name: "Dr. Noah Reeves, DVM",
              role: "Emergency medicine",
            },
          ].map((t) => (
            <div
              key={t.name}
              className="rounded-3xl bg-[var(--color-surface-low)] p-8 text-left shadow-[var(--shadow-float)]"
            >
              <p className="text-lg font-medium leading-relaxed text-[var(--color-primary)]">
                “{t.quote}”
              </p>
              <p className="mt-6 text-sm font-bold text-[var(--color-secondary-bright)]">
                {t.name}
              </p>
              <p className="text-xs uppercase tracking-wide text-[var(--color-on-surface-muted)]">
                {t.role}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <div className="rounded-[2rem] bg-[var(--color-primary-container)] px-8 py-14 text-center text-[var(--color-on-primary)] shadow-[var(--shadow-float)] sm:px-16">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Ready to provide the best care?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[color-mix(in_srgb,white_82%,transparent)]">
            Join thousands of pet owners who trust Barc for daily wellness and
            clinical precision.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/consult"
              className="inline-flex rounded-2xl bg-[var(--color-secondary-bright)] px-8 py-3.5 text-sm font-bold text-[var(--color-on-primary)] transition hover:brightness-110"
            >
              Start consultation
            </Link>
            <Link
              href="/pricing"
              className="inline-flex rounded-2xl border-2 border-[color-mix(in_srgb,white_55%,transparent)] px-8 py-3.5 text-sm font-bold text-white transition hover:bg-[color-mix(in_srgb,white_8%,transparent)]"
            >
              View pricing
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
