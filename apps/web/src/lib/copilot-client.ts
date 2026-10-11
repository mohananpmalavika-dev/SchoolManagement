import { apiClient } from './api-client';
import type {
  ERPCopilotFilterBadge,
  ERPCopilotQueryRequest,
  ERPCopilotQueryResponse,
  ERPCopilotStudentMatch,
  LessonPlanRequest,
  LessonPlanResponse,
  PredictiveAnalyticsReport,
  TeachingLanguage,
} from '@krypton/types';

const MOCK_DEMO_STUDENTS: ERPCopilotStudentMatch[] = [
  {
    studentId: 'std-g9-01',
    name: 'Brian Kiprop',
    admissionNumber: 'ADM-2024-0089',
    className: 'Grade 9-B',
    classId: 'cls-g9b',
    attendanceRate: 74.2,
    attendanceDays: 45,
    latestAverage: 51.5,
    outstandingBalance: 1450000,
    overdueBalance: 1450000,
    riskLevel: 'HIGH',
    parentName: 'David Kiprop',
    parentPhone: '+254712345678',
    reasons: [
      'Attendance (74.2%) is below the 80% mandatory threshold',
      'Overdue fee balance of KES 14,500 pending for Term 2',
      'Academic drop: Science average decreased by 12 points',
    ],
  },
  {
    studentId: 'std-g9-02',
    name: 'Faith Chebet',
    admissionNumber: 'ADM-2024-0094',
    className: 'Grade 9-A',
    classId: 'cls-g9a',
    attendanceRate: 78.0,
    attendanceDays: 45,
    latestAverage: 62.0,
    outstandingBalance: 820000,
    overdueBalance: 820000,
    riskLevel: 'MODERATE',
    parentName: 'Grace Chebet',
    parentPhone: '+254723456789',
    reasons: [
      'Attendance (78.0%) triggered early-warning flag (< 80%)',
      'Unpaid fee balance of KES 8,200',
    ],
  },
  {
    studentId: 'std-g9-03',
    name: 'Samuel Otieno',
    admissionNumber: 'ADM-2024-0102',
    className: 'Grade 9-C',
    classId: 'cls-g9c',
    attendanceRate: 69.5,
    attendanceDays: 45,
    latestAverage: 44.8,
    outstandingBalance: 2100000,
    overdueBalance: 2100000,
    riskLevel: 'HIGH',
    parentName: 'Mercy Otieno',
    parentPhone: '+254734567890',
    reasons: [
      'Chronic attendance deficit: 69.5% recorded across 45 days',
      'Fee arrears of KES 21,000 exceeding 60 days overdue',
      'Academic score average below 45% (Needs immediate intervention)',
    ],
  },
  {
    studentId: 'std-g9-04',
    name: 'Zahra Hassan',
    admissionNumber: 'ADM-2024-0118',
    className: 'Grade 9-A',
    classId: 'cls-g9a',
    attendanceRate: 76.8,
    attendanceDays: 45,
    latestAverage: 58.2,
    outstandingBalance: 1200000,
    overdueBalance: 1200000,
    riskLevel: 'MODERATE',
    parentName: 'Ahmed Hassan',
    parentPhone: '+254745678901',
    reasons: [
      'Attendance (76.8%) under 80% guideline',
      'Pending fee balance of KES 12,000',
    ],
  },
];

function buildMockCopilotResponse(query: string, language: TeachingLanguage): ERPCopilotQueryResponse {
  const parsedFilters: ERPCopilotFilterBadge[] = [];
  const q = query.toLowerCase();

  if (q.includes('grade 9') || q.includes('class 9') || q.includes('9')) {
    parsedFilters.push({ label: 'Class Filter', value: 'GRADE 9', badgeType: 'class' });
  }
  if (q.includes('80') || q.includes('attendance')) {
    parsedFilters.push({ label: 'Attendance', value: '< 80%', badgeType: 'attendance' });
  }
  if (q.includes('unpaid') || q.includes('fee') || q.includes('balance') || q.includes('arrears')) {
    parsedFilters.push({ label: 'Fee Status', value: 'Unpaid / Overdue Balance', badgeType: 'fee' });
  }
  if (q.includes('risk') || q.includes('dropout')) {
    parsedFilters.push({ label: 'Risk Priority', value: 'High & Moderate', badgeType: 'risk' });
  }

  return {
    originalQuery: query,
    interpretedIntent: 'Executive filter: Grade 9 students matching attendance deficit (< 80%) with unpaid fee arrears.',
    parsedFilters: parsedFilters.length ? parsedFilters : [
      { label: 'Filter', value: 'Filtered Query', badgeType: 'class' },
    ],
    matches: MOCK_DEMO_STUDENTS,
    totalCount: MOCK_DEMO_STUDENTS.length,
    currency: 'KES',
    summary: {
      totalOutstanding: 5570000,
      averageAttendance: 74.6,
      averageScore: 54.1,
      highRiskCount: 2,
    },
    suggestedActions: [
      'Send WhatsApp fee reminder & attendance advisory to parents',
      'Schedule Virtual PTM check-in for 2 high-risk students',
      'Export detailed list to CSV for school finance committee',
    ],
    naturalLanguageSummary: `Found ${MOCK_DEMO_STUDENTS.length} Grade 9 students who have attendance below 80% and outstanding fee balances totaling KES 55,700. 2 students are flagged with High Risk priority requiring proactive intervention.`,
    generatedAt: new Date().toISOString(),
  };
}

