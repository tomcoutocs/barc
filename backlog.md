# Barc — Product Backlog

Full backlog for the Barc dog telehealth webapp: mockups, `DESIGN.md`, Supabase auth/DB, and MCP workflow.

**Legend:** `[x]` done · `[ ]` not done · `[~]` partial / follow-up noted inline

### Status (current)

- **Scaffold:** Next.js (App Router) + TypeScript + Tailwind v4; Manrope + `DESIGN.md` tokens in `globals.css`.
- **Supabase:** Browser/server clients, middleware session refresh, protected routes (`/dashboard`, `/consult`, `/settings`), `/auth/callback`, POST `/auth/signout`. Migrations: `supabase/migrations/20260114000000_initial.sql`, `20260114100000_seed_veterinarians.sql` (apply in Supabase or MCP `apply_migration`).
- **UI routes:** `/` (landing), `/login`, `/signup`, `/forgot-password`, `/dashboard`, `/consult`, `/vet-directory`, `/pricing`, `/settings` (+ pet add/edit), plus footer stubs (`/privacy`, `/terms`, `/help`, `/contact`).
- **Data-backed:** Dashboard pets, subscription row, and activity log from Postgres; vet directory reads `veterinarians` (fallback UI if empty). Consult chat persists to `chat_threads` / `chat_messages`; `POST /api/chat` calls OpenAI when `OPENAI_API_KEY` is set, else demo text.
- **Next (product):** Stripe (Epic 11); optional Supabase Storage for avatars/pet photos; wire dashboard Export/Filter; optional `supabase gen types` in CI; production legal copy review.

**Design note:** `DESIGN.md` is the implementation contract (Manrope, tonal layering, no hard 1px section borders). Mockups supply layout, copy, and hierarchy.

---

## Epic 0 — Project foundation

| ID | Story | Acceptance criteria | Done |
|----|--------|---------------------|:----:|
| 0.1 | **Choose stack** | Next.js App Router + TypeScript + Tailwind; SSR-friendly for Supabase cookies | [x] |
| 0.2 | **Repo scaffold** | `package.json`, lint/format, env example, `.env.local` gitignored, README with local dev steps | [x] |
| 0.3 | **Routing map** | Public: `/`, `/login`, `/signup`, `/pricing`; authenticated: `/dashboard`, `/consult`, `/vet-directory`; optional `/settings` | [x] |
| 0.4 | **Global layout shell** | Root layout, Manrope, metadata, favicon | [x] |

---

## Epic 1 — Design system & shared UI

| ID | Story | Acceptance criteria | Done |
|----|--------|---------------------|:----:|
| 1.1 | **Tokens** | CSS variables / Tailwind: Midnight Forest, Terracotta, Sand/Sage surfaces | [x] |
| 1.2 | **Typography scale** | Display / headline / title / body / label per DESIGN.md | [~] |
| 1.3 | **Components** | Primary, Action/CTA, Ghost buttons; inputs; cards via tonal layers | [~] |
| 1.4 | **Motion** | Weighted ease-out where appropriate | [~] |
| 1.5 | **Responsive grid** | Nav and card grids collapse 3 → 1 on small viewports | [x] |
| 1.6 | **Assets** | Images from `assets/` or Supabase Storage later | [~] |

*Notes: 1.2–1.4 use page-level patterns; formal tokenized type scale / motion audit can be tightened against `DESIGN.md`. 1.6 uses remote images; Storage deferred (see 4.8).*

---

## Epic 2 — Supabase: project, client, MCP workflow

| ID | Story | Acceptance criteria | Done |
|----|--------|---------------------|:----:|
| 2.1 | **Supabase project** | URL + anon key in env; redirect URLs for local + prod | [x] |
| 2.2 | **App client** | `@supabase/supabase-js` + `@supabase/ssr` (browser + server + middleware) | [x] |
| 2.3 | **MCP: authenticate** | Call `mcp_auth` on `user-supabase` when using that server; use `plugin-supabase-supabase` for migrations, SQL, types | [ ] |
| 2.4 | **Migrations as code** | Versioned SQL migrations | [x] |
| 2.5 | **Generated types** | Regenerate DB types when schema changes | [~] |

