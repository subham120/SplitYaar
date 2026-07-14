import type { APIRoute } from 'astro';
import { addExpense, getTripById, getTripByCode } from '../../../../lib/store';

export const POST: APIRoute = async ({ request, params }) => {
  try {
    const { id } = params;

    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Trip ID is required' }),
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
    if (!description || !description.trim()) {
      return new Response(
        JSON.stringify({ error: 'Description is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    if (amountPaise === undefined || amountPaise <= 0) {
      return new Response(
        JSON.stringify({ error: 'Expense amount must be greater than zero' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    if (!paidByMemberId) {
      return new Response(
        JSON.stringify({ error: 'Payer ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    if (!category) {
      return new Response(
        JSON.stringify({ error: 'Category is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    if (!splitType) {
      return new Response(
        JSON.stringify({ error: 'Split type is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    if (!date) {
      return new Response(
        JSON.stringify({ error: 'Date is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    if (!shares || !Array.isArray(shares) || shares.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Split shares are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const expense = await addExpense(
      trueTripId,
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
