import { NextRequest, NextResponse } from 'next/server';
import { admissionsClient } from '@/lib/admissions-client';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updated = admissionsClient.recordFeePayment(id, body, body.actor);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Application not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Admission fee payment recorded successfully',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to record payment' },
      { status: 400 }
    );
  }
}
