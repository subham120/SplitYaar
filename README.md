# SplitYaar 🪙

**Mobile-first trip & roommate expense splitter for Indian friend groups.**
UPI-powered settlements, ₹/INR-native, no login required.

---

## Features

- Create a trip with a shareable 8-character code
- Friends join by entering the code (no accounts needed)
- Add expenses with equal or custom splits
- Live balance cards per member
- Greedy min-cash-flow settlement with UPI deep links & QR codes
- Indian Rupee formatting (`₹1,25,000`) and IST dates throughout

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Astro v7 (SSR) |
| Styling | Tailwind CSS v3 |
| Language | TypeScript |
| Database | Neon Postgres (serverless) |
| Hosting | Vercel |
| UPI | `upi://pay` URI scheme + `qrcode` npm package |

---

## Local Development

### 1. Prerequisites

- Node.js ≥ 22
- A [Neon](https://neon.tech) free-tier database (or any Postgres instance)

### 2. Clone & Install

```sh
git clone https://github.com/your-username/SplitYaar.git
cd SplitYaar
npm install --legacy-peer-deps
```

### 3. Configure Environment

```sh
cp .env.example .env
```

Edit `.env` and set your Neon connection string:

```env
DATABASE_URL=postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
```

> Get the connection string from your [Neon Dashboard](https://console.neon.tech) → **Connection Details** → **Connection string** (use the **pooled** connection string for production).

### 4. Run the Database Migration

```sh
# Using psql (if installed):
psql $DATABASE_URL -f scripts/migrate.sql

# Or paste the contents of scripts/migrate.sql into the Neon SQL editor.
```

### 5. Start Dev Server

```sh
npm run dev
```

Visit `http://localhost:4321`.

---

## Deployment (Vercel)

### 1. Push to GitHub

Ensure `db.json` and `.env` are in `.gitignore` (they already are).

### 2. Import Project on Vercel

- Go to [vercel.com](https://vercel.com) → **Add New → Project**
- Import your GitHub repository
- Vercel auto-detects the Astro adapter — no framework override needed

### 3. Set Environment Variables

In your Vercel project → **Settings → Environment Variables**, add:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Your Neon pooled connection string |

> ⚠️ Use the **pooled** (PgBouncer) connection string from Neon for Vercel serverless — it starts with `postgresql://` and contains `.pooler.` in the host.

### 4. Deploy

Push to `main` — Vercel auto-deploys. First deploy also runs `astro build` which type-checks everything.

### 5. Run Migration Against Production DB

If you haven't already, run `scripts/migrate.sql` against your production Neon database once.

---

## Project Structure

```
src/
  components/       UI components (SubNav, forms, cards)
  layouts/          Layout.astro base layout
  lib/
    store.ts        Neon Postgres data access layer
    settlement.ts   Greedy min-cash-flow algorithm
    split.ts        Equal/custom split calculations
    format.ts       ₹ Indian number formatting
    upi.ts          UPI deep links + QR code generation
    types.ts        TypeScript interfaces
  pages/
    index.astro     Landing page
    trip/
      new.astro     Create trip
      join.astro    Join trip by code
      [code]/
        index.astro     Dashboard
        history.astro   Expense history
        members.astro   Manage members
        settlement.astro Settlement view
        expense/
          new.astro
          [expenseId]/edit.astro
    api/            Server endpoints (JSON)
scripts/
  migrate.sql       Postgres DDL — run once on your DB
```

---

## Commands

| Command | Action |
|---|---|
| `npm run dev` | Start local dev server at `localhost:4321` |
| `npm run build` | Production build to `./dist/` |
| `npm run preview` | Preview production build locally |

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ Yes | Neon Postgres connection string (pooled recommended) |

---

## Docs

Full design and technical decisions are in [`docs/`](./docs/):

- [`prd.md`](./docs/prd.md) — Product requirements
- [`trd.md`](./docs/trd.md) — Technical requirements & algorithms
- [`schema.md`](./docs/schema.md) — Data model + SQL DDL
- [`design.md`](./docs/design.md) — Visual design system
- [`appflow.md`](./docs/appflow.md) — Screen flows
- [`implementation.md`](./docs/implementation.md) — Phase-by-phase build plan
- [`tracker.md`](./docs/tracker.md) — Live progress tracker

---

## License

MIT
