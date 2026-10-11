import { NextResponse } from 'next/server';
import { VirtualPTMService } from '@/lib/virtual-ptm-client';

export async function POST(request: Request) {
  try {
    const { slotId, recipientPhone, recipientName } = await request.json();

    const slot = VirtualPTMService.getSlotById(slotId);
    if (!slot) {
      return NextResponse.json({ success: false, error: 'Slot not found' }, { status: 404 });
    }

    const meetingLink = `https://school.krypton.ke/ptm/room/${slot.meetingCode}`;
    const textMessage = `*Krypton School ERP - Official PTM Invitation*\n\n` +
      `Dear ${recipientName || slot.parentName || 'Parent'},\n` +
      `Your Virtual Parent-Teacher Meeting with *${slot.teacherName}* is confirmed.\n\n` +
      `🗓 *Date:* ${slot.date}\n` +
      `⏰ *Time:* ${slot.startTime} - ${slot.endTime} (EAT)\n` +
      `🎓 *Student:* ${slot.studentName || 'Student'} (${slot.grade})\n` +
      `🔗 *Meeting Link:* ${meetingLink}\n` +
      `🔑 *Meeting ID:* ${slot.meetingCode}\n` +
      `🔒 *Passcode:* ${slot.meetingPin}\n\n` +
      `_Please join 3 minutes before your slot. You will enter the virtual waiting room until the teacher admits you._`;

    // Simulated cloud messaging response
    return NextResponse.json({
      success: true,
      delivered: true,
      messageId: `wamid_${Date.now()}_ptm`,
      phone: recipientPhone || slot.parentPhone,
      messagePreview: textMessage,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
