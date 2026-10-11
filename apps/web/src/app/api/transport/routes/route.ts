import { NextResponse } from 'next/server';
import { DEFAULT_TRANSPORT_ROUTES } from '@/lib/transport-client';

export async function GET() {
  return NextResponse.json(DEFAULT_TRANSPORT_ROUTES);
}
