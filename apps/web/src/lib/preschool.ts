export const preschoolManagers = ['SCHOOL_OWNER', 'PRINCIPAL', 'DEPUTY_PRINCIPAL', 'SCHOOL_ADMIN'];
export const kinds = [
  'LESSON_PLAN',
  'ACTIVITY',
  'STORY',
  'RHYME',
  'FLASHCARDS',
  'COLOURING',
  'WORKSHEET',
  'GAME',
  'OBSERVATION_SHEET',
] as const;
export const developmentDomains = [
  'LANGUAGE',
  'COGNITIVE',
  'FINE_MOTOR',
  'GROSS_MOTOR',
  'SOCIAL_EMOTIONAL',
  'SELF_CARE',
  'CREATIVE',
] as const;
export const friendly = (value: string) =>
  value
    .toLowerCase()
    .replaceAll('_', ' ')
    .replace(/^./, (c) => c.toUpperCase());
export interface PreschoolClass {
  id: string;
  name: string;
  schoolId: string;
  educationLevel: string;
  preschoolStage: string | null;
  school: { programme: string };
}
export interface PreschoolOptions {
  today: string;
  timezone: string;
  schools: { id: string; name: string; programme: string }[];
  classes: PreschoolClass[];
  staff: { id: string; firstName: string; lastName: string }[];
  assignments: { classId: string; staffId: string }[];
  students: { id: string; firstName: string; lastName: string; currentClassId: string }[];
}
export interface PreschoolDay {
  id: string;
  date: string;
  checkInAt: string | null;
  checkOutAt: string | null;
  meals?: string;
  sleepMinutes?: number;
  toileting?: string;
  mood?: string;
  notes?: string;
  sharedAt: string | null;
  version: number;
}
export interface PreschoolChild {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  guardianLinks: {
    guardianId: string;
    canPickup?: boolean;
    relationship: string;
    guardian: { firstName: string; lastName: string };
  }[];
  day: PreschoolDay | null;
}
export interface PreschoolContent {
  id: string;
  classId: string;
  kind: string;
  title: string;
  theme: string;
  language: string;
  ageMinMonths: number;
  ageMaxMonths: number;
  durationMinutes: number;
  body: string;
  materials: string;
  learningGoals: string;
  scheduledOn: string | null;
  status: string;
  version: number;
  source?: string;
}
export interface PreschoolObservation {
  id: string;
  domain: string;
  skill: string;
  level: string;
  observation: string;
  observedOn: string;
  shared: boolean;
}
export interface PreschoolChildView {
  student: { id: string; firstName: string; lastName: string; className: string };
  days: PreschoolDay[];
  observations: PreschoolObservation[];
  hasMoreObservations: boolean;
  activities: {
    id: string;
    title: string;
    description: string;
    createdAt: string;
    activityType: string;
  }[];
  content: PreschoolContent[];
}
export interface PreschoolCamera {
  id: string;
  classId: string;
  label: string;
  externalCameraRef?: string;
  enabled?: boolean;
  parentAccess?: boolean;
  weekdays: number[];
  startMinute: number;
  endMinute: number;
  available?: boolean;
}
export type PreschoolAction = (
  path: string,
  data?: unknown,
  method?: 'post' | 'patch'
) => Promise<boolean>;
export const emptyPreschoolOptions: PreschoolOptions = {
  today: '',
  timezone: 'Asia/Kolkata',
  schools: [],
  classes: [],
  staff: [],
  assignments: [],
  students: [],
};
export const timeLabel = (value: string | null | undefined, timezone: string) =>
  value
    ? new Date(value).toLocaleTimeString('en-IN', {
        timeZone: timezone,
        hour: 'numeric',
        minute: '2-digit',
      })
    : '—';
