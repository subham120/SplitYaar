import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type { Trip, Member, Expense, ExpenseShare } from './types';
import { validateCustomSplit } from './split';
import { computeNetBalances } from './settlement';

interface DBState {
  trips: Trip[];
  members: Member[];
  expenses: Expense[];
  shares: ExpenseShare[];
}

const DB_FILE = path.join(process.cwd(), 'db.json');

// Memory cache of database state
let state: DBState = {
  trips: [],
  members: [],
  expenses: [],
  shares: [],
};

// Initial load on import
function loadDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      state = JSON.parse(data);
    } else {
      saveDB();
    }
  } catch (err) {
    console.error('Failed to load local DB file, starting with empty state:', err);
  }
}

// Persist memory state to JSON file
function saveDB() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write local DB file:', err);
  }
}

// Initialize database
loadDB();

/**
 * Generates a unique 8-character uppercase alphanumeric trip code.
 * Ensures no collisions with existing trips.
 */
function generateTripCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let attempts = 0;
  
  while (attempts < 100) {
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    const exists = state.trips.some((t) => t.code === code);
    if (!exists) {
      return code;
    }
    attempts++;
  }
  
  // Fallback to random slice of UUID in case of repeated collision
  return crypto.randomUUID().slice(0, 8).toUpperCase();
}

export async function createTrip(name: string, creatorName: string): Promise<Trip> {
  const tripId = crypto.randomUUID();
  const creatorMemberId = crypto.randomUUID();
  const code = generateTripCode();
  const now = new Date().toISOString();

  const creator: Member = {
    id: creatorMemberId,
    tripId,
    name: creatorName.trim(),
    upiId: null,
    joinedAt: now,
  };

  const trip: Trip = {
    id: tripId,
    code,
    name: name.trim() || 'Untitled Trip',
    createdAt: now,
    createdByMemberId: creatorMemberId,
    status: 'active',
  };

  state.trips.push(trip);
  state.members.push(creator);
  saveDB();

  return trip;
}

export async function getTripByCode(code: string): Promise<{
  trip: Trip;
  members: Member[];
  expenses: Expense[];
  shares: ExpenseShare[];
} | null> {
  const normalizedCode = code.trim().toUpperCase();
  const trip = state.trips.find((t) => t.code === normalizedCode);
  if (!trip) return null;

  const members = state.members.filter((m) => m.tripId === trip.id);
  const expenses = state.expenses.filter((e) => e.tripId === trip.id);
  const expenseIds = expenses.map((e) => e.id);
  const shares = state.shares.filter((s) => expenseIds.includes(s.expenseId));

  return { trip, members, expenses, shares };
}

export async function getTripById(id: string): Promise<{
  trip: Trip;
  members: Member[];
  expenses: Expense[];
  shares: ExpenseShare[];
} | null> {
  const trip = state.trips.find((t) => t.id === id);
  if (!trip) return null;

  const members = state.members.filter((m) => m.tripId === trip.id);
  const expenses = state.expenses.filter((e) => e.tripId === trip.id);
  const expenseIds = expenses.map((e) => e.id);
  const shares = state.shares.filter((s) => expenseIds.includes(s.expenseId));

  return { trip, members, expenses, shares };
}

export async function addMember(tripId: string, name: string, upiId: string | null = null): Promise<Member> {
  const trip = state.trips.find((t) => t.id === tripId);
  if (!trip) throw new Error('Trip not found');

  let memberName = name.trim();
  if (!memberName) throw new Error('Member name cannot be empty');

  // Disambiguate name collision in the same trip
  const existingNames = state.members
    .filter((m) => m.tripId === tripId)
    .map((m) => m.name.toLowerCase());
  
  if (existingNames.includes(memberName.toLowerCase())) {
    let suffix = 2;
    while (existingNames.includes(`${memberName.toLowerCase()} ${suffix}`)) {
      suffix++;
    }
    memberName = `${memberName} ${suffix}`;
  }

  const member: Member = {
    id: crypto.randomUUID(),
    tripId,
    name: memberName,
    upiId: upiId ? upiId.trim() : null,
    joinedAt: new Date().toISOString(),
  };

  state.members.push(member);
  saveDB();

  return member;
}

