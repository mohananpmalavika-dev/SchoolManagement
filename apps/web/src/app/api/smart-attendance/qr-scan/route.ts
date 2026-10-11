import { NextResponse } from 'next/server';
import { smartAttendanceApi } from '@/lib/smart-attendance-client';
import { ScanStudentQRRequest } from '@krypton/types';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ScanStudentQRRequest;
    const result = smartAttendanceApi.scanStudentQR(body);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'QR Scan failed' }, { status: 400 });
  }
}

export async function GET() {
  const scans = smartAttendanceApi.getStudentScans();
  return NextResponse.json({ scans });
}
