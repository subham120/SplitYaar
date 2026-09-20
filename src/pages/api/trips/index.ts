import type { APIRoute } from 'astro';
import { createTrip } from '../../../lib/store';
import { jsonResponse, errorResponse, safeParseJson } from '../../../lib/api-helpers';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { data, error: parseError } = await safeParseJson<{ name?: string; creatorName?: string }>(request);
    if (parseError || !data) {
      return errorResponse(parseError || 'Invalid request body', 400);
    }

    const { name, creatorName } = data;

    if (!name || !name.trim()) {
      return errorResponse('Trip name is required', 400);
    }

    if (!creatorName || !creatorName.trim()) {
      return errorResponse('Creator name is required', 400);
    }

    const trip = await createTrip(name, creatorName);
    return jsonResponse({ trip }, 201);
  } catch (error: any) {
    return errorResponse(error.message || 'Internal Server Error', 500);
  }
};
