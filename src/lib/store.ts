import { neon } from '@neondatabase/serverless';
import crypto from 'crypto';
import type { Trip, Member, Expense, ExpenseShare } from './types';
import { validateCustomSplit } from './split';
import { computeNetBalances } from './settlement';

// ---------------------------------------------------------------------------
// DB client
// ---------------------------------------------------------------------------

function getDb() {
  // process.env is required for runtime secrets on Vercel (import.meta.env is build-time only)
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      'DATABASE_URL environment variable is not set.\n' +
      'Local dev: add it to your .env file (see .env.example).\n' +
      'Vercel: add it in Project Settings → Environment Variables.'
    );
  }
  return neon(url);
}

// ---------------------------------------------------------------------------
// Row → TypeScript type mappers
// ---------------------------------------------------------------------------

function rowToTrip(row: Record<string, unknown>): Trip {
  return {
    id: row.id as string,
    code: row.code as string,
    name: row.name as string,
    createdAt: (row.created_at as Date).toISOString(),
    createdByMemberId: row.created_by_member_id as string,
    status: row.status as 'active' | 'closed',
  };
}

function rowToMember(row: Record<string, unknown>): Member {
  return {
    id: row.id as string,
    tripId: row.trip_id as string,
    name: row.name as string,
    upiId: (row.upi_id as string | null) ?? null,
    joinedAt: (row.joined_at as Date).toISOString(),
  };
}

function rowToExpense(row: Record<string, unknown>): Expense {
  return {
    id: row.id as string,
    tripId: row.trip_id as string,
    description: row.description as string,
    amountPaise: row.amount_paise as number,
    paidByMemberId: row.paid_by_member_id as string,
    category: row.category as Expense['category'],
    splitType: row.split_type as Expense['splitType'],
    date: typeof row.date === 'string' ? row.date : (row.date as Date).toISOString().slice(0, 10),
    createdAt: (row.created_at as Date).toISOString(),
    updatedAt: (row.updated_at as Date).toISOString(),
  };
}

function rowToShare(row: Record<string, unknown>): ExpenseShare {
  return {
    id: row.id as string,
    expenseId: row.expense_id as string,
    memberId: row.member_id as string,
    sharePaise: row.share_paise as number,
  };
}

// ---------------------------------------------------------------------------
// Trip code generation
// ---------------------------------------------------------------------------

async function generateTripCode(): Promise<string> {
  const sql = getDb();
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  for (let attempt = 0; attempt < 100; attempt++) {
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const rows = await sql`SELECT 1 FROM trips WHERE code = ${code} LIMIT 1`;
    if (rows.length === 0) return code;
  }

  // Fallback: UUID slice (near-zero collision chance)
  return crypto.randomUUID().slice(0, 8).toUpperCase();
}

// ---------------------------------------------------------------------------
// Public store API (same shape as the old in-memory store)
// ---------------------------------------------------------------------------

export async function createTrip(name: string, creatorName: string): Promise<Trip> {
  const sql = getDb();
  const tripId = crypto.randomUUID();
  const creatorMemberId = crypto.randomUUID();
  const code = await generateTripCode();
  const now = new Date().toISOString();

  // Insert trip
  await sql`
    INSERT INTO trips (id, code, name, created_at, created_by_member_id, status)
    VALUES (${tripId}, ${code}, ${name.trim() || 'Untitled Trip'}, ${now}, ${creatorMemberId}, 'active')
  `;

  // Insert creator member
  await sql`
    INSERT INTO members (id, trip_id, name, upi_id, joined_at)
    VALUES (${creatorMemberId}, ${tripId}, ${creatorName.trim()}, NULL, ${now})
  `;

  const rows = await sql`SELECT * FROM trips WHERE id = ${tripId}`;
  return rowToTrip(rows[0] as Record<string, unknown>);
}

export async function getTripByCode(code: string): Promise<{
  trip: Trip;
  members: Member[];
  expenses: Expense[];
  shares: ExpenseShare[];
} | null> {
  const sql = getDb();
  const normalizedCode = code.trim().toUpperCase();

  const tripRows = await sql`SELECT * FROM trips WHERE code = ${normalizedCode}`;
  if (tripRows.length === 0) return null;

  const trip = rowToTrip(tripRows[0] as Record<string, unknown>);
  return fetchTripRelations(sql, trip);
}

