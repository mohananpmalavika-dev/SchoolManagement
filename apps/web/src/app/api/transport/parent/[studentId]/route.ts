import { NextResponse } from 'next/server';
import { transportApi } from '@/lib/transport-client';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ studentId: string }> }
) {
  const { studentId } = await params;
  const view = await transportApi.getParentTracking(studentId);
  return NextResponse.json(view);
}