*Notes: 2.3 is developer workflow (manual when using MCP). 2.5: hand-maintained `src/types/database.ts`; run `npx supabase gen types …` when you add a typed client to generated output.*

---

## Epic 3 — Authentication & session UX

| ID | Story | Acceptance criteria | Done |
|----|--------|---------------------|:----:|
| 3.1 | **Email/password** | Sign up, sign in, sign out; styled errors | [x] |
| 3.2 | **Password recovery** | Forgot password flow | [x] |
| 3.3 | **Protected routes** | Middleware guards for app areas | [x] |
| 3.4 | **Session refresh** | Stable session on refresh | [x] |
| 3.5 | **Profile baseline** | `profiles` linked to `auth.users` for navbar and welcome copy | [x] |

*Forgot password: `/forgot-password` + `resetPasswordForEmail` → `/auth/callback?next=/settings`; change password when signed in under `/settings`.*

---

## Epic 4 — Data model (subscriptions-ready)

| ID | Story | Acceptance criteria | Done |
|----|--------|---------------------|:----:|
| 4.1 | **`profiles`** | `id` → `auth.users`, `display_name`, `avatar_url`, timestamps | [x] |
| 4.2 | **`pets`** | `user_id`, name, breed, age, weight, activity, photo URL | [x] |
| 4.3 | **`subscriptions` (prep)** | `plan`, `status`, `current_period_end`, nullable Stripe IDs | [x] |
| 4.4 | **`activity_log`** | Typed rows: AI, video, records; pet ref, status, `occurred_at` | [x] |
| 4.5 | **`veterinarians`** | Directory fields + `is_active`, sort | [x] |
| 4.6 | **`chat_threads` / `chat_messages`** | Optional persistence; RLS | [x] |
| 4.7 | **RLS policies** | User-scoped data; public read for active vets | [x] |
| 4.8 | **Storage** | Optional `avatars`, `pet-photos` buckets | [ ] |

---

## Epic 5 — Global chrome

| ID | Story | Acceptance criteria | Done |
|----|--------|---------------------|:----:|
| 5.1 | **Navbar** | Logo, nav links with active state, CTAs / icons | [x] |
| 5.2 | **Footer** | Legal links, copyright; extended variant where needed | [x] |
| 5.3 | **404 / errors** | On-brand minimal pages | [x] |

*404: `not-found.tsx`. Errors: `error.tsx`.*

---

## Epic 6 — Marketing landing (`/`)

| ID | Story | Acceptance criteria | Done |
|----|--------|---------------------|:----:|
| 6.1 | **Hero** | Trust pill, headline, CTAs | [x] |
| 6.2 | **Features** | Three feature cards | [x] |
| 6.3 | **AI highlight** | Collage + bullets | [x] |
| 6.4 | **Vet testimonials** | Two cards | [x] |
| 6.5 | **Bottom CTA** | Dark band + pricing link | [x] |
| 6.6 | **SEO** | Title, description, OG | [x] |

*OG/twitter metadata on root layout.*

---

## Epic 7 — Dashboard (`/dashboard`)

| ID | Story | Acceptance criteria | Done |
|----|--------|---------------------|:----:|
| 7.1 | **Hero** | Welcome, consultation + pet actions | [x] |
| 7.2 | **My Dogs** | Pet cards from `pets` | [x] |
| 7.3 | **Subscription card** | Plan + renewal + price from `subscriptions` or defaults | [x] |
| 7.4 | **Daily tip** | Static or config v1 | [x] |
| 7.5 | **Recent activity** | From `activity_log`; export/filter UI | [~] |

