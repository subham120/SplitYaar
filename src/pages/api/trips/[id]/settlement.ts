import type { APIRoute } from 'astro';
import { resolveTrip, jsonResponse, errorResponse, safeParseJson } from '../../../../lib/api-helpers';
import { computeNetBalances, simplifyDebts } from '../../../../lib/settlement';
import { addSettlement } from '../../../../lib/store';

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

    const { members, expenses, shares, settlements } = tripData;
    const netBalances = computeNetBalances(members, expenses, shares, settlements);
    const transactions = simplifyDebts(netBalances);

    return jsonResponse({ transactions }, 200);
  } catch (error: any) {
    return errorResponse(error.message || 'Internal Server Error', 500);
  }
};

export const POST: APIRoute = async ({ params, request }) => {
  try {
    const { id } = params;

    if (!id) {
      return errorResponse('Trip ID is required', 400);
    }

    const tripData = await resolveTrip(id);
    if (!tripData) {
      return errorResponse('Trip not found', 404);
    }

    const { data, error: parseError } = await safeParseJson<{
      fromMemberId?: string;
      toMemberId?: string;
      amountPaise?: number;
      recordedByMemberId?: string;
      date?: string;
    }>(request);

    if (parseError || !data) {
      return errorResponse(parseError || 'Invalid request body', 400);
    }

    const { fromMemberId, toMemberId, amountPaise, recordedByMemberId, date } = data;

    if (!fromMemberId || !toMemberId || !amountPaise || amountPaise <= 0) {
      return errorResponse('fromMemberId, toMemberId and positive amountPaise are required', 400);
    }

    const fromMember = tripData.members.find((m) => m.id === fromMemberId);
    const toMember = tripData.members.find((m) => m.id === toMemberId);

    if (!fromMember || !toMember) {
      return errorResponse('Debtor or creditor member not found in this trip', 400);
    }

    // Authenticity Check (Receiver-Only):
    // Only the receiver (toMemberId) who actually gets the money (or the trip admin/creator)
    // is authorized to confirm and record that the payment was received.
    if (recordedByMemberId) {
      const isReceiver = recordedByMemberId === toMemberId;
      const isTripCreator = recordedByMemberId === tripData.trip.createdByMemberId;
      if (!isReceiver && !isTripCreator) {
        return errorResponse(
          `Only ${toMember.name} (the recipient) can confirm and record this settlement.`,
          403
        );
      }
    }

    const today = date || new Date().toISOString().slice(0, 10);

    const settlement = await addSettlement(
      tripData.trip.id,
      fromMemberId,
      toMemberId,
      amountPaise,
      today
    );

    return jsonResponse({ success: true, settlement }, 201);
  } catch (error: any) {
    return errorResponse(error.message || 'Internal Server Error', 500);
  }
};

