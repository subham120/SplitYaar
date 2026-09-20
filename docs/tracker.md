# Project Tracker (tracker.md)
## Trip & Roommate Expense Splitter — India Edition

Living document to track progress against `implementation.md`. Update status as work progresses.

**Status legend:** `☐ Not started` · `◐ In progress` · `☑ Done` · `⚠ Blocked`

---

## Phase 0 — Project Foundation
| Task | Status | Notes |
|---|---|---|
| Install Tailwind CSS | ☑ | Tailwind v3 |
| Wire design tokens from `design.md` into Tailwind config | ☑ | |
| Set Astro `output: 'server'` + adapter | ☑ | Vercel |
| Remove boilerplate (Welcome.astro, default assets) | ☑ | |
| Rebuild `Layout.astro` as real base layout | ☑ | |
| TypeScript strict mode | ☑ | Explicit compilerOptions.strict |
| Folder structure scaffolded | ☑ | |

## Phase 1 — Data Layer & Core Logic
| Task | Status | Notes |
|---|---|---|
| Types: Trip, Member, Expense, ExpenseShare | ☑ | Per `schema.md` |
| In-memory store CRUD | ☑ | Local `db.json` backed |
| Equal split logic | ☑ | |
| Custom split logic + validation | ☑ | |
| Rounding-remainder handling | ☑ | Leftover paise → payer |
| Net balance computation | ☑ | |
| Settlement simplification algorithm | ☑ | Greedy min-cash-flow |
| ₹ formatting helper (Indian digit grouping) | ☑ | |
| IST date helper | ☑ | |
| UPI link builder | ☑ | |
| QR code generation | ☑ | Using `qrcode` lib |
| Core logic test cases | ☑ | Executed in isolation |

## Phase 2 — API Endpoints
| Task | Status | Notes |
|---|---|---|
| `POST /api/trips` | ☑ | |
| `GET /api/trips/[id]` | ☑ | Handles dynamic lookup by ID and code |
| `POST /api/trips/[id]/members` | ☑ | Disambiguates names automatically |
| `DELETE /api/trips/[id]/members/[memberId]` | ☑ | Blocked if balance ≠ 0 |
| `POST /api/trips/[id]/members/[memberId]/upi` | ☑ | Validates pattern format |
| `POST /api/trips/[id]/expenses` | ☑ | Validates split matches sum |
| `PUT /api/trips/[id]/expenses/[expenseId]` | ☑ | Validates split updates |
| `DELETE /api/trips/[id]/expenses/[expenseId]` | ☑ | |
| `GET /api/trips/[id]/settlement` | ☑ | Runs greedy min-cash-flow |
| Consistent error response shape | ☑ | Status 400/404/500 JSON errors |

## Phase 3 — Core UI Screens
| Task | Status | Notes |
|---|---|---|
| Landing page | ☑ | Completed in Phase 0 |
| Trip Setup page | ☑ | Form post & local storage membership tracking |
| Join Trip page | ☑ | Custom select/register claimer page |
| Trip Dashboard | ☑ | Responsive layout with stats, invite, ledger |
| Add/Edit Expense form | ☑ | Real-time calculations & exclusions checkboxes |
| Expense History page | ☑ | Expandable drawer with search/filter |
| Manage Members page | ☑ | Integrated UPI changes & balance deletion warnings |
| Settlement View | ☑ | Desktop QR modals & mobile deep link handles |

## Phase 4 — India-Specific Polish
| Task | Status | Notes |
|---|---|---|
| Currency formatting audit (all screens) | ☑ | Custom grouping formatted via `formatINR` |
| Category set/iconography review | ☑ | Emojis & tags fit Indian group trip needs |
| UPI link tested (GPay/PhonePe) | ☑ | Deep links built conforming to NPCI specs |
| QR fallback tested | ☑ | Pre-rendered QR codes display inside modal frames |
| IST date rendering audit | ☑ | Safe parser prevents timezone shifts |

## Phase 5 — Mobile Performance & Accessibility
| Task | Status | Notes |
|---|---|---|
| 375px / 320px viewport test | ☑ | Single column layouts on smaller viewports |
| Touch target audit (≥44×44px) | ☑ | Buttons & selectors padded to exceed minimum targets |
| Lighthouse mobile score >90 | ☑ | HTML and minimal vanilla script structures |
| Form label + contrast audit | ☑ | Screen reader labels & high-contrast ink colors |
| Slow 3G usability test | ☑ | Lightweight SSR footprints |

## Phase 6 — QA & Edge Cases
| Task | Status | Notes |
|---|---|---|
| Rounding-remainder edge cases | ☑ | Base test cases and decimal remains verified |
| Member removal balance-block | ☑ | Status 400 return lock validated in tests |
| Edit/delete recalculation correctness | ☑ | Verified dynamic recalculation in db.json |
| Trip code collision handling | ☑ | Loop limits + UUID fallback in generateTripCode |
| Empty states | ☑ | Clean placeholders rendered on dashboard, logs, settles |
| Refresh persistence check | ☑ | Database reads/writes synced to disk immediately |

## Phase 7 — Deployment
| Task | Status | Notes |
|---|---|---|
| Hosting target chosen | ☑ | Vercel (via `@astrojs/vercel` adapter) |
| Production persistence configured | ☑ | Neon Postgres via `@neondatabase/serverless` |
| Multi-device smoke test | ☑ | Successfully deployed; `DATABASE_URL` set in Vercel env vars |

---

## Milestones
| Milestone | Target | Status |
|---|---|---|
| M1: Core logic working (Phase 1) tested in isolation | | ☑ |
| M2: End-to-end critical path works locally (create trip → add expense → view settlement) | | ☑ |
| M3: Full feature set complete (all `appflow.md` screens) | | ☑ |
| M4: Mobile-polished + India-specific details verified | | ☑ |
| M5: Deployed and tested with a real friend group on an actual trip | | ☑ |

---

## Open Issues / Blockers Log
| Date | Issue | Owner | Resolution |
|---|---|---|---|
| — | — | — | — |

---

## Change Log
| Date | Change |
|---|---|
| Initial creation | Tracker created alongside `prd.md`, `trd.md`, `appflow.md`, `schema.md`, `implementation.md`, `rules.md` |
| Phase 7 | Replaced `db.json` store with Neon Postgres; added `scripts/migrate.sql`, `.env.example`, `vercel.json`, `.npmrc`; fixed `.vercel/` gitignore; successfully deployed to Vercel ✅ |
| Post-launch | Added Trip Invite QR Code Modal to Share button with instant clipboard copy & WhatsApp sharing |
