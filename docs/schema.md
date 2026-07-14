# Data Schema Document (schema.md)
## Trip & Roommate Expense Splitter — India Edition

This schema is written to be portable: usable as in-memory TypeScript interfaces for v1, and directly mappable to SQL tables (SQLite/Postgres) for v2. All monetary values are stored as **integers in paise** (1 rupee = 100 paise) to avoid floating-point rounding errors, and converted to ₹ only at display time.

---

## 1. Entity Relationship Overview

```
Trip (1) ──────< (many) Member
Trip (1) ──────< (many) Expense
Expense (1) ────< (many) ExpenseShare
Member (1) ─────< (many) ExpenseShare
Member (1) ─────< (many) Expense (as payer)
```

---

## 2. Entities

### 2.1 `Trip`
| Field | Type | Notes |
|---|---|---|
| `id` | string (UUID) | Primary key, internal |
| `code` | string (8 chars, alphanumeric) | Shareable short code, unique, indexed |
| `name` | string | e.g. "Goa Trip 2026" |
| `createdAt` | ISO datetime (IST) | |
| `createdByMemberId` | string (FK → Member.id) | |
| `status` | enum: `active` \| `closed` | v2: locks edits once "closed" |

### 2.2 `Member`
| Field | Type | Notes |
|---|---|---|
| `id` | string (UUID) | Primary key |
| `tripId` | string (FK → Trip.id) | |
| `name` | string | Display name within the trip |
| `upiId` | string \| null | Optional UPI VPA, e.g. `rahul@okhdfcbank` |
| `joinedAt` | ISO datetime | |

### 2.3 `Expense`
| Field | Type | Notes |
|---|---|---|
| `id` | string (UUID) | Primary key |
| `tripId` | string (FK → Trip.id) | |
| `description` | string | e.g. "Dinner at beach shack" |
| `amountPaise` | integer | Total expense amount, in paise |
| `paidByMemberId` | string (FK → Member.id) | Single payer (v1 constraint) |
| `category` | enum | `food` \| `travel` \| `stay` \| `sightseeing` \| `shopping` \| `alcohol` \| `misc` |
| `splitType` | enum | `equal_all` \| `equal_selected` \| `custom` |
| `date` | ISO date (IST) | Defaults to creation date |
| `createdAt` | ISO datetime | |
| `updatedAt` | ISO datetime | |

### 2.4 `ExpenseShare`
Represents each member's fair-share allocation for a given expense (the "split" itself).

| Field | Type | Notes |
|---|---|---|
| `id` | string (UUID) | Primary key |
| `expenseId` | string (FK → Expense.id) | |
| `memberId` | string (FK → Member.id) | |
| `sharePaise` | integer | This member's portion of the expense, in paise |

**Invariant:** `sum(ExpenseShare.sharePaise for a given expenseId) === Expense.amountPaise` (exact, enforced at write time — remainder paisa assigned to the payer's own share row).

---

## 3. Derived / Computed Data (not stored, calculated on read)

### 3.1 Member Net Balance
```
netBalancePaise(member) =
    sum(Expense.amountPaise where Expense.paidByMemberId === member.id)
  − sum(ExpenseShare.sharePaise where ExpenseShare.memberId === member.id)
```
- Positive → owed money by the group
- Negative → owes money to the group

### 3.2 Settlement Transactions
Not persisted by default in v1 (computed fresh each time the Settlement View is opened) — see `trd.md` §5.3 for the algorithm. Optionally persisted as a `SettlementSnapshot` entity in v2 (see §5 below) if "mark as settled" tracking is introduced.

---

## 4. TypeScript Interfaces (v1 reference implementation)

```typescript
interface Trip {
  id: string;
  code: string;
  name: string;
  createdAt: string; // ISO datetime
  createdByMemberId: string;
  status: 'active' | 'closed';
}

interface Member {
  id: string;
  tripId: string;
  name: string;
  upiId: string | null;
  joinedAt: string;
}

type ExpenseCategory =
  | 'food'
  | 'travel'
  | 'stay'
  | 'sightseeing'
  | 'shopping'
  | 'alcohol'
  | 'misc';

type SplitType = 'equal_all' | 'equal_selected' | 'custom';

interface Expense {
  id: string;
  tripId: string;
  description: string;
  amountPaise: number;
  paidByMemberId: string;
  category: ExpenseCategory;
  splitType: SplitType;
  date: string; // ISO date
  createdAt: string;
  updatedAt: string;
}

interface ExpenseShare {
  id: string;
  expenseId: string;
  memberId: string;
  sharePaise: number;
}

// Derived, not persisted
interface MemberBalance {
  memberId: string;
  totalPaidPaise: number;
  totalOwedPaise: number; // sum of their shares
  netBalancePaise: number; // totalPaidPaise - totalOwedPaise
}

interface SettlementTransaction {
  fromMemberId: string;
  toMemberId: string;
  amountPaise: number;
}
```

---

## 5. Optional v2 Entity: `SettlementSnapshot`
For future "mark as settled / paid" tracking (see `prd.md` §7 future enhancements):

| Field | Type | Notes |
|---|---|---|
| `id` | string (UUID) | Primary key |
| `tripId` | string (FK → Trip.id) | |
| `generatedAt` | ISO datetime | |
| `transactions` | JSON array of `SettlementTransaction` + `status: 'pending' \| 'confirmed'` | |

---

## 6. SQL DDL Equivalent (for v2 SQLite/Postgres migration)

```sql
CREATE TABLE trips (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by_member_id TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed'))
);

CREATE TABLE members (
  id TEXT PRIMARY KEY,
  trip_id TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  upi_id TEXT,
  joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE expenses (
  id TEXT PRIMARY KEY,
  trip_id TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount_paise INTEGER NOT NULL CHECK (amount_paise > 0),
  paid_by_member_id TEXT NOT NULL REFERENCES members(id),
  category TEXT NOT NULL CHECK (category IN ('food','travel','stay','sightseeing','shopping','alcohol','misc')),
  split_type TEXT NOT NULL CHECK (split_type IN ('equal_all','equal_selected','custom')),
  date DATE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE expense_shares (
  id TEXT PRIMARY KEY,
  expense_id TEXT NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  member_id TEXT NOT NULL REFERENCES members(id),
  share_paise INTEGER NOT NULL CHECK (share_paise >= 0)
);

CREATE INDEX idx_expenses_trip_id ON expenses(trip_id);
CREATE INDEX idx_expense_shares_expense_id ON expense_shares(expense_id);
CREATE INDEX idx_members_trip_id ON members(trip_id);
CREATE UNIQUE INDEX idx_trips_code ON trips(code);
```

---

## 7. Validation Rules Summary
- `Expense.amountPaise` must be > 0
- `sum(ExpenseShare.sharePaise)` for an expense must exactly equal `Expense.amountPaise`
- A `Member` cannot be deleted from a `Trip` while their `netBalancePaise !== 0`
- `Trip.code` must be unique across all trips (collision-checked on generation, regenerate on collision)
- `Member.upiId`, if present, should be loosely validated against the general UPI VPA pattern: `^[\w.\-]+@[\w]+$`
