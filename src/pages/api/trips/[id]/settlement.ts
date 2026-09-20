import type { APIRoute } from 'astro';
import { resolveTrip, jsonResponse, errorResponse } from '../../../../lib/api-helpers';
import { computeNetBalances, simplifyDebts } from '../../../../lib/settlement';

export const GET: APIRoute = async ({ params }) => {
  try {
    const { id } = params;

    if (!id) {
      return errorResponse('Trip ID is required', 400);
    }

    const tripData = await resolveTrip(id);
    if (!tripData) {
      return errorResponse('Trip not found', 404);
    }

    const { members, expenses, shares } = tripData;
    const netBalances = computeNetBalances(members, expenses, shares);
    const transactions = simplifyDebts(netBalances);

    return jsonResponse({ transactions }, 200);
  } catch (error: any) {
    return errorResponse(error.message || 'Internal Server Error', 500);
  }
};
