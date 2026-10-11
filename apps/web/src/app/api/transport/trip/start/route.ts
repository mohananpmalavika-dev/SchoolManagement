import { NextResponse } from 'next/server';
import { transportApi } from '@/lib/transport-client';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const trip = await transportApi.startTrip(body);
    return NextResponse.json(trip);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 400 });
  }
}
