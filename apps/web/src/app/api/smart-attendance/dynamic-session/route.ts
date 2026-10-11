import { NextResponse } from 'next/server';
import { smartAttendanceApi } from '@/lib/smart-attendance-client';

export async function GET() {
  const session = smartAttendanceApi.getProjectorSession();
  return NextResponse.json(session);
}

export async function POST() {
  const fresh = smartAttendanceApi.refreshProjectorCode();
  return NextResponse.json(fresh);
}
