import type { APIRoute } from 'astro';
import { addMember, getTripById, getTripByCode } from '../../../../lib/store';

export const POST: APIRoute = async ({ request, params }) => {
  try {
    const { id } = params;

    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Trip ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Resolve the true trip ID if code was passed instead of UUID
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
    const { name, upiId } = body;

    if (!name || !name.trim()) {
      return new Response(
        JSON.stringify({ error: 'Member name is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const member = await addMember(trueTripId, name, upiId);

    return new Response(
      JSON.stringify({ member }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || 'Internal Server Error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
