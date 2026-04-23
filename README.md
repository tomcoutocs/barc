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

## Deploy on Vercel

1. Push this repo to GitHub, GitLab, or Bitbucket.

2. In [Vercel](https://vercel.com), **Add New Project** → import the repo.  
   If your Git root is a parent folder that contains both this app and other code, set **Root Directory** to the folder that has `package.json` (this Next.js app).

3. **Environment variables** (Production, and Preview if you test auth there): copy from `.env.example`:

   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Optional: `OPENAI_API_KEY` (fallback when `VET_RAG_API_URL` is unset)
   - Optional: `VET_RAG_API_URL`, `VET_RAG_API_SECRET` (host the FastAPI app in `vet-rag-api/` on Railway, Fly.io, Render, etc., then paste its HTTPS origin with no trailing slash)

4. **Supabase auth**: Dashboard → Authentication → URL configuration:

   - **Site URL**: `https://<your-production-domain>`
   - **Redirect URLs**: `https://<your-production-domain>/auth/callback`  
   Add the same pattern for preview URLs (e.g. `https://*.vercel.app/auth/callback`) if you log in on preview builds.

5. Deploy. `npm run build` runs on Vercel automatically.

**Note:** `/api/chat` is configured with `maxDuration = 120` for long RAG calls. Vercel **Hobby** plans enforce shorter serverless timeouts; use **Pro** (or shorten the vet-rag client timeout) if consults time out in production.

## Product backlog

See [backlog.md](./backlog.md).

## Design

See [DESIGN.md](./DESIGN.md).