export async function getTripById(id: string): Promise<{
  trip: Trip;
  members: Member[];
  expenses: Expense[];
  shares: ExpenseShare[];
} | null> {
  const sql = getDb();

  const tripRows = await sql`SELECT * FROM trips WHERE id = ${id}`;
  if (tripRows.length === 0) return null;

  const trip = rowToTrip(tripRows[0] as Record<string, unknown>);
  return fetchTripRelations(sql, trip);
}

async function fetchTripRelations(
  sql: ReturnType<typeof neon>,
  trip: Trip
): Promise<{
  trip: Trip;
  members: Member[];
  expenses: Expense[];
  shares: ExpenseShare[];
}> {
  const [memberRows, expenseRows] = await Promise.all([
    sql`SELECT * FROM members WHERE trip_id = ${trip.id} ORDER BY joined_at ASC`,
    sql`SELECT * FROM expenses WHERE trip_id = ${trip.id} ORDER BY date DESC, created_at DESC`,
  ]);

  const members = memberRows.map((r) => rowToMember(r as Record<string, unknown>));
  const expenses = expenseRows.map((r) => rowToExpense(r as Record<string, unknown>));

  let shares: ExpenseShare[] = [];
  if (expenses.length > 0) {
    const expenseIds = expenses.map((e) => e.id);
    const shareRows = await sql`
      SELECT * FROM expense_shares WHERE expense_id = ANY(${expenseIds})
    `;
    shares = shareRows.map((r) => rowToShare(r as Record<string, unknown>));
  }

  return { trip, members, expenses, shares };
}

export async function addMember(tripId: string, name: string, upiId: string | null = null): Promise<Member> {
  const sql = getDb();

  const tripRows = await sql`SELECT 1 FROM trips WHERE id = ${tripId}`;
  if (tripRows.length === 0) throw new Error('Trip not found');

  let memberName = name.trim();
  if (!memberName) throw new Error('Member name cannot be empty');

  // Disambiguate name collision
  const existingRows = await sql`SELECT name FROM members WHERE trip_id = ${tripId}`;
  const existingNames = existingRows.map((r) => (r.name as string).toLowerCase());

  if (existingNames.includes(memberName.toLowerCase())) {
    let suffix = 2;
    while (existingNames.includes(`${memberName.toLowerCase()} ${suffix}`)) {
      suffix++;
    }
    memberName = `${memberName} ${suffix}`;
  }

  const memberId = crypto.randomUUID();
  const now = new Date().toISOString();

  await sql`
    INSERT INTO members (id, trip_id, name, upi_id, joined_at)
    VALUES (${memberId}, ${tripId}, ${memberName}, ${upiId ? upiId.trim() : null}, ${now})
  `;

  const rows = await sql`SELECT * FROM members WHERE id = ${memberId}`;
  return rowToMember(rows[0] as Record<string, unknown>);
}

export async function removeMember(tripId: string, memberId: string): Promise<void> {
  const sql = getDb();

  const tripRows = await sql`SELECT 1 FROM trips WHERE id = ${tripId}`;
  if (tripRows.length === 0) throw new Error('Trip not found');

  // Balance check
  const tripData = await getTripById(tripId);
  if (tripData) {
    const balances = computeNetBalances(tripData.members, tripData.expenses, tripData.shares);
    const mBal = balances.find((b) => b.memberId === memberId);
    if (mBal && mBal.netBalancePaise !== 0) {
      throw new Error('Cannot remove member with a non-zero balance. Settle debts first.');
    }
  }

  // Cascade delete removes expense_shares referencing this member automatically
  // But we also clean up any stray shares that might remain (extra safety)
  await sql`DELETE FROM expense_shares WHERE member_id = ${memberId}`;
  await sql`DELETE FROM members WHERE id = ${memberId} AND trip_id = ${tripId}`;
}

export async function updateMemberUpi(tripId: string, memberId: string, upiId: string | null): Promise<Member> {
  const sql = getDb();

  const memberRows = await sql`SELECT * FROM members WHERE id = ${memberId} AND trip_id = ${tripId}`;
  if (memberRows.length === 0) throw new Error('Member not found in this trip');

  if (upiId && !/^[\w.\-]+@[\w]+$/.test(upiId.trim())) {
    throw new Error('Invalid UPI ID format (expected name@bank)');
  }

  await sql`
    UPDATE members SET upi_id = ${upiId ? upiId.trim() : null}
    WHERE id = ${memberId} AND trip_id = ${tripId}
  `;

  const rows = await sql`SELECT * FROM members WHERE id = ${memberId}`;
  return rowToMember(rows[0] as Record<string, unknown>);
}

