# Pulse Pharma

Your trusted e-health platform and retail pharmacy — based in Accra, Ghana.

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in the two Supabase values — find them in your project's dashboard under
**Settings → API**:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your project URL (e.g. `https://xxxxx.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | The public / anon key |

### 3. Set up the database (first time only)

The app depends on a `profiles` table, a signup trigger, and RLS policies.
These are tracked as versioned migrations in [`supabase/migrations/`](supabase/migrations/).

You have two options:

#### Option A — Supabase CLI (recommended)

The CLI pushes migrations from this repo directly to your remote database, so
schema changes are always tracked in Git alongside the code that uses them.

```bash
# Install the Supabase CLI (one-time)
npm install -g supabase

# Link this repo to your remote Supabase project
supabase link --project-ref bjqkpiffgwxqtgyidqwv

# Push every migration in supabase/migrations/ to the remote database
supabase db push
```

#### Option B — Supabase Dashboard (manual)

If you prefer not to install the CLI, run the migration SQL directly in the
dashboard:

1. Go to **Supabase Dashboard → SQL Editor → New query**.
2. Paste the full contents of [`supabase/migrations/20260729_profiles_and_rls.sql`](supabase/migrations/20260729_profiles_and_rls.sql).
3. Click **Run**.

> ⚠️ This script is **idempotent** — safe to re-run. It drops all existing
> policies on `profiles` before recreating them, which prevents stale
> Dashboard-added policies from causing recursive RLS errors.

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Database Migrations

All schema changes live in [`supabase/migrations/`](supabase/migrations/) as
timestamped SQL files. The current migration creates:

- **`public.profiles`** — 1:1 profile row per auth user (`customer` / `admin` role).
- **`handle_new_user()`** — trigger that auto-creates a profile on signup.
- **RLS policies** — users can read/update only their own row; customers cannot
  self-promote to `admin`.

### Creating a new migration

```bash
supabase migration new describe_your_change
# edit the generated .sql file…
supabase db push
```

This keeps every schema change versioned in Git. Avoid editing policies or
triggers directly in the Supabase Dashboard — untracked changes diverge from the
repo and can cause hard-to-debug issues (e.g. recursive RLS policies breaking
signups).

---

## Project Structure

```
src/
├── app/                # Next.js App Router pages
│   ├── auth/           # Sign in / sign up / forgot / reset password
│   └── …
├── components/        # React components (AuthContext, Navbar, etc.)
├── lib/                # Utilities, Supabase client, validation
├── services/           # Data-access layer (profiles, medicines, orders)
└── db/                 # Drizzle ORM schema (unused — data lives in Supabase)

supabase/
├── config.toml         # Supabase CLI configuration
└── migrations/          # Versioned SQL migrations
    └── 20260729_profiles_and_rls.sql
```

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | TypeScript type-check |

---

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS 4, Framer Motion
- **Auth / DB:** Supabase (cookie-based sessions, RLS)
- **Language:** TypeScript
