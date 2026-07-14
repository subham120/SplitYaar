# App Flow Document (appflow.md)
## Trip & Roommate Expense Splitter — India Edition

This document maps every major user journey through the app, screen by screen, including edge cases and navigation paths.

---

## 1. High-Level Flow Map

```
Landing Page
   │
   ├── Create New Trip ──────────────► Trip Setup (add members) ──► Trip Dashboard
   │
   └── Join Existing Trip (via link/code) ─────────────────────────► Trip Dashboard
                                                                          │
                        ┌─────────────────────────────────────────────────┼──────────────────────────────┐
                        │                                                 │                              │
                  Add Expense                                    View Balances                    Settlement View
                        │                                                 │                              │
                Edit/Delete Expense                             Expense History/Log              UPI Pay Links / QR
```

---

## 2. Screen-by-Screen Flow

### 2.1 Landing Page (`/`)
**Purpose:** Entry point. Two clear actions.
- **CTA 1: "Start a New Trip"** → goes to Trip Setup
- **CTA 2: "Join a Trip"** → prompts for a trip code/link → goes to Trip Dashboard
- Brief explainer copy: what the tool does, in one line ("Split trip expenses with friends. No signup needed.")
- No login/signup gate — this is the first meaningful difference from something like Splitwise.

### 2.2 Trip Setup (`/trip/new`)
**Purpose:** Create a new trip and seed initial members.
- Input: **Trip name** (e.g. "Goa Trip 2026")
- Input: **Your name** (creator identifies themselves)
- Optional: **Add friends' names** (can add more later from the dashboard too)
- Button: **"Create Trip"**
- On submit → generates trip ID + shareable short code → redirects to Trip Dashboard
- Shows a **shareable link/code** immediately with a "Copy Link" button, so the creator can send it to the group over WhatsApp

**Edge cases:**
- No members added yet besides creator → dashboard still loads; members can be added anytime before/after expenses exist
- Trip name left blank → default to "Untitled Trip" + creation date

### 2.3 Join Trip (`/trip/join`)
**Purpose:** Let a friend join via shared link or manually entered code.
- If arriving via full link (`/trip/[code]`) → skip straight to name entry
- Input: **Your name** (so their expenses/balances are attributed correctly)
- Button: **"Join Trip"** → redirects to Trip Dashboard

**Edge case:** Name collision (two "Rahul"s) → app appends a disambiguator (e.g. "Rahul 2") or prompts the user to pick a distinguishing last name/initial.

### 2.4 Trip Dashboard (`/trip/[code]`)
**Purpose:** The central hub — most-used screen during the trip.

**Sections (mobile-first, vertically stacked):**
1. **Header:** Trip name, member count, total trip spend so far
2. **Quick action:** Prominent **"+ Add Expense"** button (primary CTA, sticky on mobile)
3. **Balance summary cards:** one per member — "You are owed ₹X" / "You owe ₹Y" / "Settled up"
4. **Recent expenses list:** last 5–10 expenses, each showing description, amount, payer, split type icon
5. **Navigation to:**
   - Full **Expense History**
   - **Settlement View**
   - **Manage Members** (add/remove people from the trip)

### 2.5 Add Expense (`/trip/[code]/expense/new`) — modal or dedicated screen
**Purpose:** Core, most-frequent action. Must be fast.

**Fields (in order):**
1. **Description** (free text, e.g. "Dinner at beach shack")
2. **Amount (₹)** — numeric keypad on mobile
3. **Paid by** — dropdown/selector of trip members (defaults to current user)
4. **Category** — chip selector: Food · Travel · Stay · Sightseeing · Shopping · Alcohol · Misc
5. **Split type** — segmented control:
   - **Equal (all)** — default, zero extra taps
   - **Equal (select members)** — checkboxes appear to deselect who's excluded
   - **Custom** — per-member ₹ or % input fields appear, with a running "remaining to allocate" indicator
6. **Date** — defaults to today (IST), editable

**Button:** "Add Expense" → validates split sums to total → saves → returns to Dashboard with updated balances

**Edge cases:**
- Custom split doesn't sum to total → inline error, blocks submission, shows the ₹ difference to resolve
- Only one member in trip → split controls hidden (nothing to split)

### 2.6 Edit / Delete Expense (`/trip/[code]/expense/[id]/edit`)
- Same form as Add Expense, pre-filled
- **Delete** button with confirmation ("This will recalculate everyone's balance. Continue?")
- On save/delete → balances and settlement recompute automatically

### 2.7 Expense History (`/trip/[code]/history`)
**Purpose:** Full chronological log, for transparency/dispute resolution.
- Filterable by: member (paid by), category, date range
- Each row: date, description, amount, payer, split summary (tap to expand who owes what for that specific expense)
- Tap any row → Edit Expense screen

### 2.8 Manage Members (`/trip/[code]/members`)
- List of current members
- **Add member** (name only)
- **Remove member** — only allowed if they have a ₹0 net balance (otherwise blocked with explanation, to avoid silently erasing debt)
- Each member can optionally add their **UPI ID** here (used later for settlement pay links)

### 2.9 Settlement View (`/trip/[code]/settlement`)
**Purpose:** The "final answer" screen — who pays whom.

- Runs the greedy min-cash-flow algorithm (see `trd.md` §5.3)
- Displays a simple directional list:
  > **Rahul → Aman: ₹450**
  > **Priya → Aman: ₹300**
- Each row has a **"Pay via UPI"** button:
  - If the payee has a UPI ID saved → opens `upi://pay` deep link (mobile) or shows a scannable QR (desktop)
  - If no UPI ID saved → prompts "Ask Aman to add their UPI ID" with a shareable nudge
- **"Mark as settled"** manual toggle per transaction (v1: just a visual checkmark, doesn't affect balance recalculation — full "confirmed paid" tracking is a v2 feature per `prd.md` §7)

**Edge case:** All balances already ₹0 → shows a friendly "Everyone's settled up! 🎉" state instead of a payment list.

---

## 3. Roommate/Recurring Use Case Flow (Secondary)
Same flow as above, but:
- Trip is simply named e.g. "Flat 3B — Monthly Expenses" and never "ends"
- Members add expenses continuously (rent, groceries, wifi bill)
- Settlement can be run at any cadence (e.g. once a month) rather than once at trip end
- No structural differences in screens — this is the same product, used with a longer time horizon

---

## 4. Navigation Summary (Sitemap)

```
/                              → Landing
/trip/new                      → Create trip
/trip/join                     → Join trip (manual code entry)
/trip/[code]                   → Dashboard
/trip/[code]/expense/new       → Add expense
/trip/[code]/expense/[id]/edit → Edit/delete expense
/trip/[code]/history           → Expense history/log
/trip/[code]/members           → Manage members + UPI IDs
/trip/[code]/settlement        → Final settlement + UPI pay links
```

---

## 5. Error & Empty States to Design For
- **Empty trip (no expenses yet):** Dashboard shows an inviting empty state prompting "Add your first expense" rather than a blank list.
- **Invalid/expired trip code on join:** Clear message + link back to landing page.
- **Network failure while adding expense:** Optimistic UI shows a pending state, retries, and clearly indicates failure with a retry button rather than silently losing the entry.
- **Rounding remainder (e.g. ₹100 split 3 ways = ₹33.33 × 3):** Remainder paisa is deterministically assigned to the payer so ledger always balances exactly to ₹0 net across all members.
