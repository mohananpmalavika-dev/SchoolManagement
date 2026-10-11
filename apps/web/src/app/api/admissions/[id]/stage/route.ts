import { NextRequest, NextResponse } from 'next/server';
import { admissionsClient } from '@/lib/admissions-client';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { stage, actor, note } = await request.json();

    const updated = admissionsClient.updateStage(id, stage, actor, note);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Application not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Stage updated to ${stage}`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update stage' },
      { status: 400 }
    );
  }
}
