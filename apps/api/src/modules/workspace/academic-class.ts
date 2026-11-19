import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@krypton/database';

const stages: Record<string, string> = { PLAYGROUP: 'Playgroup', NURSERY: 'Nursery', LKG: 'LKG', UKG: 'UKG' };
export async function prepareAcademicClass(db: Prisma.TransactionClient, tenantId: string, data: Record<string, any>, id?: string) {
  const existing = id ? await db.class.findFirst({ where: { id, tenantId } }) : null;
  if (id && !existing) throw new NotFoundException('Class not found');
  const school = await db.school.findFirst({ where: { id: data.schoolId || existing?.schoolId, tenantId, isActive: true }, select: { programme: true } });
  if (!school) throw new BadRequestException('Selected campus is unavailable');
  const educationLevel = data.educationLevel || existing?.educationLevel;
  const stage = data.preschoolStage === undefined ? existing?.preschoolStage : data.preschoolStage;
  if (school.programme === 'PRESCHOOL' && educationLevel !== 'PRE_PRIMARY') throw new BadRequestException('Preschool campuses can only have pre-primary classes');
  if (stage && educationLevel !== 'PRE_PRIMARY') throw new BadRequestException('Preschool stages require the pre-primary education level');
  if (educationLevel === 'PRE_PRIMARY' && school.programme !== 'STANDARD' && !stage && (!id || data.educationLevel !== undefined || data.schoolId !== undefined)) throw new BadRequestException('Choose Playgroup, Nursery, LKG or UKG for this preschool class');
  if (stage && data.preschoolStage !== undefined) data.level = stages[stage];
}
