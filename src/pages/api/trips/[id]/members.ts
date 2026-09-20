import type { APIRoute } from 'astro';
import { addMember } from '../../../../lib/store';
import { resolveTrip, jsonResponse, errorResponse, safeParseJson } from '../../../../lib/api-helpers';

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

    const { data, error: parseError } = await safeParseJson<{ name?: string; upiId?: string | null }>(request);
    if (parseError || !data) {
      return errorResponse(parseError || 'Invalid request body', 400);
    }

    const { name, upiId } = data;

    if (!name || !name.trim()) {
      return errorResponse('Member name is required', 400);
    }

    const member = await addMember(tripData.trip.id, name, upiId);
    return jsonResponse({ member }, 201);
  } catch (error: any) {
    return errorResponse(error.message || 'Internal Server Error', 500);
  }
};
