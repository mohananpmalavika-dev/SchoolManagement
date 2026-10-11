import { NextResponse } from 'next/server';
import { VirtualPTMService } from '@/lib/virtual-ptm-client';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { teacherId, teacherName, teacherSubject, grade, date, startTime, endTime, slotDurationMinutes, bufferMinutes } = body;

    if (!teacherId || !grade || !date || !startTime || !endTime) {
      return NextResponse.json({ success: false, error: 'Missing batch parameters' }, { status: 400 });
    }

    const createdSlots = VirtualPTMService.generateBatchSlots({
      teacherId,
      teacherName: teacherName || 'Teacher',
      teacherSubject: teacherSubject || 'General',
      grade,
      date,
      startTime,
      endTime,
      slotDurationMinutes: Number(slotDurationMinutes) || 15,
      bufferMinutes: Number(bufferMinutes) || 5,
    });

    return NextResponse.json({ success: true, count: createdSlots.length, slots: createdSlots }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