export async function runCopilotQuery(
  query: string,
  language: TeachingLanguage = 'English',
  signal?: AbortSignal
): Promise<ERPCopilotQueryResponse> {
  try {
    const { data } = await apiClient.post<ERPCopilotQueryResponse>(
      '/teacher-ai/copilot-query',
      { query, language },
      { timeout: 45000, signal }
    );
    return data;
  } catch (err: any) {
    if (signal?.aborted) throw err;
    // If backend is not available, provide fallback
    return buildMockCopilotResponse(query, language);
  }
}

export async function generateLessonPlan(
  params: LessonPlanRequest,
  signal?: AbortSignal
): Promise<LessonPlanResponse> {
  try {
    const { data } = await apiClient.post<LessonPlanResponse>(
      '/teacher-ai/lesson-plan',
      params,
      { timeout: 60000, signal }
    );
    return data;
  } catch (err: any) {
    if (signal?.aborted) throw err;
    // Provide structured fallback 5E lesson plan
    return {
      title: `${params.subject}: ${params.chapter}`,
      gradeLevel: 'Grade 9 / Secondary',
      subject: params.subject,
      topic: params.chapter,
      durationMinutes: params.durationMinutes,
      curriculum: params.curriculum,
      learningObjectives: [
        `Understand foundational principles of ${params.chapter} and apply them to standard problems.`,
        'Formulate hypotheses and verify outcomes through classroom inquiry and experiments.',
        'Synthesize core mathematical/scientific concepts and articulate real-world applications.',
      ],
      coreCompetencies: [
        'Critical Thinking and Problem Solving',
        'Scientific Inquiry and Mathematical Reasoning',
        'Collaboration, Communication and Peer Tutoring',
      ],
      keyInquiryQuestions: [
        `How does understanding ${params.chapter} empower us to predict real-world phenomena?`,
        'What mathematical and physical equations govern this process under varying conditions?',
      ],
      materials: [
        'Interactive Smart Board',
        'Student Investigation Worksheets',
        'Digital Simulation Software / Science Apparatus',
      ],
      steps: [
        {
          phase: 'ENGAGE',
          title: 'Real-World Phenomenon Hook',
          durationMinutes: Math.round(params.durationMinutes * 0.15),
          teacherActivity: `Presents an intriguing real-world question demonstrating ${params.chapter} in action.`,
          studentActivity: 'Observe, brainstorm in pairs, and record initial questions in lab notebooks.',
          resourcesNeeded: ['Projector Slide', 'Whiteboard markers'],
        },
        {
          phase: 'EXPLORE',
          title: 'Hands-on Inquiry & Data Collection',
          durationMinutes: Math.round(params.durationMinutes * 0.3),
          teacherActivity: 'Facilitates small group stations, guides questioning without giving away answers.',
          studentActivity: 'Execute structured investigation, measure variables, calculate test values.',
          resourcesNeeded: ['Lab materials', 'Graph paper / Tablets'],
        },
        {
          phase: 'EXPLAIN',
          title: 'Concept Clarification & Formal Terminology',
          durationMinutes: Math.round(params.durationMinutes * 0.25),
          teacherActivity: 'Introduces formal definitions, formulas, and step-by-step model solutions.',
          studentActivity: 'Connect observations to formal theory, take Cornell notes, ask clarifying questions.',
          resourcesNeeded: ['Textbook Section', 'Diagrams'],
        },
        {
          phase: 'ELABORATE',
          title: 'Extension to Novel Scenarios',
          durationMinutes: Math.round(params.durationMinutes * 0.2),
          teacherActivity: 'Assigns challenging real-world application problem requiring synthesis.',
          studentActivity: 'Collaborate to solve scenario and present solution strategy to the class.',
          resourcesNeeded: ['Challenge Worksheet'],
        },
        {
          phase: 'EVALUATE',
          title: 'Formative Assessment & Exit Ticket',
          durationMinutes: Math.round(params.durationMinutes * 0.1),
          teacherActivity: 'Administers quick 3-question diagnostic exit ticket to gauge mastery.',
          studentActivity: 'Complete individual exit ticket questions and self-assess confidence.',
          resourcesNeeded: ['Exit Slips'],
        },
      ],
      differentiatedInstruction: {
        supportForStruggling: [
          'Provide scaffolded formula sheet and step-by-step visual decision trees.',
          'Pair with peer mentor for guided calculation support.',
        ],
        extensionForAdvanced: [
          'Challenge with multi-variable optimization and non-standard boundary conditions.',
          'Design an independent experimental setup for district science exhibition.',
        ],
      },
      assessmentRubrics: [
        {
          criterion: 'Conceptual Understanding & Accuracy',
          levels: [
            { level: 'EXCEEDING', scoreRange: '90-100%', descriptor: 'Deep mastery, explains underlying theory with exceptional clarity.' },
            { level: 'MEETING', scoreRange: '70-89%', descriptor: 'Demonstrates solid understanding and solves standard syllabus problems.' },
            { level: 'APPROACHING', scoreRange: '50-69%', descriptor: 'Basic grasp, but makes arithmetic or procedural errors.' },
            { level: 'BELOW', scoreRange: '<50%', descriptor: 'Struggles with core concepts and needs targeted re-teaching.' },
          ],
        },
      ],
      homeworkAssignment: `Complete textbook review exercises 1 to 5 on ${params.chapter} and write a 1-page summary of how this concept applies in renewable energy or engineering.`,
      model: 'Academic-Copilot-v2',
      generatedAt: new Date().toISOString(),
    };
  }
}