export async function addExpense(
  tripId: string,
  expenseData: Omit<Expense, 'id' | 'tripId' | 'createdAt' | 'updatedAt'>,
  sharesData: Omit<ExpenseShare, 'id' | 'expenseId'>[]
): Promise<Expense> {
  const sql = getDb();

  const tripRows = await sql`SELECT 1 FROM trips WHERE id = ${tripId}`;
  if (tripRows.length === 0) throw new Error('Trip not found');

  if (expenseData.amountPaise <= 0) throw new Error('Expense amount must be greater than zero');

  const { isValid, differencePaise } = validateCustomSplit(expenseData.amountPaise, sharesData);
  if (!isValid) {
    throw new Error(`Split total does not match expense total. Difference: ${differencePaise / 100} Rupee(s)`);
  }

  const expenseId = crypto.randomUUID();
  const now = new Date().toISOString();

  await sql`
    INSERT INTO expenses (id, trip_id, description, amount_paise, paid_by_member_id, category, split_type, date, created_at, updated_at)
    VALUES (
      ${expenseId}, ${tripId}, ${expenseData.description}, ${expenseData.amountPaise},
      ${expenseData.paidByMemberId}, ${expenseData.category}, ${expenseData.splitType},
      ${expenseData.date}, ${now}, ${now}
    )
  `;

  for (const share of sharesData) {
    await sql`
      INSERT INTO expense_shares (id, expense_id, member_id, share_paise)
      VALUES (${crypto.randomUUID()}, ${expenseId}, ${share.memberId}, ${share.sharePaise})
    `;
  }

  const rows = await sql`SELECT * FROM expenses WHERE id = ${expenseId}`;
  return rowToExpense(rows[0] as Record<string, unknown>);
}

export async function updateExpense(
  tripId: string,
  expenseId: string,
  expenseUpdates: Partial<Omit<Expense, 'id' | 'tripId' | 'createdAt' | 'updatedAt'>>,
  sharesData: Omit<ExpenseShare, 'id' | 'expenseId'>[]
): Promise<Expense> {
  const sql = getDb();

  const expRows = await sql`SELECT * FROM expenses WHERE id = ${expenseId} AND trip_id = ${tripId}`;
  if (expRows.length === 0) throw new Error('Expense not found');

  const existing = rowToExpense(expRows[0] as Record<string, unknown>);
  const newAmount = expenseUpdates.amountPaise !== undefined ? expenseUpdates.amountPaise : existing.amountPaise;

  if (newAmount <= 0) throw new Error('Expense amount must be greater than zero');

  const { isValid, differencePaise } = validateCustomSplit(newAmount, sharesData);
  if (!isValid) {
    throw new Error(`Split total does not match expense total. Difference: ${differencePaise / 100} Rupee(s)`);
  }

  const now = new Date().toISOString();
  const merged = { ...existing, ...expenseUpdates };

  await sql`
    UPDATE expenses SET
      description = ${merged.description},
      amount_paise = ${merged.amountPaise},
      paid_by_member_id = ${merged.paidByMemberId},
      category = ${merged.category},
      split_type = ${merged.splitType},
      date = ${merged.date},
      updated_at = ${now}
    WHERE id = ${expenseId} AND trip_id = ${tripId}
  `;

  // Replace shares
  await sql`DELETE FROM expense_shares WHERE expense_id = ${expenseId}`;
  for (const share of sharesData) {
    await sql`
      INSERT INTO expense_shares (id, expense_id, member_id, share_paise)
      VALUES (${crypto.randomUUID()}, ${expenseId}, ${share.memberId}, ${share.sharePaise})
    `;
  }

  const rows = await sql`SELECT * FROM expenses WHERE id = ${expenseId}`;
  return rowToExpense(rows[0] as Record<string, unknown>);
}

export async function deleteExpense(tripId: string, expenseId: string): Promise<void> {
  const sql = getDb();

  const expRows = await sql`SELECT 1 FROM expenses WHERE id = ${expenseId} AND trip_id = ${tripId}`;
  if (expRows.length === 0) throw new Error('Expense not found');

  // CASCADE on expense_shares handles cleanup automatically
  await sql`DELETE FROM expenses WHERE id = ${expenseId} AND trip_id = ${tripId}`;
}
