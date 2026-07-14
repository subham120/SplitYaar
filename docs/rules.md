# Project Rules (rules.md)
## Trip & Roommate Expense Splitter — India Edition

Conventions and guardrails for anyone (human or AI agent) working on this codebase. Complements `AGENTS.md`/`CLAUDE.md` at the repo root, and should be treated as authoritative alongside `design.md`.

---

## 1. General Principles
- **Follow the docs, don't improvise architecture.** `prd.md`, `trd.md`, `appflow.md`, `schema.md`, and `implementation.md` are the source of truth. If a decision isn't covered, flag it as an open question rather than silently deviating.
- **Mobile-first, always.** Every screen must be designed and tested at 375px width before desktop. This is the primary usage context (friends on a trip, on their phones).
- **No feature creep beyond v1 scope.** Anything in `prd.md` §7 (Future Enhancements) must not be built into v1 without an explicit decision to pull it forward.
- **India-first defaults, not internationalization.** Do not add multi-currency, multi-locale, or non-IST timezone logic — v1 is INR/IST only, hardcoded, not a configurable setting.

---

## 2. Code Conventions

### Language & Style
- TypeScript strict mode everywhere — no `any` unless justified with a comment.
- Prefer explicit types over inferred `unknown`/`any` for all API request/response shapes.
- Use the entity names exactly as defined in `schema.md` (`Trip`, `Member`, `Expense`, `ExpenseShare`) — don't introduce renamed synonyms.

### Money Handling
- **All monetary values are stored and passed internally as integers in paise.** Never store or compute with floating-point rupees — floating point arithmetic on currency is a correctness bug, not a style preference.
- Conversion to ₹ for display happens **only** at the final render step, via the shared `formatINR()` helper (`lib/format.ts`). Never hand-roll currency formatting inline in a component.
- Any rounding remainder from a split must be deterministically assigned to the payer (per `trd.md` §5.1) — never silently dropped or left unassigned.

### Dates & Time
- All dates/times are IST (`Asia/Kolkata`) by default. Use the shared date helper, not raw `Date` formatting scattered across components.

### File/Folder Structure
- Follow the structure defined in `implementation.md` Phase 0 — business logic lives in `src/lib/`, never inline inside `.astro` page files.
- API route handlers stay thin — validate input, call into `lib/`, return response. No business logic duplicated inside route handlers.

---

## 3. Design & UI Rules
- All visual decisions must reference `design.md` tokens (`{colors.primary}`, `{typography.body}`, etc.) — no inline hex codes or arbitrary font sizes.
- Reuse the existing Apple-inspired component grammar (pill buttons for primary actions, utility cards with `{rounded.lg}`, single accent color) rather than introducing new visual patterns, **except** where explicitly adapted for India-specific content (e.g. UPI QR code display, ₹ symbol placement).
- Do not add shadows to cards, buttons, or text — per `design.md`, shadow is reserved for product-style imagery only, and this app has none, so in practice this app should have **no drop shadows** on any UI chrome.
- Touch targets minimum 44×44px, per `design.md` responsive rules — non-negotiable for this mobile-first product.

---

## 4. Data & Validation Rules
- Never allow an expense to be saved where `sum(ExpenseShare.sharePaise) !== Expense.amountPaise`. Validate both client-side (fast feedback) and server-side (source of truth — never trust the client alone).
- Never allow a member to be removed from a trip while their net balance is non-zero (see `schema.md` §7). Surface a clear error explaining why.
- Trip share codes must be checked for uniqueness at generation time; regenerate on collision rather than allowing duplicates.
- Every mutation (add/edit/delete expense, add/remove member) must trigger a full recomputation of balances and settlement — never cache stale derived balances.

---

## 5. API Rules
- All API responses follow a consistent shape: success payload directly, or `{ error: string }` with an appropriate HTTP status code on failure. No mixing of error conventions across endpoints.
- No endpoint should perform partial writes — an expense with an invalid split must fail atomically, not save the expense and skip the shares (or vice versa).
- API endpoints must not directly manipulate the raw data store outside of the `lib/store.ts` abstraction — this keeps a future migration from in-memory to SQLite/Postgres (per `trd.md` §4) a contained change.

---

## 6. Security & Privacy Rules
- Never collect or store bank account numbers, card numbers, or UPI PINs. A UPI VPA (e.g. `name@bank`) is the only payment-related field ever stored, and it is inherently a public-facing handle, not a secret.
- Trip access control is link/code-based only in v1 — do not build a false sense of security; do not expose trip codes in indexable URLs (no sitemap inclusion, `noindex` on trip pages).
- Do not log full expense descriptions or member names to any third-party analytics service — this is personal financial data between friends, treat it as sensitive even though it isn't formally regulated PII.

---

## 7. Testing Expectations
- Any change to `lib/split.ts` or `lib/settlement.ts` must be re-verified against the test cases outlined in `implementation.md` Phase 1 (non-divisible equal splits, custom split validation, settlement correctness) before being considered done.
- Manual QA before marking a `tracker.md` item complete: test on an actual mobile viewport, not just desktop browser resize.

---

## 8. Documentation Maintenance
- If a decision in this project deviates from `prd.md`, `trd.md`, `appflow.md`, `schema.md`, or `implementation.md`, **update the relevant doc in the same change** — these documents must stay accurate, not become stale artifacts.
- Update `tracker.md` status as work is completed — it is the single place to check current project state at a glance.
- New rules discovered during development (e.g. a gotcha with UPI deep links on iOS Safari) should be appended to this file under a new numbered section, not left undocumented in commit messages alone.
