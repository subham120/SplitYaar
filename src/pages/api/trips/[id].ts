import type { APIRoute } from 'astro';
import { getTripById, getTripByCode } from '../../../lib/store';
import { computeNetBalances } from '../../../lib/settlement';

export const GET: APIRoute = async ({ params }) => {
  try {
    const { id } = params;

    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Trip ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Attempt lookup by ID (UUID) first, then fallback to short shareable code
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

    const { trip, members, expenses, shares } = tripData;
    const netBalances = computeNetBalances(members, expenses, shares);

    return new Response(
      JSON.stringify({
        trip,
        members,
        expenses,
        shares,
        netBalances,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || 'Internal Server Error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
