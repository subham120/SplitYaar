import type { APIRoute } from 'astro';
import { updateMemberUpi, getTripById, getTripByCode } from '../../../../../../lib/store';

export const POST: APIRoute = async ({ request, params }) => {
  try {
    const { id, memberId } = params;

    if (!id || !memberId) {
      return new Response(
        JSON.stringify({ error: 'Trip ID and Member ID are required' }),
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
    const { upiId } = body;

    const member = await updateMemberUpi(trueTripId, memberId, upiId);

    return new Response(
      JSON.stringify({ member }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    const status = error.message.includes('Invalid UPI ID') ? 400 : 500;
    return new Response(
      JSON.stringify({ error: error.message || 'Internal Server Error' }),
      { status, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
