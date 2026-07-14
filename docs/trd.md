# Technical Requirements Document (TRD)
## Trip & Roommate Expense Splitter — India Edition

---

## 1. Purpose
Translate the PRD into concrete technical decisions: stack, architecture, APIs, algorithms, and non-functional requirements needed to build the product on top of the existing Astro template.

---

## 2. Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | **Astro v7** (already scaffolded) | SSR mode for dynamic trip pages + API endpoints |
| Styling | **Tailwind CSS** | Per `AGENTS.md` instruction; tokens driven by `design.md` |
| Language | **TypeScript** | Type safety for split calculations and settlement logic |
| Data store (v1) | **In-memory store** (server-side, per the existing Roommate Expense Splitter precedent) OR lightweight persistent DB | See §4 for recommendation |
| Data store (v2 recommended) | **SQLite (via better-sqlite3 or Turso/libSQL)** or **Postgres (via Supabase/Neon)** | For durability across restarts/deploys |
| Client interactivity | Astro islands (vanilla TS or a lightweight framework: Preact/Svelte if needed) | Keep bundle size minimal — mobile-first |
| Hosting | Vercel / Netlify / Node adapter self-host | Astro SSR adapter required |
| UPI integration | `upi://pay` URI scheme (no SDK/payment gateway needed) | Client-side deep link + QR code generation (e.g. `qrcode` npm package) |

**Recommendation:** Start with an **in-memory store with periodic snapshot persistence to a JSON file / SQLite**, matching the pattern already used in the earlier Roommate Expense Splitter project (per prior context), then upgrade to a real DB (SQLite/Postgres) once multi-device/multi-session persistence is required. This keeps v1 fast to build without provisioning cloud infra.

---

## 3. Architecture Overview

```
┌─────────────────────────────┐
│         Astro Frontend       │
│  (Pages, Layouts, Islands)   │
└───────────────┬──────────────┘
                │  fetch (SSR API routes)
┌───────────────▼──────────────┐
│      Astro API Endpoints      │
│  /api/trips                   │
│  /api/trips/[id]/members       │
│  /api/trips/[id]/expenses      │
│  /api/trips/[id]/settlement     │
└───────────────┬──────────────┘
                │
┌───────────────▼──────────────┐
│        Data Store Layer       │
│  In-memory store (v1)         │
│  or SQLite/Postgres (v2)      │
└───────────────────────────────┘
```

- **Rendering mode:** Astro SSR (`output: 'server'`) since data is dynamic per trip and shared across users.
- **API routes:** Implemented as Astro server endpoints (`src/pages/api/**/*.ts`) returning JSON.
- **Client interactivity:** Forms for adding expenses/members use progressive enhancement — work with plain form POST, enhanced with client-side JS for instant UI updates (optimistic UI) where useful.

---

## 4. Data Persistence Strategy

**v1 (MVP):**
- Server-side in-memory JS object/Map, keyed by trip ID (UUID or short shareable code, e.g. 6-character alphanumeric).
- Snapshot written to a local JSON file on each mutation (simple durability against server restarts in dev/small deployments).

**v2 (Production-grade):**
- Migrate to SQLite (file-based, zero-config, good fit for small-to-medium usage) or a hosted Postgres (Supabase/Neon) if multi-instance deployment is needed.
- See `schema.md` for the full data model, written to be directly portable to either in-memory objects or SQL tables.

---

## 5. Core Algorithms

### 5.1 Split Calculation
For each expense:
- **Equal split (all members):** `share = amount / totalMembers` (rounded to 2 decimals; remainder paisa assigned to payer to avoid rounding drift)
- **Equal split (selected members):** `share = amount / selectedMembers.length`
- **Custom split:** explicit `{ memberId: amount }` map provided by the client; validated so `sum(shares) === amount` (± ₹0.01 rounding tolerance)

Each expense produces a set of **balance deltas**:
- Payer: `+amount` (they paid this much)
- Each participant: `-share` (this is their fair share owed)

