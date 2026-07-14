import type { APIRoute } from 'astro';
import { updateExpense, deleteExpense, getTripById, getTripByCode } from '../../../../../lib/store';

export const PUT: APIRoute = async ({ request, params }) => {
  try {
    const { id, expenseId } = params;

    if (!id || !expenseId) {
      return new Response(
        JSON.stringify({ error: 'Trip ID and Expense ID are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Resolve true trip ID
    let tripData = await getTripById(id);
    if (!tripData) {
      tripData = await getTripByCode(id);
    }

    if (!tripData) {
      return new Response(
        JSON.stringify({ error: 'Trip not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const trueTripId = tripData.trip.id;
    const body = await request.json();
    
    const {
      description,
      amountPaise,
      paidByMemberId,
      category,
      splitType,
      date,
      shares,
    } = body;

    // Validation
    if (amountPaise !== undefined && amountPaise <= 0) {
      return new Response(
        JSON.stringify({ error: 'Expense amount must be greater than zero' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    if (!shares || !Array.isArray(shares) || shares.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Split shares are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const expense = await updateExpense(
      trueTripId,
      expenseId,
      { description, amountPaise, paidByMemberId, category, splitType, date },
      shares
    );

    return new Response(
      JSON.stringify({ expense }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    const status = error.message.includes('Split total does not match') ? 400 : 500;
    return new Response(
      JSON.stringify({ error: error.message || 'Internal Server Error' }),
      { status, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const DELETE: APIRoute = async ({ params }) => {
  try {
    const { id, expenseId } = params;

    if (!id || !expenseId) {
      return new Response(
        JSON.stringify({ error: 'Trip ID and Expense ID are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Resolve true trip ID
    let tripData = await getTripById(id);
    if (!tripData) {
      tripData = await getTripByCode(id);
    }

    if (!tripData) {
      return new Response(
        JSON.stringify({ error: 'Trip not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const trueTripId = tripData.trip.id;

    await deleteExpense(trueTripId, expenseId);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || 'Internal Server Error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
