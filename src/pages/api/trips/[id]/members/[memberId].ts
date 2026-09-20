import type { APIRoute } from 'astro';
import { removeMember } from '../../../../../lib/store';
import { resolveTrip, jsonResponse, errorResponse } from '../../../../../lib/api-helpers';

export const DELETE: APIRoute = async ({ params }) => {
  try {
    const { id, memberId } = params;

    if (!id || !memberId) {
      return errorResponse('Trip ID and Member ID are required', 400);
    }

    const tripData = await resolveTrip(id);
    if (!tripData) {
      return errorResponse('Trip not found', 404);
    }

    await removeMember(tripData.trip.id, memberId);
    return jsonResponse({ success: true }, 200);
  } catch (error: any) {
    const isClientError =
      error.message.includes('non-zero balance') ||
      error.message.includes('creator') ||
      error.message.includes('paid for expenses') ||
      error.message.includes('recorded expenses');
    const status = isClientError ? 400 : 500;
    return errorResponse(error.message || 'Internal Server Error', status);
  }
};
