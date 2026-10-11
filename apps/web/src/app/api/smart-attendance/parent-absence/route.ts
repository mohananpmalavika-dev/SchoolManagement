import { NextResponse } from 'next/server';
import { smartAttendanceApi } from '@/lib/smart-attendance-client';
import { SubmitAbsenceRequestDto } from '@krypton/types';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || undefined;
  const applications = smartAttendanceApi.getLeaveApplications(status);
  return NextResponse.json({ applications });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SubmitAbsenceRequestDto;
    const application = smartAttendanceApi.submitAbsenceApplication(body);
    return NextResponse.json(application, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Submission failed' }, { status: 400 });
  }
}
