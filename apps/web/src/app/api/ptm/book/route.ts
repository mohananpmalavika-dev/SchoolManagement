import { NextResponse } from 'next/server';
import { VirtualPTMService } from '@/lib/virtual-ptm-client';
import { PTMBookSlotRequest } from '@krypton/types';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as PTMBookSlotRequest;
    if (!body.slotId || !body.studentId || !body.parentId || !body.parentPhone) {
      return NextResponse.json({ success: false, error: 'Missing booking details' }, { status: 400 });
    }

    const bookedSlot = VirtualPTMService.bookSlot(body);
    return NextResponse.json({ success: true, slot: bookedSlot });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Booking failed' }, { status: 400 });
  }
}
