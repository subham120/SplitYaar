# Implementation Plan (implementation.md)
## Trip & Roommate Expense Splitter — India Edition

This document breaks the build into sequential phases, each shippable/testable on its own, on top of the existing Astro starter template.

---

## Phase 0 — Project Foundation
**Goal:** Prepare the base template for real development.

- [ ] Install Tailwind CSS into the Astro project (per `AGENTS.md` instruction to use the `tailwind` skill)
- [ ] Wire up design tokens from `design.md` into `tailwind.config` (colors, typography scale, spacing, radius)
- [ ] Set `output: 'server'` in `astro.config.mjs` + add a Node/Vercel/Netlify adapter
- [ ] Remove default boilerplate (`Welcome.astro`, `astro.svg`, `background.svg`) and replace `Layout.astro` with a real base layout (meta tags, IST locale hints, global nav shell)
- [ ] Set up TypeScript strict mode in `tsconfig.json`
- [ ] Establish folder structure:
  ```
  src/
    components/       (UI components: Button, Card, ExpenseForm, BalanceCard, etc.)
    layouts/
    lib/
      store.ts         (data access layer — in-memory v1)
      settlement.ts    (greedy min-cash-flow algorithm)
      split.ts         (split calculation logic)
      format.ts        (₹ / Indian number formatting helpers)
      upi.ts           (UPI deep link + QR generation)
    pages/
      index.astro
      trip/
        new.astro
        join.astro
        [code]/
          index.astro          (dashboard)
          history.astro
          members.astro
          settlement.astro
          expense/
            new.astro
            [id]/edit.astro
      api/
        trips/
          index.ts
          [id].ts
          [id]/members.ts
          [id]/expenses.ts
          [id]/expenses/[expenseId].ts
          [id]/settlement.ts
  ```

---

## Phase 1 — Data Layer & Core Logic
**Goal:** Build and unit-test the "engine" before any UI exists.

- [ ] Implement `Trip`, `Member`, `Expense`, `ExpenseShare` types per `schema.md`
- [ ] Implement in-memory store (`lib/store.ts`) with CRUD functions:
  - `createTrip`, `getTripByCode`, `addMember`, `removeMember`
  - `addExpense`, `updateExpense`, `deleteExpense`, `listExpenses`
- [ ] Implement `lib/split.ts`:
  - `calculateEqualSplit(amountPaise, memberIds)`
  - `calculateCustomSplit(amountPaise, memberSharesPaise)` with validation
  - Rounding-remainder handling (assign leftover paise to payer)
- [ ] Implement `lib/settlement.ts`:
  - `computeNetBalances(trip)` → `MemberBalance[]`
  - `simplifyDebts(balances)` → `SettlementTransaction[]` (greedy algorithm per `trd.md` §5.3)
- [ ] Implement `lib/format.ts`:
  - `formatINR(paise: number): string` using `Intl.NumberFormat('en-IN', ...)`
  - IST date formatting helper
- [ ] Implement `lib/upi.ts`:
  - `buildUpiLink({ payeeVpa, payeeName, amountPaise, note })`
  - QR code generation wrapper (client-side, using a lightweight QR library)
- [ ] Write basic test cases (manual or automated) for:
  - Equal split with non-divisible amounts (e.g. ₹100 ÷ 3)
  - Custom split validation (sum mismatch rejected)
  - Settlement simplification correctness (balances always net to zero, transaction count ≤ n−1)

---

## Phase 2 — API Endpoints
**Goal:** Expose the data layer over HTTP for the frontend to consume.

