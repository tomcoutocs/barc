# Barc

Dog-focused telehealth web app: Next.js, Tailwind, Supabase Auth & Postgres.

## Setup

1. **Environment**

   Copy `.env.example` to `.env.local` and add your Supabase project values (Project Settings → API):

   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

2. **Database**

   Apply migrations in the Supabase SQL editor or via the Supabase CLI / MCP (`plugin-supabase-supabase` → `apply_migration`). The initial schema lives at `supabase/migrations/20260114000000_initial.sql`.

   In the Supabase dashboard, add redirect URLs for auth:

   - `http://localhost:3000/auth/callback`
   - Your production URL + `/auth/callback`

3. **Run**

   ```bash
   npm install
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Product backlog

See [backlog.md](./backlog.md).

## Design

See [DESIGN.md](./DESIGN.md).
