import { NextResponse } from 'next/server';
import { smartSubstitutionApi } from '@/lib/substitution-client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || undefined;

    const vacantPeriods = smartSubstitutionApi.getVacantPeriods(date);
    const summary = smartSubstitutionApi.getDailySummary(date);
    const absentTeachers = smartSubstitutionApi.getAbsentTeachers(date);

    return NextResponse.json({
      success: true,
      data: {
        summary,
        absentTeachers,
        vacantPeriods,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch substitution engine state' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Mode 1: Auto-assign all vacant periods
    if (body.action === 'AUTO_ASSIGN_ALL') {
      const result = smartSubstitutionApi.autoAssignAllProxies(body.date);
      return NextResponse.json({
        success: true,
        message: `Successfully auto-assigned ${result.newAssignmentsCount} proxy periods with instant notifications.`,
        data: result,
      });
    }

    // Mode 2: Get recommended candidates for a specific period
    if (body.action === 'GET_CANDIDATES' && body.period) {
      const candidates = smartSubstitutionApi.getRecommendedCandidates(body.period, body.date);
      return NextResponse.json({
        success: true,
        data: candidates,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action. Expected AUTO_ASSIGN_ALL or GET_CANDIDATES' },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process substitution engine request' },
      { status: 500 }
    );
  }
}