export async function removeMember(tripId: string, memberId: string): Promise<void> {
  const trip = state.trips.find((t) => t.id === tripId);
  if (!trip) throw new Error('Trip not found');

  // Verify member balance is exactly zero before removing
  const tripData = await getTripById(tripId);
  if (tripData) {
    const balances = computeNetBalances(tripData.members, tripData.expenses, tripData.shares);
    const mBal = balances.find((b) => b.memberId === memberId);
    if (mBal && mBal.netBalancePaise !== 0) {
      throw new Error('Cannot remove member with a non-zero balance. Settle debts first.');
    }
  }

  state.members = state.members.filter((m) => !(m.tripId === tripId && m.id === memberId));
  // Clean up any stray shares
  state.shares = state.shares.filter((s) => s.memberId !== memberId);
  
  saveDB();
}

export async function updateMemberUpi(tripId: string, memberId: string, upiId: string | null): Promise<Member> {
  const member = state.members.find((m) => m.tripId === tripId && m.id === memberId);
  if (!member) throw new Error('Member not found in this trip');

  // Basic validation for UPI ID
  if (upiId && !/^[\w.\-]+@[\w]+$/.test(upiId.trim())) {
    throw new Error('Invalid UPI ID format (expected name@bank)');
  }

  member.upiId = upiId ? upiId.trim() : null;
  saveDB();

  return member;
}

export async function addExpense(
  tripId: string,
  expenseData: Omit<Expense, 'id' | 'tripId' | 'createdAt' | 'updatedAt'>,
  sharesData: Omit<ExpenseShare, 'id' | 'expenseId'>[]
): Promise<Expense> {
  const trip = state.trips.find((t) => t.id === tripId);
  if (!trip) throw new Error('Trip not found');

  // Validate expense amount
  if (expenseData.amountPaise <= 0) {
    throw new Error('Expense amount must be greater than zero');
  }

  // Validate custom split balance sums exactly to total
  const { isValid, differencePaise } = validateCustomSplit(expenseData.amountPaise, sharesData);
  if (!isValid) {
    throw new Error(`Split total does not match expense total. Difference: ${differencePaise / 100} Rupee(s)`);
  }

  const expenseId = crypto.randomUUID();
  const now = new Date().toISOString();

  const expense: Expense = {
    ...expenseData,
    id: expenseId,
    tripId,
    createdAt: now,
    updatedAt: now,
  };

  const shares: ExpenseShare[] = sharesData.map((share) => ({
    id: crypto.randomUUID(),
    expenseId,
    memberId: share.memberId,
    sharePaise: share.sharePaise,
  }));

  state.expenses.push(expense);
  state.shares.push(...shares);
  saveDB();

  return expense;
}

export async function updateExpense(
  tripId: string,
  expenseId: string,
  expenseUpdates: Partial<Omit<Expense, 'id' | 'tripId' | 'createdAt' | 'updatedAt'>>,
  sharesData: Omit<ExpenseShare, 'id' | 'expenseId'>[]
): Promise<Expense> {
  const expense = state.expenses.find((e) => e.tripId === tripId && e.id === expenseId);
  if (!expense) throw new Error('Expense not found');

  const newAmount = expenseUpdates.amountPaise !== undefined ? expenseUpdates.amountPaise : expense.amountPaise;
  
  if (newAmount <= 0) {
    throw new Error('Expense amount must be greater than zero');
  }

  // Validate custom split balance sums exactly to new/updated total
  const { isValid, differencePaise } = validateCustomSplit(newAmount, sharesData);
  if (!isValid) {
    throw new Error(`Split total does not match expense total. Difference: ${differencePaise / 100} Rupee(s)`);
  }

  const now = new Date().toISOString();

  // Apply updates
  Object.assign(expense, expenseUpdates);
  expense.updatedAt = now;

  // Replace existing shares
  state.shares = state.shares.filter((s) => s.expenseId !== expenseId);
  const newShares: ExpenseShare[] = sharesData.map((share) => ({
    id: crypto.randomUUID(),
    expenseId,
    memberId: share.memberId,
    sharePaise: share.sharePaise,
  }));
  state.shares.push(...newShares);

  saveDB();

  return expense;
}

export async function deleteExpense(tripId: string, expenseId: string): Promise<void> {
  const expense = state.expenses.find((e) => e.tripId === tripId && e.id === expenseId);
  if (!expense) throw new Error('Expense not found');

  state.expenses = state.expenses.filter((e) => !(e.tripId === tripId && e.id === expenseId));
  state.shares = state.shares.filter((s) => s.expenseId !== expenseId);
  saveDB();
}
