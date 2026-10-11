import { NextResponse } from 'next/server';
import { transportApi } from '@/lib/transport-client';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const updated = await transportApi.sendLocationPing(body);
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 400 });
  }
}
