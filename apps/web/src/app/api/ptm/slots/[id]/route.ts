import { NextResponse } from 'next/server';
import { VirtualPTMService } from '@/lib/virtual-ptm-client';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    let slot = VirtualPTMService.getSlotById(id);
    if (!slot) {
      slot = VirtualPTMService.getSlotByCode(id);
    }

    if (!slot) {
      return NextResponse.json({ success: false, error: 'Slot not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, slot });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const updated = VirtualPTMService.updateSlot(id, body);
    return NextResponse.json({ success: true, slot: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cancelled = VirtualPTMService.cancelSlot(id);
    return NextResponse.json({ success: true, slot: cancelled });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