### 5.2 Net Balance Computation
For each member:
```
netBalance = sum(amounts they paid) − sum(their fair shares across all expenses)
```
- Positive → they are owed money
- Negative → they owe money

### 5.3 Settlement Simplification (Greedy Min-Cash-Flow)
Goal: minimize the number of payment transactions needed to zero out all balances.

**Algorithm:**
1. Compute net balance for every member.
2. Split members into **creditors** (net > 0) and **debtors** (net < 0).
3. Repeatedly:
   - Pick the debtor with the largest absolute debt and the creditor with the largest credit.
   - Settle `min(|debt|, credit)` between them → record as one transaction.
   - Reduce both balances by that amount; remove any member whose balance reaches ₹0.
4. Repeat until all balances are ₹0 (within rounding tolerance).

This is the same greedy approach used in the earlier Roommate Expense Splitter project and guarantees at most `n − 1` transactions for `n` members with non-zero balance.

**Complexity:** O(n log n) per settlement computation (due to sorting debtors/creditors each iteration, or O(n²) with a simple linear scan — acceptable given expected group sizes of ≤ 20).

---

## 6. API Endpoints (Draft)

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/trips` | Create a new trip → returns trip ID + shareable code |
| GET | `/api/trips/[id]` | Fetch trip details, members, expenses, balances |
| POST | `/api/trips/[id]/members` | Add a member to a trip |
| POST | `/api/trips/[id]/expenses` | Add a new expense |
| PUT | `/api/trips/[id]/expenses/[expenseId]` | Edit an expense |
| DELETE | `/api/trips/[id]/expenses/[expenseId]` | Delete an expense |
| GET | `/api/trips/[id]/settlement` | Compute and return simplified settlement transactions |
| POST | `/api/trips/[id]/members/[memberId]/upi` | Save/update a member's UPI ID for payment links |

All responses: JSON. All amounts: stored as integers in **paise** internally (to avoid floating-point rounding errors) and converted to ₹ for display.

---

## 7. UPI Deep Link Generation

Format (per NPCI UPI URI spec):
```
upi://pay?pa=<payee_vpa>&pn=<payee_name>&am=<amount>&cu=INR&tn=<note>
```
- `pa`: payee's UPI ID (e.g. `rahul@okhdfcbank`)
- `am`: amount in ₹ (decimal, not paise)
- `cu`: currency, fixed as `INR`
- `tn`: transaction note (e.g. trip name)

Generate this as a tappable link on mobile (opens the user's UPI app directly) and as a QR code (via a client-side QR library) for desktop users to scan with their phone.

---

## 8. Non-Functional Requirements

- **Performance:** Settlement computation for 20 members / 200 expenses must complete client-perceived instantly (< 200ms server-side).
- **Mobile-first:** All UI must be fully usable at 375px viewport width; touch targets ≥ 44×44px per `design.md`.
- **Currency formatting:** Use `Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })` for all displayed amounts.
- **Timezone:** All dates default to `Asia/Kolkata` (IST).
- **No PII beyond first name + optional UPI ID.** No passwords stored in v1 (no auth system).
- **Accessibility:** Forms must have proper labels; color contrast per WCAG AA minimum.
- **Resilience:** Trip data must survive a page refresh (fetched fresh from backend, not just client state).

---

## 9. Security & Privacy Considerations
- No real payment processing occurs in-app — UPI links only *open* the user's own payment app; the app never touches money or bank credentials.
- Trip access is via unguessable share code/URL (not indexable, not brute-forceable in reasonable time — use sufficiently long random codes, e.g. 8+ alphanumeric characters).
- No sensitive financial data (bank numbers, card numbers) is ever collected — only a UPI VPA (which is a public-facing payment handle, not a secret).

---

## 10. Open Technical Questions
- Do we need real user accounts for cross-trip history in the future, or does "one link per trip" suffice indefinitely?
- Should settlement snapshots be immutable once a trip is marked "closed," to prevent late edits from silently changing already-settled amounts?
- Should we support offline-first (service worker + local queue) given patchy trip connectivity? (Flagged as a possible v2 enhancement, not required for v1.)