- [ ] `POST /api/trips` — create trip + first member (creator)
- [ ] `GET /api/trips/[id]` — full trip payload (members, expenses, computed balances)
- [ ] `POST /api/trips/[id]/members` — add member
- [ ] `DELETE /api/trips/[id]/members/[memberId]` — remove member (block if balance ≠ 0)
- [ ] `POST /api/trips/[id]/members/[memberId]/upi` — set UPI ID
- [ ] `POST /api/trips/[id]/expenses` — add expense (validates split)
- [ ] `PUT /api/trips/[id]/expenses/[expenseId]` — edit expense
- [ ] `DELETE /api/trips/[id]/expenses/[expenseId]` — delete expense
- [ ] `GET /api/trips/[id]/settlement` — computed settlement transactions
- [ ] Consistent error response shape across all endpoints (`{ error: string }` + appropriate HTTP status)

---

## Phase 3 — Core UI Screens
**Goal:** Build the screens in `appflow.md`, styled per `design.md`, adapted with India-relevant content.

- [ ] Landing page (`/`) — two CTAs: Create Trip / Join Trip
- [ ] Trip Setup (`/trip/new`) — name, creator name, optional initial members, generates shareable code
- [ ] Join Trip (`/trip/join`, `/trip/[code]`) — name entry for new joiners
- [ ] Trip Dashboard (`/trip/[code]`) — header, balance summary cards, recent expenses, nav to sub-screens
- [ ] Add/Edit Expense form — description, ₹ amount, payer selector, category chips, split-type segmented control (equal all / equal selected / custom), date
- [ ] Expense History (`/trip/[code]/history`) — filterable list
- [ ] Manage Members (`/trip/[code]/members`) — add/remove, UPI ID field per member
- [ ] Settlement View (`/trip/[code]/settlement`) — transaction list, "Pay via UPI" buttons/QR, "settled up" empty state

---

## Phase 4 — India-Specific Polish
**Goal:** Make sure the product feels native to the target use case, not a generic template.

- [ ] Verify all currency displays use Indian digit grouping (₹1,25,000 not ₹125,000) everywhere, including forms and history
- [ ] Confirm category set and iconography match Indian trip/roommate contexts (auto/cab/train/flight under Travel, mess/tiffin language considered for Food category copy, etc.)
- [ ] UPI deep link tested against at least GPay and PhonePe URI handling conventions
- [ ] QR fallback tested for desktop users without a phone-linked flow
- [ ] All dates/timestamps rendered in IST, not UTC or browser-local time zone assumptions

---

## Phase 5 — Mobile Performance & Accessibility Pass
- [ ] Test at 375px and 320px viewport widths
- [ ] Confirm touch targets ≥ 44×44px throughout (per `design.md` responsive rules)
- [ ] Run Lighthouse mobile audit — target performance score > 90
- [ ] Confirm forms have proper `<label>` elements and sufficient color contrast (WCAG AA)
- [ ] Test on throttled/slow 3G network profile — ensure add-expense flow remains usable

---

## Phase 6 — QA & Edge Case Hardening
- [ ] Rounding-remainder correctness across many split combinations
- [ ] Removing a member with a non-zero balance is correctly blocked
- [ ] Deleting/editing an expense correctly recalculates all downstream balances and settlement
- [ ] Duplicate trip codes cannot be generated (collision check)
- [ ] Empty states render correctly (no expenses yet, all settled up, no members besides creator)
- [ ] Trip data survives a full page refresh (fetched from backend, not just client memory)

---

## Phase 7 — Deployment
- [ ] Choose hosting target (Vercel/Netlify with Astro adapter, or Node self-host)
- [ ] Configure environment for production (persistence layer: file-based JSON snapshot minimum, SQLite/Postgres recommended before real multi-user usage)
- [ ] Smoke test the full flow end-to-end in production environment with a real multi-device test (2+ phones joining the same trip link)

---

## Suggested Build Order Priority (if time-constrained)
1. Phase 1 (core logic) — this is the product's brain; get it right first
2. Phase 2 (API)
3. Phase 3, focusing on: Add Expense → Dashboard → Settlement View (the critical path)
4. Phase 4 (India polish) — can be woven into Phase 3 rather than done strictly after
5. Phases 5–7 as final hardening before sharing with a real friend group
