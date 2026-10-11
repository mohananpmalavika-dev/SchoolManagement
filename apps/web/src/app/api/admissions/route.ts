import { NextRequest, NextResponse } from 'next/server';
import { admissionsClient } from '@/lib/admissions-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const stage = (searchParams.get('stage') as any) || undefined;
    const grade = searchParams.get('grade') || undefined;
    const priority = searchParams.get('priority') || undefined;
    const source = searchParams.get('source') || undefined;

    const applications = admissionsClient.getApplications({
      search,
      stage,
      grade,
      priority,
      source,
    });

    const stats = admissionsClient.getFunnelStats();

    return NextResponse.json({
      success: true,
      data: {
        applications,
        stats,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch admissions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const created = admissionsClient.createApplication(body);

    return NextResponse.json({
      success: true,
      data: created,
      message: 'Admission application created successfully',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to submit admission application' },
      { status: 400 }
    );
  }
}
