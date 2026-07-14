import type { APIRoute } from 'astro';
import { createTrip } from '../../../lib/store';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { name, creatorName } = body;

    if (!name || !name.trim()) {
      return new Response(
        JSON.stringify({ error: 'Trip name is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!creatorName || !creatorName.trim()) {
      return new Response(
        JSON.stringify({ error: 'Creator name is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const trip = await createTrip(name, creatorName);

    return new Response(
      JSON.stringify({ trip }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || 'Internal Server Error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
