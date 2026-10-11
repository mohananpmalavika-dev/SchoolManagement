import { NextRequest, NextResponse } from 'next/server';
import { admissionsClient } from '@/lib/admissions-client';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const application = admissionsClient.getApplicationById(id);

    if (!application) {
      return NextResponse.json(
        { success: false, error: 'Admission application not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: application,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Server error' },
      { status: 500 }
    );
  }
}
