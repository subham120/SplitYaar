-- SplitYaar: Neon Postgres migration
-- Run this once against your Neon database to create the schema.
-- Compatible with standard Postgres (Neon, Supabase, etc.)

-- ============================================================
-- Tables
-- ============================================================

CREATE TABLE IF NOT EXISTS trips (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_member_id TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed'))
);

CREATE TABLE IF NOT EXISTS members (
  id TEXT PRIMARY KEY,
  trip_id TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  upi_id TEXT,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  trip_id TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount_paise INTEGER NOT NULL CHECK (amount_paise > 0),
  paid_by_member_id TEXT NOT NULL REFERENCES members(id),
  category TEXT NOT NULL CHECK (category IN ('food','travel','stay','sightseeing','shopping','alcohol','misc')),
  split_type TEXT NOT NULL CHECK (split_type IN ('equal_all','equal_selected','custom')),
  date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS expense_shares (
  id TEXT PRIMARY KEY,
  expense_id TEXT NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  member_id TEXT NOT NULL REFERENCES members(id),
  share_paise INTEGER NOT NULL CHECK (share_paise >= 0)
);

-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_members_trip_id ON members(trip_id);
CREATE INDEX IF NOT EXISTS idx_expenses_trip_id ON expenses(trip_id);
CREATE INDEX IF NOT EXISTS idx_expense_shares_expense_id ON expense_shares(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_shares_member_id ON expense_shares(member_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_trips_code ON trips(code);
