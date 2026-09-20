import { getTripByCode, getTripById } from './store';
import type { Trip, Member, Expense, ExpenseShare } from './types';

export interface TripData {
  trip: Trip;
  members: Member[];
  expenses: Expense[];
  shares: ExpenseShare[];
}

/**
 * Intelligently resolves a trip by either short code or UUID without unnecessary double lookups.
 */
export async function resolveTrip(idOrCode: string): Promise<TripData | null> {
  const trimmed = idOrCode.trim();
  if (!trimmed) return null;

  // If standard 8-character code, check by code first
  if (/^[A-Za-z0-9]{8}$/.test(trimmed)) {
    const byCode = await getTripByCode(trimmed);
    if (byCode) return byCode;
    return getTripById(trimmed);
  }

  // Otherwise check by ID first, fallback to code
  const byId = await getTripById(trimmed);
  if (byId) return byId;
  return getTripByCode(trimmed);
}

/**
 * Standard JSON Response builder
 */
export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Standard JSON Error Response builder
 */
export function errorResponse(error: string, status = 400): Response {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Safely parse JSON request body with robust error capture.
 */
export async function safeParseJson<T>(request: Request): Promise<{ data: T | null; error: string | null }> {
  try {
    const data = await request.json();
    return { data: data as T, error: null };
  } catch {
    return { data: null, error: 'Invalid or missing JSON request body' };
  }
}
