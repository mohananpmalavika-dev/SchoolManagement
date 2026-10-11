import { NextResponse } from 'next/server';
import { smartSubstitutionApi } from '@/lib/substitution-client';
import { AssignProxyRequestDto } from '@krypton/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || undefined;
    const teacherId = searchParams.get('teacherId') || undefined;

    const assignments = smartSubstitutionApi.getAssignments(date, teacherId);
    const notifications = smartSubstitutionApi.getNotificationLogs(teacherId);

    return NextResponse.json({
      success: true,
      data: {
        assignments,
        notifications,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch assignments' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AssignProxyRequestDto;
    const assignment = smartSubstitutionApi.assignProxy(body);

    return NextResponse.json({
      success: true,
      message: `Proxy assigned to ${assignment.substituteTeacherName} for ${assignment.className} - ${assignment.periodName}. Instant notification sent.`,
      data: assignment,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to assign proxy' },
      { status: 400 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { assignmentId, action, remarks } = body;

    if (!assignmentId) {
      return NextResponse.json({ success: false, error: 'assignmentId is required' }, { status: 400 });
    }

    if (action === 'ACKNOWLEDGE') {
      const updated = smartSubstitutionApi.acknowledgeAssignment(assignmentId, remarks);
      return NextResponse.json({
        success: true,
        message: 'Substitution duty acknowledged successfully',
        data: updated,
      });
    }

    if (action === 'COMPLETE') {
      const updated = smartSubstitutionApi.completeAssignment(assignmentId, remarks);
      return NextResponse.json({
        success: true,
        message: 'Substitution marked as completed',
        data: updated,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action. Expected ACKNOWLEDGE or COMPLETE' },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update assignment status' },
      { status: 500 }
    );
  }
}
