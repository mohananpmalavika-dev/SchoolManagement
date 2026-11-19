import type { EducationLevel } from '@krypton/database';

export function schoolEducationLevels(programme: string, current: EducationLevel[] = []): EducationLevel[] {
  if (programme === 'PRESCHOOL') return ['PRE_PRIMARY'];
  const regular = current.filter(level => level !== 'PRE_PRIMARY');
  const levels: EducationLevel[] = regular.length ? regular : ['PRIMARY'];
  return programme === 'COMBINED' ? ['PRE_PRIMARY', ...new Set(levels)] : [...new Set(levels)];
}
