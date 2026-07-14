import type { APIRoute } from 'astro';
import { removeMember, getTripById, getTripByCode } from '../../../../../lib/store';

export const DELETE: APIRoute = async ({ params }) => {
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

    await removeMember(trueTripId, memberId);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    // Set status to 400 for balance validation issues, otherwise 500
    const status = error.message.includes('non-zero balance') ? 400 : 500;
    return new Response(
      JSON.stringify({ error: error.message || 'Internal Server Error' }),
      { status, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
