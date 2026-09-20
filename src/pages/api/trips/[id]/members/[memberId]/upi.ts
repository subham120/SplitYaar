import type { APIRoute } from 'astro';
import { updateMemberUpi } from '../../../../../../lib/store';
import { resolveTrip, jsonResponse, errorResponse, safeParseJson } from '../../../../../../lib/api-helpers';

export const POST: APIRoute = async ({ request, params }) => {
  try {
    const { id, memberId } = params;

    if (!id || !memberId) {
      return errorResponse('Trip ID and Member ID are required', 400);
    }

    const tripData = await resolveTrip(id);
    if (!tripData) {
      return errorResponse('Trip not found', 404);
    }

    const { data, error: parseError } = await safeParseJson<{ upiId?: string | null }>(request);
    if (parseError || !data) {
      return errorResponse(parseError || 'Invalid request body', 400);
    }

    const { upiId } = data;
    const member = await updateMemberUpi(tripData.trip.id, memberId, upiId ?? null);

    return jsonResponse({ member }, 200);
  } catch (error: any) {
    const status = error.message.includes('Invalid UPI ID') ? 400 : 500;
    return errorResponse(error.message || 'Internal Server Error', status);
  }
};
