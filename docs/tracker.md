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
| Landing page | ☐ | |
| Trip Setup page | ☐ | |
| Join Trip page | ☐ | |
| Trip Dashboard | ☐ | Critical path |
| Add/Edit Expense form | ☐ | Critical path |
| Expense History page | ☐ | |
| Manage Members page | ☐ | |
| Settlement View | ☐ | Critical path |

## Phase 4 — India-Specific Polish
| Task | Status | Notes |
|---|---|---|
| Currency formatting audit (all screens) | ☐ | |
| Category set/iconography review | ☐ | |
| UPI link tested (GPay/PhonePe) | ☐ | |
| QR fallback tested | ☐ | |
| IST date rendering audit | ☐ | |

## Phase 5 — Mobile Performance & Accessibility
| Task | Status | Notes |
|---|---|---|
| 375px / 320px viewport test | ☐ | |
| Touch target audit (≥44×44px) | ☐ | |
| Lighthouse mobile score >90 | ☐ | |
| Form label + contrast audit | ☐ | |
| Slow 3G usability test | ☐ | |

## Phase 6 — QA & Edge Cases
| Task | Status | Notes |
|---|---|---|
| Rounding-remainder edge cases | ☐ | |
| Member removal balance-block | ☐ | |
| Edit/delete recalculation correctness | ☐ | |
| Trip code collision handling | ☐ | |
| Empty states | ☐ | |
| Refresh persistence check | ☐ | |

## Phase 7 — Deployment
| Task | Status | Notes |
|---|---|---|
| Hosting target chosen | ☐ | |
| Production persistence configured | ☐ | JSON snapshot min / SQLite recommended |
| Multi-device smoke test | ☐ | |

---

## Milestones
| Milestone | Target | Status |
|---|---|---|
| M1: Core logic working (Phase 1) tested in isolation | | ☑ |
| M2: End-to-end critical path works locally (create trip → add expense → view settlement) | | ☐ |
| M3: Full feature set complete (all `appflow.md` screens) | | ☐ |
| M4: Mobile-polished + India-specific details verified | | ☐ |
| M5: Deployed and tested with a real friend group on an actual trip | | ☐ |

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
