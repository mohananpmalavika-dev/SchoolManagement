import { NextResponse } from 'next/server';
import { VirtualPTMService } from '@/lib/virtual-ptm-client';
import { PTMCreateSlotRequest, PTMScheduleFilter } from '@krypton/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filter: PTMScheduleFilter = {
      date: searchParams.get('date') || undefined,
      grade: searchParams.get('grade') || undefined,
      status: (searchParams.get('status') as any) || undefined,
      teacherId: searchParams.get('teacherId') || undefined,
      search: searchParams.get('search') || undefined,
    };

    const slots = VirtualPTMService.getSlots(filter);
    return NextResponse.json({ success: true, slots });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch slots' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as PTMCreateSlotRequest;
    if (!body.title || !body.date || !body.startTime || !body.endTime || !body.teacherId) {
      return NextResponse.json({ success: false, error: 'Missing required slot fields' }, { status: 400 });
    }

    const newSlot = VirtualPTMService.createSlot(body);
    return NextResponse.json({ success: true, slot: newSlot }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to create slot' }, { status: 400 });
  }
}
