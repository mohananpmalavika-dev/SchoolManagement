import { NextResponse } from 'next/server';
import { smartAttendanceApi } from '@/lib/smart-attendance-client';
import { ReviewAbsenceRequestDto } from '@krypton/types';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ReviewAbsenceRequestDto;
    const application = smartAttendanceApi.reviewAbsenceApplication(body);
    return NextResponse.json(application);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Review failed' }, { status: 400 });
  }
}
