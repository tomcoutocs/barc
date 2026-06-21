import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="page-mesh flex flex-1 flex-col">
      <section className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-24">
        <div className="animate-fade-up space-y-8">
          <Badge variant="default">Trusted by 100K+ pet parents</Badge>
          <h1 className="max-w-xl text-4xl font-extrabold leading-[1.08] tracking-tight text-primary sm:text-5xl lg:text-[3.25rem]">
            Professional vet advice,{" "}
            <span className="bg-gradient-to-r from-secondary to-secondary-bright bg-clip-text text-transparent">
              now in your pocket.
            </span>
          </h1>
          <p className="max-w-lg text-lg leading-relaxed text-on-surface-muted">
            AI-driven symptom checks and live consultations with certified
            veterinarians—built for dogs, cats, and the people who love them.
          </p>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/consult" size="lg">
              Start consultation
            </ButtonLink>
            <ButtonLink href="/pricing" variant="outline" size="lg">
              How it works
            </ButtonLink>
          </div>
        </div>
        <div className="relative animate-fade-up [animation-delay:120ms]">
          <div className="overflow-hidden rounded-[2rem] bg-surface-low shadow-elevated ring-1 ring-primary/[0.04]">
            <Image
              src="https://images.unsplash.com/photo-1552053831-71594a27632d?w=800&q=80"
              alt="Happy dog outdoors"
              width={640}
              height={640}
              className="aspect-square h-auto w-full object-cover"
              priority
            />
          </div>
          <Card className="absolute -bottom-4 left-4 max-w-xs sm:-bottom-6 sm:left-8">
            <p className="text-xs font-bold uppercase tracking-wide text-secondary">
              Vet on demand
            </p>
            <p className="mt-1 text-sm leading-relaxed text-on-surface">
              “Barc saved us an emergency trip at 2 AM. Truly a lifesaver.”
            </p>
          </Card>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-primary sm:text-4xl">
              Care at the speed of light
            </h2>
            <p className="mt-4 text-on-surface-muted">
              From first question to a clear plan—without the waiting room.
            </p>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {[
              {
                title: "Consult",
                body: "AI triage or direct chat with a vet when it matters.",
                accent: "from-secondary-bright/15 to-surface",
              },
              {
                title: "Diagnose",
                body: "Clinical-grade assessments from history and visuals.",
                accent: "from-primary-container/10 to-surface",
              },
              {
                title: "Resolve",
                body: "Plans, referrals, and follow-ups you can act on.",
                accent: "from-tertiary/20 to-surface",
              },
            ].map((card) => (
              <Card
                key={card.title}
                className={`bg-gradient-to-br ${card.accent} p-8 transition hover:-translate-y-0.5 hover:shadow-elevated`}
              >
                <h3 className="text-xl font-bold text-primary">{card.title}</h3>
                <p className="mt-3 leading-relaxed text-on-surface-muted">
                  {card.body}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div className="grid grid-cols-2 gap-4 sm:gap-6">
            <Card className="bg-primary-container p-8 text-on-primary">
              <p className="text-sm font-bold opacity-90">24/7</p>
              <p className="mt-2 text-lg font-extrabold">Instant support</p>
            </Card>
            <Card className="row-span-2 bg-secondary-bright p-6 text-on-primary shadow-glow">
              <p className="text-sm font-bold uppercase tracking-wide">AI precision</p>
              <p className="mt-4 text-2xl font-extrabold leading-tight">
                Human-verified care
              </p>
            </Card>
            <Card className="p-6">
              <p className="text-xs font-bold uppercase text-secondary">Accuracy</p>
              <p className="mt-2 text-xl font-bold text-primary">99.4% benchmark</p>
            </Card>
            <div className="col-span-2 overflow-hidden rounded-3xl shadow-soft ring-1 ring-primary/[0.04] sm:col-span-1">
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
            <h2 className="text-3xl font-extrabold tracking-tight text-primary sm:text-4xl">
              AI-powered precision.{" "}
              <span className="text-secondary-bright">Human-verified care.</span>
            </h2>
            <p className="leading-relaxed text-on-surface-muted">
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
                  className="flex items-center gap-3 text-on-surface"
                >
                  <span
                    className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary-bright/20 text-xs font-bold text-secondary"
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
          <h2 className="text-3xl font-extrabold tracking-tight text-primary sm:text-4xl">
            Trusted by veterinary experts
          </h2>
          <p className="mt-4 text-on-surface-muted">
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
            <Card key={t.name} className="p-8 text-left">
              <p className="text-lg font-medium leading-relaxed text-primary">
                “{t.quote}”
              </p>
              <p className="mt-6 text-sm font-bold text-secondary-bright">
                {t.name}
              </p>
              <p className="text-xs uppercase tracking-wide text-on-surface-muted">
                {t.role}
              </p>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <div className="overflow-hidden rounded-[2rem] bg-primary-container px-8 py-14 text-center text-on-primary shadow-elevated sm:px-16">
          <div className="pointer-events-none absolute inset-0 opacity-30" aria-hidden />
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Ready to provide the best care?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-white/80">
            Join thousands of pet owners who trust Barc for daily wellness and
            clinical precision.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/consult" variant="accent" size="lg">
              Start consultation
            </ButtonLink>
            <ButtonLink
              href="/pricing"
              variant="outline"
              size="lg"
              className="border-white/40 bg-white/5 text-white hover:bg-white/10 hover:ring-white/30"
            >
              View pricing
            </ButtonLink>
          </div>
        </div>
      </section>
    </div>
  );
}