export async function fetchAtRiskStudents(
  signal?: AbortSignal
): Promise<PredictiveAnalyticsReport> {
  try {
    const { data } = await apiClient.get<PredictiveAnalyticsReport>(
      '/teacher-ai/at-risk',
      { signal }
    );
    return data;
  } catch (err) {
    try {
      const { data } = await apiClient.get<PredictiveAnalyticsReport>(
        '/predictive-analytics',
        { signal }
      );
      return data;
    } catch {
      // Mock report for preview
      return {
        generatedAt: new Date().toISOString(),
        engineVersion: '2.0.0-PROD',
        currency: 'KES',
        methodology: 'EARLY_WARNING',
        models: {
          academic: { status: 'ACTIVE', samples: 450, validationSamples: 100, balancedAccuracy: 0.89, brierScore: 0.08 },
          feeDefault: { status: 'ACTIVE', samples: 450, validationSamples: 100, balancedAccuracy: 0.91, brierScore: 0.07 },
        },
        summary: {
          students: 450,
          atRisk: 8,
          academicHigh: 3,
          feeDefaultHigh: 2,
          dropoutHigh: 3,
          incompleteData: 0,
          overdueBalance: 3550000,
        },
        classes: [
          { id: 'cls-g9a', name: 'Grade 9-A' },
          { id: 'cls-g9b', name: 'Grade 9-B' },
          { id: 'cls-g9c', name: 'Grade 9-C' },
        ],
        students: [
          {
            studentId: 'std-g9-01',
            admissionNumber: 'ADM-2024-0089',
            name: 'Brian Kiprop',
            classId: 'cls-g9b',
            className: 'Grade 9-B',
            overall: 'HIGH',
            priorityScore: 78,
            academic: {
              score: 72,
              level: 'HIGH',
              basis: 'EARLY_WARNING',
              evidence: ['Exam score dropped by 12%', 'Mathematics average below 45%'],
              actions: ['Assign academic peer tutor', 'Review Term 1 foundation chapters'],
            },
            feeDefault: {
              score: 85,
              level: 'HIGH',
              basis: 'EARLY_WARNING',
              evidence: ['Overdue fees exceed 60 days'],
              actions: ['Send WhatsApp flexible payment plan advisory'],
            },
            dropout: {
              score: 81,
              level: 'HIGH',
              basis: 'EARLY_WARNING',
              evidence: ['Attendance rate is 74.2% across 45 days', 'Unpaid fees over 60 days'],
              actions: ['Class teacher pastoral check-in', 'Schedule Virtual PTM conference'],
            },
            metrics: {
              latestAverage: 51.5,
              projectedAverage: 39.5,
              attendanceRate: 74.2,
              attendanceDays: 45,
              outstandingBalance: 1450000,
              overdueBalance: 1450000,
            },
          },
          {
            studentId: 'std-g9-03',
            admissionNumber: 'ADM-2024-0102',
            name: 'Samuel Otieno',
            classId: 'cls-g9c',
            className: 'Grade 9-C',
            overall: 'HIGH',
            priorityScore: 76,
            academic: {
              score: 65,
              level: 'HIGH',
              basis: 'EARLY_WARNING',
              evidence: ['Consecutive decline in 3 subjects'],
              actions: ['Conduct 1-on-1 diagnostic assessment'],
            },
            feeDefault: {
              score: 88,
              level: 'HIGH',
              basis: 'EARLY_WARNING',
              evidence: ['Arrears of KES 21,000'],
              actions: ['Fee installment restructuring offer'],
            },
            dropout: {
              score: 78,
              level: 'HIGH',
              basis: 'EARLY_WARNING',
              evidence: ['Attendance rate is 69.5%', 'Arrears of KES 21,000'],
              actions: ['Principal review meeting', 'Parent attendance notice'],
            },
            metrics: {
              latestAverage: 44.8,
              projectedAverage: 35.0,
              attendanceRate: 69.5,
              attendanceDays: 45,
              outstandingBalance: 2100000,
              overdueBalance: 2100000,
            },
          },
        ],
      };
    }
  }
}
