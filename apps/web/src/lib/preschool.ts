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
  school: { programme: string; preschoolPickupVerification?: 'OPTIONAL' | 'REQUIRED' };
}
export interface PreschoolOptions {
  today: string;
  timezone: string;
  schools: {
    id: string;
    name: string;
    programme: string;
    preschoolPickupVerification?: 'OPTIONAL' | 'REQUIRED';
  }[];
  classes: PreschoolClass[];
  staff: { id: string; firstName: string; lastName: string }[];
  assignments: { classId: string; staffId: string }[];
  students: { id: string; firstName: string; lastName: string; currentClassId: string }[];
}
export interface PreschoolPickupPassSummary {
  id: string;
  guardianId: string;
  guardianName: string;
  relationship?: string | null;
  issuedByRole: string;
  deliveryChannels: string[];
  failedAttempts?: number;
  maxAttempts?: number;
  expiresAt: string;
  createdAt?: string;
  otp?: string;
  qrPayload?: string;
}
export interface PreschoolPickupPassStatus {
  today: string;
  pickupVerification: 'OPTIONAL' | 'REQUIRED';
  checkedIn: boolean;
  checkedOut: boolean;
  checkInAt: string | null;
  checkOutAt: string | null;
  pickupVerificationMethod: 'MANUAL' | 'OTP' | 'QR' | null;
  collectedBy: string | null;
  activePass: PreschoolPickupPassSummary | null;
  selfGuardianId?: string | null;
  authorizedGuardians?: {
    guardianId: string;
    name: string;
    relationship: string;
    isSelf: boolean;
  }[];
}
export interface PreschoolDay {
  id: string;
  date: string;
  checkInAt: string | null;
  checkOutAt: string | null;
  pickupVerificationMethod?: 'MANUAL' | 'OTP' | 'QR' | null;
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
  activePickupPass?: PreschoolPickupPassSummary | null;
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
export interface PreschoolCameraGatewayStream {
  vendor: 'hikvision' | 'dahua' | 'cpplus' | 'rtsp' | 'push';
  mode?: 'pull' | 'push';
  host?: string;
  port?: number;
  channel?: number;
  stream?: 'sub' | 'main';
  username?: string;
  hasPassword?: boolean;
  rtspPath?: string;
  hasCustomRtspUrl?: boolean;
  rtspTransport?: 'tcp' | 'udp';
  tls?: boolean;
  sourceOnDemand?: boolean;
  hasCustomPublishSecret?: boolean;
  streamPath?: string;
  redactedSourceUrl?: string;
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
  gatewayRegistered?: boolean;
  gatewayStream?: PreschoolCameraGatewayStream | null;
}
export type PreschoolAction = (
  path: string,
  data?: unknown,
  method?: 'post' | 'patch' | 'delete'
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
export interface PreschoolCopilotMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  language: string;
  createdAt: string;
  source?: string;
  suggestedActivities?: string[];
  draftedPlans?: Record<string, PreschoolContent>;
}
export interface PreschoolDraftPayload {
  classId: string;
  kind: (typeof kinds)[number];
  theme: string;
  language: string;
  ageMinMonths: number;
  ageMaxMonths: number;
  durationMinutes: number;
  title: string;
  body: string;
  materials: string;
  learningGoals: string;
  scheduledOn?: string;
}
export const preschoolAgeRangeForStage = (stage: string | null | undefined) => {
  switch (stage) {
    case 'PLAYGROUP':
      return { ageMinMonths: 18, ageMaxMonths: 36 };
    case 'NURSERY':
      return { ageMinMonths: 36, ageMaxMonths: 48 };
    case 'LKG':
      return { ageMinMonths: 48, ageMaxMonths: 60 };
    case 'UKG':
      return { ageMinMonths: 60, ageMaxMonths: 72 };
    default:
      return { ageMinMonths: 36, ageMaxMonths: 60 };
  }
};
const cleanSnippet = (text: string, max: number, fallback: string) => {
  const normalized = text
    .replace(/^[\s•\-*0-9.)]+/, '')
    .replace(/\s+/g, ' ')
    .trim();
  const value = normalized.length >= 2 ? normalized : fallback;
  return value.length > max ? value.slice(0, max - 1).trimEnd() + '…' : value;
};
export function buildDraftFromInkySuggestion(params: {
  classId: string;
  stage?: string | null;
  today?: string;
  language: string;
  question: string;
  answer: string;
  activity?: string;
  allActivities?: string[];
}): PreschoolDraftPayload {
  const { classId, stage, today, language, question, answer, activity, allActivities = [] } =
    params;
  const lang = ['English', 'Malayalam', 'Hindi'].includes(language) ? language : 'English';
  const t = (en: string, ml: string, hi: string) =>
    lang === 'Malayalam' ? ml : lang === 'Hindi' ? hi : en;
  const { ageMinMonths, ageMaxMonths } = preschoolAgeRangeForStage(stage);
  const isFullPlan = !activity;
  const kind: (typeof kinds)[number] = isFullPlan ? 'LESSON_PLAN' : 'ACTIVITY';
  const durationMinutes = isFullPlan ? 20 : 15;
  const fallbackTopic = t('Playful classroom routine', 'ക്ലാസ്റൂം പ്രവർത്തനം', 'कक्षा गतिविधि');
  const title = isFullPlan
    ? cleanSnippet(
        question,
        200,
        t('INKY classroom guidance plan', 'INKY ക്ലാസ്റൂം പ്ലാൻ', 'INKY कक्षा योजना')
      )
    : cleanSnippet(activity, 200, fallbackTopic);
  const theme = cleanSnippet(activity || question, 120, fallbackTopic);
  const learningGoals = cleanSnippet(
    question
      ? `${t('Support classroom situation', 'ക്ലാസ്റൂം ലക്ഷ്യം', 'कक्षा लक्ष्य')}: ${question}`
      : t(
          'Encourage safe, inclusive participation and playful learning.',
          'സുരക്ഷിതവും ഉൾക്കൊള്ളുന്നതുമായ പങ്കാളിത്തവും കളിയിലൂടെയുള്ള പഠനവും പ്രോത്സാഹിപ്പിക്കുക.',
          'सुरक्षित, समावेशी भागीदारी और खेल-आधारित सीखने को बढ़ावा देना।'
        ),
    3000,
    t(
      'Encourage safe, inclusive participation through play.',
      'കളിയിലൂടെ സുരക്ഷിതമായ പങ്കാളിത്തം പ്രോത്സാഹിപ്പിക്കുക.',
      'खेल के माध्यम से सुरक्षित भागीदारी को बढ़ावा देना।'
    )
  );
  const materials = t(
    'Large age-appropriate classroom materials; clear safe space; visual cues; adult supervision.',
    'പ്രായത്തിന് അനുയോജ്യമായ വലിയ ക്ലാസ്റൂം വസ്തുക്കൾ; സുരക്ഷിതമായ സ്ഥലം; ചിത്രസൂചനകൾ; അധ്യാപക മേൽനോട്ടം.',
    'उम्र के अनुसार बड़े कक्षा संसाधन; सुरक्षित स्थान; दृश्य संकेत; वयस्क की देखरेख।'
  );
  const activitySection = isFullPlan
    ? allActivities.length
      ? `${t('Suggested activities', 'നിർദ്ദേശിച്ച പ്രവർത്തനങ്ങൾ', 'सुझाई गई गतिविधियाँ')}:\n${allActivities
          .map((item, idx) => `${idx + 1}. ${item}`)
          .join('\n')}`
      : ''
    : `${t('Activity idea', 'പ്രവർത്തന ആശയം', 'गतिविधि विचार')}:\n${activity.trim()}`;
  const guidanceSection = answer.trim()
    ? `${t('INKY teaching guidance', 'INKY മാർഗ്ഗനിർദ്ദേശം', 'INKY शिक्षण मार्गदर्शन')}:\n${answer.trim()}`
    : '';
  const safetyNote = t(
    'Teacher review & safety: Review and adapt this draft for your children before publishing. Ensure adult supervision, large safe materials and inclusive alternatives.',
    'അധ്യാപക പരിശോധനയും സുരക്ഷയും: പങ്കിടുന്നതിന് മുമ്പ് കുട്ടികൾക്ക് അനുയോജ്യമായി ഈ കരട് പരിശോധിച്ച് മാറ്റുക. മുതിർന്നവരുടെ മേൽനോട്ടവും സുരക്ഷിത വസ്തുക്കളും ഉറപ്പാക്കുക.',
    'शिक्षक समीक्षा और सुरक्षा: साझा करने से पहले इस मसौदे की जाँच कर बच्चों के अनुसार बदलें। वयस्क देखरेख और सुरक्षित सामग्री सुनिश्चित करें।'
  );
  const rawBody = [activitySection, guidanceSection, safetyNote].filter(Boolean).join('\n\n');
  const body = (rawBody.length >= 10 ? rawBody : `${title}\n\n${safetyNote}`).slice(0, 20000);
  const scheduledOn = today && /^\d{4}-\d{2}-\d{2}$/.test(today) ? today : undefined;
  return {
    classId,
    kind,
    theme,
    language: lang,
    ageMinMonths,
    ageMaxMonths,
    durationMinutes,
    title,
    body,
    materials,
    learningGoals,
    ...(scheduledOn ? { scheduledOn } : {}),
  };
}
export const pickupMethodLabel = (method: string | null | undefined) =>
  method === 'OTP'
    ? 'Verified with parent OTP'
    : method === 'QR'
      ? 'Verified with parent QR pass'
      : method === 'MANUAL'
        ? 'Verified by staff'
        : null;
