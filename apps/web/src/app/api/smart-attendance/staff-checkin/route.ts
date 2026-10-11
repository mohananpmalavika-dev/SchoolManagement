import { NextResponse } from 'next/server';
import { smartAttendanceApi } from '@/lib/smart-attendance-client';
import { StaffCheckInRequest } from '@krypton/types';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as StaffCheckInRequest;
    const result = smartAttendanceApi.checkInStaff(body);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Check-in failed' }, { status: 400 });
  }
}

export async function GET() {
  const records = smartAttendanceApi.getStaffRecords();
  return NextResponse.json({
    config: smartAttendanceApi.getGeofenceConfig(),
    records,
    staff: smartAttendanceApi.getAllStaff(),
  });
}
