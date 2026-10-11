import { NextResponse } from 'next/server';
import { smartSubstitutionApi } from '@/lib/substitution-client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || undefined;

    const allTeachers = smartSubstitutionApi.getAllTeachers();
    const absentTeachers = smartSubstitutionApi.getAbsentTeachers(date);
    const absentIds = new Set(absentTeachers.map((a) => a.teacherId));

    const teachersWithStatus = allTeachers.map((teacher) => {
      const schedule = smartSubstitutionApi.getTeacherRegularSchedule(teacher.id);
      const isAbsent = absentIds.has(teacher.id);
      const absentInfo = absentTeachers.find((a) => a.teacherId === teacher.id);

      return {
        ...teacher,
        isAbsent,
        absentReason: absentInfo?.absenceReason,
        periodsCountToday: schedule.length,
        schedule,
      };
    });

    return NextResponse.json({
      success: true,
      data: teachersWithStatus,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch teachers' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { teacherId, reason, date } = body;

    if (!teacherId || !reason) {
      return NextResponse.json(
        { success: false, error: 'teacherId and reason are required' },
        { status: 400 }
      );
    }

    const absentSchedule = smartSubstitutionApi.reportTeacherAbsence(teacherId, reason, date);

    return NextResponse.json({
      success: true,
      message: `Teacher reported absent. ${absentSchedule.totalPeriodsToCover} periods registered for substitution.`,
      data: absentSchedule,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to report teacher absence' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');
    const date = searchParams.get('date') || undefined;

    if (!teacherId) {
      return NextResponse.json(
        { success: false, error: 'teacherId is required' },
        { status: 400 }
      );
    }

    smartSubstitutionApi.cancelTeacherAbsence(teacherId, date);

    return NextResponse.json({
      success: true,
      message: 'Teacher absence cancelled and reverted to present.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to cancel absence' },
      { status: 500 }
    );
  }
}
