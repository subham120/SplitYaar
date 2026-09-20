import type { APIRoute } from 'astro';
import { addExpense } from '../../../../lib/store';
import { resolveTrip, jsonResponse, errorResponse, safeParseJson } from '../../../../lib/api-helpers';
import type { ExpenseCategory, SplitType, ExpenseShare } from '../../../../lib/types';

export const POST: APIRoute = async ({ request, params }) => {
  try {
    const { id } = params;

    if (!id) {
      return errorResponse('Trip ID is required', 400);
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
    if (!description || !description.trim()) {
      return errorResponse('Description is required', 400);
    }
    if (amountPaise === undefined || amountPaise <= 0) {
      return errorResponse('Expense amount must be greater than zero', 400);
    }
    if (!paidByMemberId) {
      return errorResponse('Payer ID is required', 400);
    }
    if (!category) {
      return errorResponse('Category is required', 400);
    }
    if (!splitType) {
      return errorResponse('Split type is required', 400);
    }
    if (!date) {
      return errorResponse('Date is required', 400);
    }
    if (!shares || !Array.isArray(shares) || shares.length === 0) {
      return errorResponse('Split shares are required', 400);
    }

    const expense = await addExpense(
      tripData.trip.id,
      { description: description.trim(), amountPaise, paidByMemberId, category, splitType, date },
      shares
    );

    return jsonResponse({ expense }, 201);
  } catch (error: any) {
    const isClientError = error.message.includes('Split total') || error.message.includes('greater than zero');
    const status = isClientError ? 400 : 500;
    return errorResponse(error.message || 'Internal Server Error', status);
  }
};
