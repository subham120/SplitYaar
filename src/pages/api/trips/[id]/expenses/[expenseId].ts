import type { APIRoute } from 'astro';
import { updateExpense, deleteExpense } from '../../../../../lib/store';
import { resolveTrip, jsonResponse, errorResponse, safeParseJson } from '../../../../../lib/api-helpers';
import type { ExpenseCategory, SplitType, ExpenseShare } from '../../../../../lib/types';

export const PUT: APIRoute = async ({ request, params }) => {
  try {
    const { id, expenseId } = params;

    if (!id || !expenseId) {
      return errorResponse('Trip ID and Expense ID are required', 400);
    }

    const tripData = await resolveTrip(id);
    if (!tripData) {
      return errorResponse('Trip not found', 404);
    }

    const { data, error: parseError } = await safeParseJson<{
      description?: string;
      amountPaise?: number;
      paidByMemberId?: string;
      category?: ExpenseCategory;
      splitType?: SplitType;
      date?: string;
      shares?: Omit<ExpenseShare, 'id' | 'expenseId'>[];
    }>(request);

    if (parseError || !data) {
      return errorResponse(parseError || 'Invalid request body', 400);
    }

    const {
      description,
      amountPaise,
      paidByMemberId,
      category,
      splitType,
      date,
      shares,
    } = data;

    // Validation
    if (amountPaise !== undefined && amountPaise <= 0) {
      return errorResponse('Expense amount must be greater than zero', 400);
    }
    if (!shares || !Array.isArray(shares) || shares.length === 0) {
      return errorResponse('Split shares are required', 400);
    }

    const expense = await updateExpense(
      tripData.trip.id,
      expenseId,
      { description, amountPaise, paidByMemberId, category, splitType, date },
      shares
    );

    return jsonResponse({ expense }, 200);
  } catch (error: any) {
    const isClientError = error.message.includes('Split total') || error.message.includes('Expense not found');
    const status = isClientError ? 400 : 500;
    return errorResponse(error.message || 'Internal Server Error', status);
  }
};

export const DELETE: APIRoute = async ({ params }) => {
  try {
    const { id, expenseId } = params;

    if (!id || !expenseId) {
      return errorResponse('Trip ID and Expense ID are required', 400);
    }

    const tripData = await resolveTrip(id);
    if (!tripData) {
      return errorResponse('Trip not found', 404);
    }

    await deleteExpense(tripData.trip.id, expenseId);
    return jsonResponse({ success: true }, 200);
  } catch (error: any) {
    const isClientError = error.message.includes('Expense not found');
    const status = isClientError ? 404 : 500;
    return errorResponse(error.message || 'Internal Server Error', status);
  }
};
