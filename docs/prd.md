# Product Requirements Document (PRD)
## Trip & Roommate Expense Splitter — India Edition

---

## 1. Overview

**Product name (working):** SplitYatra *(placeholder — can be renamed)*
**One-line pitch:** A simple, mobile-first web app for Indian friend groups to log shared expenses during trips or shared living, and instantly see who owes whom — with the fewest possible payments to settle up.

**Problem statement:**
When a group of friends travels together (or lives together as roommates), expenses are paid unevenly — one person books the cab, another pays the hotel, a third covers dinner. By the end of the trip nobody remembers who paid what, and settling up becomes a confusing, argument-prone WhatsApp thread of "you owe me ₹340, no wait, minus what I owe you for the auto." This product removes that friction.

**Target users:**
- Groups of friends (4–15 people) going on a trip within India
- Roommates sharing monthly household expenses
- Primarily mobile users, moderate technical comfort, price-sensitive (no willingness to pay for a "premium" splitting app for a one-off trip)

---

## 2. Goals & Non-Goals

### Goals
- Let any member of a group add an expense in under 15 seconds
- Support equal, partial, and custom/unequal splits
- Automatically calculate a **simplified settlement** (minimum number of transactions)
- Present amounts in Indian Rupee (₹) with Indian digit grouping (e.g. ₹1,25,000)
- Work well on a phone, including on flaky network (lightweight, fast)
- Require no signup friction — a trip should be usable within seconds of creation

### Non-Goals (out of scope for v1)
- Real payment processing / holding money in escrow
- Bank account linking, KYC, or wallet features
- Multi-currency support (INR only for v1)
- Native mobile apps (web-first, PWA optional in future)
- Group chat / messaging features
- Receipt OCR/scanning (may be a future enhancement)

---

## 3. User Personas

| Persona | Description | Key need |
|---|---|---|
| **Trip Organizer (Aman)** | Plans the trip, books most things upfront | Wants a clear picture of total spend and who still owes him |
| **Casual Participant (Priya)** | Joins the trip, pays for a few things spontaneously | Wants a dead-simple way to add an expense without creating an account |
| **Settler (Rahul)** | Just wants to know the final number to pay via UPI at the end | Wants a clean, final "you owe X ₹Y" summary with a UPI link |

---

## 4. Core Features (v1 Scope)

### 4.1 Trip / Group Management
- Create a trip with a name (e.g. "Goa Trip Dec 2026")
- Add members by name (no login required — name-based identity within a trip)
- Shareable trip link/code so friends can join and view/add expenses
- Support for multiple simultaneous trips per browser/user

### 4.2 Expense Entry
- Fields: **description**, **amount (₹)**, **paid by** (single payer for v1), **category**, **date**, **split type**
- Split types:
  - **Equal split** — divided evenly among all trip members
  - **Equal split (selected members)** — divided evenly among a chosen subset
  - **Custom split** — exact ₹ amount or % per member (must sum to total)
- Categories (India-relevant defaults): Food, Travel (Cab/Auto/Train/Flight), Stay, Sightseeing/Tickets, Shopping, Alcohol, Miscellaneous
- Edit and delete existing expenses (with recalculation of balances)

### 4.3 Balances & Ledger
- Per-member view: total paid, total owed (fair share), net balance (+ owed to them / − they owe)
- Chronological expense log/history, filterable by member or category

### 4.4 Settlement Engine
- Debt simplification algorithm (greedy, min-cash-flow) to minimize number of payments
- Output: list of directional payments (e.g. "Rahul → Aman: ₹450")
- **UPI-friendly settlement**: display a UPI deep link / QR (using `upi://pay` URI scheme) if a member has provided their UPI ID, so the payer can tap-to-pay directly from GPay/PhonePe/Paytm

### 4.5 India-Specific Formatting
- All currency in ₹, formatted with Indian digit grouping (lakh/crore style: ₹1,25,000)
- Default timezone: IST (Asia/Kolkata)
- Category set reflects common Indian trip/roommate expenses

---

## 5. User Stories

1. *As a trip organizer*, I want to create a trip and add all my friends' names so we have one shared place to log expenses.
2. *As any member*, I want to add an expense in a few taps, choosing who paid and how it should be split.
3. *As a member who missed an outing*, I want to be excluded from that specific expense's split.
4. *As anyone in the group*, I want to see, at any point, exactly how much I owe or am owed.
5. *As the trip winds down*, I want a final settlement view telling each person exactly who to pay and how much — ideally with a UPI link so I can pay instantly.
6. *As a roommate*, I want to reuse the same tool for recurring monthly expenses (rent, groceries, wifi) as a separate ongoing "trip".

---

## 6. Success Metrics (v1)

- Time to add first expense after opening the app: **< 30 seconds**
- Time to view final settlement for a 6-person, 20-expense trip: **< 5 seconds** (computation should feel instant)
- Zero required signup steps to start using a trip
- Mobile Lighthouse performance score: **> 90**

---

## 7. Future Enhancements (Post-v1, Not in Current Scope)
- Multi-payer expenses (split payment made by 2+ people at once)
- Receipt photo upload/attachment per expense
- Push/WhatsApp reminder notifications for pending settlements
- Recurring expense templates (for roommate rent/utilities use case)
- Actual UPI payment confirmation tracking (mark as "paid" and auto-update ledger)
- Export trip summary as PDF/shareable image
- Group avatars / trip cover photos

---

## 8. Assumptions & Constraints
- Users are comfortable identifying themselves by first name within a trip (no email/password auth required for v1)
- All amounts are in whole or decimal ₹ (paise-level precision optional)
- Trip data persistence handled via backend/database (see `schema.md` and `trd.md`)
- Built on the existing Astro-based template with the Apple-inspired design system already defined in `design.md`, adapted with India-appropriate content and UPI-first settlement UI