*7.5: list from DB; Export PDF / Filter are present as UI affordances (not wired).*

---

## Epic 8 — AI Consultant (`/consult`)

| ID | Story | Acceptance criteria | Done |
|----|--------|---------------------|:----:|
| 8.1 | **Sidebar** | Pets, add pet, apothecary note | [x] |
| 8.2 | **Chat shell** | Header, thread, quick actions | [x] |
| 8.3 | **Composer** | Send, attachment affordance | [~] |
| 8.4 | **Persistence** | Supabase messages | [x] |
| 8.5 | **AI backend** | Server-side API route; secrets server-only | [x] |
| 8.6 | **Compliance strip** | Disclaimer copy | [x] |

*8.3: attachment is visual affordance only. AI: `POST /api/chat`, optional `OPENAI_API_KEY`.*

---

## Epic 9 — Vet Directory (`/vet-directory`)

| ID | Story | Acceptance criteria | Done |
|----|--------|---------------------|:----:|
| 9.1 | **Hero** | Badges + trust row | [x] |
| 9.2 | **Vet grid** | `VetCard` from DB | [x] |
| 9.3 | **Recruitment CTA** | Apply card | [x] |
| 9.4 | **Seed data** | Demo vets | [x] |

*Seed: `20260114100000_seed_veterinarians.sql`. App still falls back to static cards if the query returns no rows.*

---

## Epic 10 — Pricing (`/pricing`)

| ID | Story | Acceptance criteria | Done |
|----|--------|---------------------|:----:|
| 10.1 | **Hero** | Pill + headline | [x] |
| 10.2 | **Three tiers** | Basic / Plus / Premium | [x] |
| 10.3 | **Why Barc Plus** | Split + image + testimonial | [x] |
| 10.4 | **FAQ** | 2×2 grid | [x] |
| 10.5 | **Plan CTAs** | Stub until Stripe (Epic 11) | [x] |

---

## Epic 11 — Subscriptions (Phase 2)

| ID | Story | Acceptance criteria | Done |
|----|--------|---------------------|:----:|
| 11.1 | **Stripe** | Products/prices; webhooks → `subscriptions` | [ ] |
| 11.2 | **Customer portal** | Payment method / cancel | [ ] |
| 11.3 | **Entitlements** | Plan limits enforced server-side | [ ] |
| 11.4 | **Book a Vet** | Gated by tier/credits | [ ] |

---

## Epic 12 — Settings & user management

| ID | Story | Acceptance criteria | Done |
|----|--------|---------------------|:----:|
| 12.1 | **Account** | Email/password; delete account | [~] |
| 12.2 | **Pet CRUD** | Add/edit pets | [x] |
| 12.3 | **Notifications/settings** | Real pages or disabled v1 | [x] |

*12.1: email shown; password update + forgot flow; delete = support/help process copy (no self-serve admin delete yet).*

---

## Epic 13 — Quality & legal

| ID | Story | Acceptance criteria | Done |
|----|--------|---------------------|:----:|
| 13.1 | **Accessibility** | Focus, contrast, keyboard | [~] |
| 13.2 | **Privacy & Terms** | Static pages | [x] |
| 13.3 | **Analytics** | Optional | [ ] |
| 13.4 | **Compliance copy** | Align legal review if handling sensitive data | [~] |

*13.2: `/privacy`, `/terms` exist with placeholder copy. 13.4: consult disclaimer on page; full legal review before production.*

---

## Delivery phases

1. **Foundation:** Epics 0–2, 3, 4 (core tables + RLS), 5.  
2. **Public:** Epic 6 + 10 (static pricing).  
3. **Core app:** Epic 7 + 12.  
4. **Differentiators:** Epic 8, 9.  
5. **Monetization:** Epic 11.

---

## MCP reminder

- **`user-supabase`:** `mcp_auth` when prompted.
- **`plugin-supabase-supabase`:** migrations, `execute_sql`, types, advisors, docs.
