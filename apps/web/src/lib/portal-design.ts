import { BookOpen, GraduationCap, HeartHandshake, School, ShieldCheck } from 'lucide-react';
import type { Portal } from './navigation';

// Each portal keeps the same interaction patterns with its own visual identity.
export const portalDesign = {
  admin: { icon: ShieldCheck },
  school: { icon: School },
  teacher: { icon: BookOpen },
  parent: { icon: HeartHandshake },
  student: { icon: GraduationCap },
} satisfies Record<Portal, { icon: typeof School }>;
