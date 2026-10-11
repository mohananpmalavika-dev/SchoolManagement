import { NextResponse } from 'next/server';
import { getInitialActiveTrip } from '@/lib/transport-client';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ routeId: string }> }
) {
  const { routeId } = await params;
  const trip = getInitialActiveTrip(routeId);
  return NextResponse.json(trip);
}
