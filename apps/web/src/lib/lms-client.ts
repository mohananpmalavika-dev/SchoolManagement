import {
  Assignment,
  HomeworkSubmission,
  MCQQuiz,
  QuizAttempt,
  QuestionBreakdown,
  LMSOverviewStats,
  SubmissionFile,
} from '@krypton/types';

// Sample preview SVG data URIs to simulate realistic student handwritten notebook photo uploads and PDFs
export const SAMPLE_NOTEBOOK_PAGE_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="850" viewBox="0 0 600 850" style="background:%23faf8f0;font-family:sans-serif;">
  <rect width="600" height="850" fill="%23fffdf7"/>
  <line x1="75" y1="0" x2="75" y2="850" stroke="%23ffaaaa" stroke-width="2"/>
  ${Array.from({ length: 28 }, (_, i) => `<line x1="0" y1="${80 + i * 27}" x2="600" y2="${80 + i * 27}" stroke="%23d8e5f2" stroke-width="1"/>`).join('')}
  <text x="90" y="55" font-size="14" font-weight="bold" fill="%234338ca">Class 10-A • Roll No: 14 • Rahul Sharma</text>
  <text x="420" y="55" font-size="12" fill="%2364748b">Date: 10-10-2026</text>
  <text x="90" y="102" font-size="14" font-weight="bold" fill="%230f172a">Assignment: Quadratic Equations Ex 4.2</text>
  <text x="90" y="130" font-size="13" fill="%231e293b">Q1. Solve 2x² - 5x + 3 = 0 using factorization:</text>
  <text x="110" y="157" font-size="13" fill="%231e3a8a">2x² - 2x - 3x + 3 = 0</text>
  <text x="110" y="184" font-size="13" fill="%231e3a8a">2x(x - 1) - 3(x - 1) = 0</text>
  <text x="110" y="211" font-size="13" fill="%231e3a8a">(2x - 3)(x - 1) = 0</text>
  <text x="110" y="238" font-size="13" font-weight="bold" fill="%23047857">Therefore, x = 3/2 or x = 1  ✓</text>
  
  <text x="90" y="292" font-size="13" fill="%231e293b">Q2. Discriminant: b² - 4ac for 3x² + 2x - 1 = 0</text>
  <text x="110" y="319" font-size="13" fill="%231e3a8a">a = 3, b = 2, c = -1</text>
  <text x="110" y="346" font-size="13" fill="%231e3a8a">D = (2)² - 4(3)(-1) = 4 + 12 = 16</text>
  <text x="110" y="373" font-size="13" font-weight="bold" fill="%23047857">Since D &gt; 0, roots are real and distinct. ✓</text>

  <rect x="90" y="440" width="380" height="150" fill="%23f1f5f9" rx="8" stroke="%23cbd5e1"/>
  <text x="105" y="465" font-size="12" font-weight="bold" fill="%23334155">Graph of f(x) = x² - 4x + 3</text>
  <line x1="120" y1="560" x2="440" y2="560" stroke="%23475569" stroke-width="1.5"/>
  <line x1="280" y1="475" x2="280" y2="580" stroke="%23475569" stroke-width="1.5"/>
  <path d="M 180 500 Q 280 580 380 500" fill="none" stroke="%234f46e5" stroke-width="2.5"/>
  <circle cx="230" cy="560" r="3" fill="%23ef4444"/>
  <circle cx="330" cy="560" r="3" fill="%23ef4444"/>
  <text x="215" y="550" font-size="10" fill="%23ef4444">x=1</text>
  <text x="325" y="550" font-size="10" fill="%23ef4444">x=3</text>

  <text x="90" y="650" font-size="12" fill="%2364748b">Verified by Teacher: [Awaiting evaluation]</text>
</svg>`;

export const SAMPLE_PHYSICS_NOTEBOOK_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="850" viewBox="0 0 600 850" style="background:%23faf8f0;font-family:sans-serif;">
  <rect width="600" height="850" fill="%23fffdf7"/>
  <line x1="75" y1="0" x2="75" y2="850" stroke="%23ffaaaa" stroke-width="2"/>
  ${Array.from({ length: 28 }, (_, i) => `<line x1="0" y1="${80 + i * 27}" x2="600" y2="${80 + i * 27}" stroke="%23d8e5f2" stroke-width="1"/>`).join('')}
  <text x="90" y="55" font-size="14" font-weight="bold" fill="%230284c7">Class 10-B • Roll No: 03 • Ananya Nair</text>
  <text x="420" y="55" font-size="12" fill="%2364748b">Date: 11-10-2026</text>
  <text x="90" y="102" font-size="14" font-weight="bold" fill="%230f172a">Physics Lab: Refraction through Convex Lens</text>
  
  <text x="90" y="130" font-size="13" fill="%231e293b">1. Object placed beyond 2F₁:</text>
  <text x="110" y="157" font-size="12" fill="%231e3a8a">• Nature: Real and Inverted</text>
  <text x="110" y="184" font-size="12" fill="%231e3a8a">• Position: Between F₂ and 2F₂</text>
  <text x="110" y="211" font-size="12" fill="%231e3a8a">• Size: Diminished (m &lt; 1)</text>

  <rect x="90" y="240" width="450" height="200" fill="%23f8fafc" rx="8" stroke="%2394a3b8"/>
  <line x1="100" y1="340" x2="520" y2="340" stroke="%2364748b" stroke-width="1.5" stroke-dasharray="4"/>
  <!-- Convex Lens symbol -->
  <path d="M 310 260 Q 330 340 310 420 Q 290 340 310 260" fill="%23e0f2fe" stroke="%230284c7" stroke-width="2"/>
  <!-- Optical center & foci -->
  <circle cx="310" cy="340" r="3" fill="%230f172a"/>
  <circle cx="210" cy="340" r="3" fill="%230f172a"/>
  <circle cx="130" cy="340" r="3" fill="%230f172a"/>
  <circle cx="410" cy="340" r="3" fill="%230f172a"/>
  <circle cx="490" cy="340" r="3" fill="%230f172a"/>
  <text x="205" y="358" font-size="11" fill="%23334155">F₁</text>
  <text x="125" y="358" font-size="11" fill="%23334155">2F₁</text>
  <text x="405" y="358" font-size="11" fill="%23334155">F₂</text>
  <text x="485" y="358" font-size="11" fill="%23334155">2F₂</text>
  <!-- Object arrow -->
  <line x1="110" y1="340" x2="110" y2="280" stroke="%23ef4444" stroke-width="2.5"/>
  <polygon points="106,282 110,270 114,282" fill="%23ef4444"/>
  <!-- Rays -->
  <line x1="110" y1="280" x2="310" y2="280" stroke="%2316a34a" stroke-width="1.5"/>
  <line x1="310" y1="280" x2="490" y2="390" stroke="%2316a34a" stroke-width="1.5"/>
  <line x1="110" y1="280" x2="490" y2="390" stroke="%232563eb" stroke-width="1.5"/>
  <!-- Inverted Image -->
  <line x1="450" y1="340" x2="450" y2="375" stroke="%23ef4444" stroke-width="2"/>
  <polygon points="446,373 450,383 454,373" fill="%23ef4444"/>
  <text x="435" y="405" font-size="11" fill="%23ef4444">Image</text>

  <text x="90" y="480" font-size="13" font-weight="bold" fill="%23047857">Lens Formula Verification:</text>
  <text x="110" y="507" font-size="13" fill="%231e3a8a">1/f = 1/v - 1/u</text>
  <text x="110" y="534" font-size="13" fill="%231e3a8a">u = -30 cm, f = +15 cm =&gt; 1/v = 1/15 - 1/30 = 1/30</text>
  <text x="110" y="561" font-size="13" font-weight="bold" fill="%23047857">v = +30 cm (Screen position verified) ✓</text>
</svg>`;

export const SAMPLE_MALAYALAM_ESSAY_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="850" viewBox="0 0 600 850" style="background:%23faf8f0;font-family:sans-serif;">
  <rect width="600" height="850" fill="%23fffdf7"/>
  <line x1="75" y1="0" x2="75" y2="850" stroke="%23ffaaaa" stroke-width="2"/>
  ${Array.from({ length: 28 }, (_, i) => `<line x1="0" y1="${80 + i * 27}" x2="600" y2="${80 + i * 27}" stroke="%23d8e5f2" stroke-width="1"/>`).join('')}
  <text x="90" y="55" font-size="14" font-weight="bold" fill="%237c3aed">Class 10-A • Roll No: 22 • Fathima Zehra</text>
  <text x="420" y="55" font-size="12" fill="%2364748b">തീയതി: 11-10-2026</text>
  <text x="90" y="102" font-size="15" font-weight="bold" fill="%230f172a">മലയാളം ഉപന്യാസം: പരിസ്ഥിതി സംരക്ഷണവും നവകേരളവും</text>
  
  <text x="90" y="130" font-size="13" font-weight="bold" fill="%231e293b">ആമുഖം:</text>
  <text x="110" y="157" font-size="12" fill="%23334155">പ്രകൃതിയും മനുഷ്യനും തമ്മിലുള്ള അഭേദ്യമായ ബന്ധമാണ് ഭൂമിയുടെ നിലനിൽപ്പിന് ആധാരം.</text>
  <text x="110" y="184" font-size="12" fill="%23334155">കേരളത്തിന്റെ പച്ചപ്പും പുഴകളും സംരക്ഷിക്കേണ്ടത് നമ്മുടെ ഓരോരുത്തരുടെയും കടമയാണ്.</text>

  <text x="90" y="238" font-size="13" font-weight="bold" fill="%231e293b">പ്രധാന വിഷയങ്ങൾ:</text>
  <text x="110" y="265" font-size="12" fill="%23334155">1. വനനശീകരണവും പ്രകൃതിദുരന്തങ്ങളും (കാലാവസ്ഥാ വ്യതിയാനത്തിന്റെ പ്രത്യാഘാതങ്ങൾ)</text>
  <text x="110" y="292" font-size="12" fill="%23334155">2. മാലിന്യ സംസ്കരണവും ശുചിത്വ കേരള മിഷനും</text>
  <text x="110" y="319" font-size="12" fill="%23334155">3. ഹരിത കർമ്മസേനയുടെ പ്രവർത്തനങ്ങളും പ്ലാസ്റ്റിക് നിർമ്മാർജ്ജനവും</text>
  <text x="110" y="346" font-size="12" fill="%23334155">4. സ്കൂൾ കാമ്പസുകളിലെ ഔഷധത്തോട്ടങ്ങളും വിദ്യാർത്ഥികളുടെ പങ്കാളിത്തവും</text>

  <text x="90" y="400" font-size="13" font-weight="bold" fill="%231e293b">ഉപസംഹാരം:</text>
  <text x="110" y="427" font-size="12" fill="%23334155">"പ്രകൃതിയെ നാം സ്നേഹിച്ചാൽ പ്രകൃതി നമ്മെയും സംരക്ഷിക്കും" എന്ന തിരിച്ചറിവ് ഓരോ</text>
  <text x="110" y="454" font-size="12" fill="%23334155">വിദ്യാർത്ഥിയിലും ഉണ്ടാവണം. സുസ്ഥിര വികസനമാണ് ഭാവി കേരളത്തിന് ആവശ്യം.</text>

  <rect x="90" y="520" width="460" height="110" fill="%23fdf4ff" rx="8" stroke="%23d8b4fe"/>
  <text x="105" y="545" font-size="12" font-weight="bold" fill="%236b21a8">ടീച്ചറുടെ കുറിപ്പ് (Teacher Remarks):</text>
  <text x="105" y="570" font-size="12" fill="%237e22ce">വളരെ മികച്ച ശൈലി. ആശയം കൃത്യമായി അവതരിപ്പിച്ചിരിക്കുന്നു. കയ്യക്ഷരവും വൃത്തിയും പ്രശംസനീയം.</text>
  <text x="105" y="600" font-size="14" font-weight="bold" fill="%2315803d">മാർക്ക്: 19 / 20  ★★★★★</text>
</svg>`;

// Default Initial Assignments
export const INITIAL_ASSIGNMENTS: Assignment[] = [
  {
    id: 'asg-001',
    title: 'Quadratic Equations Exercise 4.2 & Word Problems',
    titleMl: 'ക്വാഡ്രാറ്റിക് സമവാക്യങ്ങൾ - ഹോംവർക്ക് 4.2',
    description: 'Solve problems 1 through 8 from NCERT text chapter 4. Write full steps including factorization and discriminant calculation on your notebook. Click clear photo and submit.',
    descriptionMl: 'പാഠപുസ്തകത്തിലെ 4.2-ലെ 1 മുതൽ 8 വരെയുള്ള കണക്കുകൾ ഘട്ടങ്ങളോടെ നോട്ട്ബുക്കിൽ ചെയ്ത് വ്യക്തമായ ഫോട്ടോ എടുത്തു സമർപ്പിക്കുക.',
    subject: 'Mathematics',
    subjectMl: 'കണക്ക്',
    className: 'Class 10-A',
    classId: 'cls-10a',
    teacherId: 'tch-01',
    teacherName: 'Suresh Kumar (HOD Maths)',
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    maxMarks: 20,
    attachments: [
      {
        id: 'att-1',
        name: 'Quadratic_Equations_Ex_4.2_Worksheet.pdf',
        fileType: 'PDF',
        url: '#',
        size: '1.4 MB',
      },
    ],
    status: 'ACTIVE',
    submissionCount: 28,
    gradedCount: 24,
    totalStudents: 32,
    allowLateSubmission: true,
    createdAt: '2026-10-09T08:00:00Z',
  },
  {
    id: 'asg-002',
    title: 'Refraction of Light & Ray Diagrams Experiment Report',
    titleMl: 'പ്രകാശത്തിന്റെ അപവർത്തനം - റേ ഡയഗ്രം ലാബ് റിപ്പോർട്ട്',
    description: 'Draw ray diagrams for convex lens at 5 different object positions using pencil and scale. State nature, size, and position of images. Upload notebook photo or scanned PDF.',
    descriptionMl: 'ഉത്തല ലെൻസിൽ രൂപപ്പെടുന്ന പ്രതിബിംബങ്ങളുടെ റേ ഡയഗ്രം പെൻസിൽ ഉപയോഗിച്ച് കൃത്യമായി വരച്ച് ഫോട്ടോയോ PDF-ഓ ആയി അപ്ലോഡ് ചെയ്യുക.',
    subject: 'Physics',
    subjectMl: 'ഭൗതികശാസ്ത്രം',
    className: 'Class 10-A',
    classId: 'cls-10a',
    teacherId: 'tch-02',
    teacherName: 'Dr. Radhika Menon',
    dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    maxMarks: 25,
    attachments: [
      {
        id: 'att-2',
        name: 'Convex_Lens_Ray_Diagram_Guide.pdf',
        fileType: 'PDF',
        url: '#',
        size: '2.1 MB',
      },
    ],
    status: 'ACTIVE',
    submissionCount: 26,
    gradedCount: 18,
    totalStudents: 32,
    allowLateSubmission: false,
    createdAt: '2026-10-10T10:30:00Z',
  },
  {
    id: 'asg-003',
    title: 'Environmental Protection & Nava Kerala Essay',
    titleMl: 'പരിസ്ഥിതി സംരക്ഷണവും നവകേരളവും - ഉപന്യാസം',
    description: 'Write a 300-word essay in Malayalam highlighting sustainable development, climate crisis mitigation, and student eco-clubs.',
    descriptionMl: 'പരിസ്ഥിതി സംരക്ഷണവും നവകേരള നിർമ്മിതിയും എന്ന വിഷയത്തിൽ 300 വാക്കുകളിൽ കവിയാത്ത ഉപന്യാസം തയ്യാറാക്കി സമർപ്പിക്കുക.',
    subject: 'Malayalam',
    subjectMl: 'മലയാളം',
    className: 'Class 10-A',
    classId: 'cls-10a',
    teacherId: 'tch-03',
    teacherName: 'P. Balakrishnan Master',
    dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    maxMarks: 20,
    attachments: [],
    status: 'ACTIVE',
    submissionCount: 30,
    gradedCount: 28,
    totalStudents: 32,
    allowLateSubmission: true,
    createdAt: '2026-10-08T09:15:00Z',
  },
  {
    id: 'asg-004',
    title: 'Computer Science: Python Loops and Functions Coding Assignment',
    titleMl: 'പൈത്തൺ പ്രോഗ്രാമിംഗ് ലൂപ്പുകൾ & ഫംഗ്ഷനുകൾ',
    description: 'Write Python programs for Fibonacci series and prime number checking. Export code screenshot or PDF script.',
    descriptionMl: 'ഫിബൊനാച്ചി ശ്രേണിയും പ്രൈം നമ്പറും കണ്ടെത്താനുള്ള പൈത്തൺ പ്രോഗ്രാം സ്ക്രീൻഷോട്ടുകളോ PDF-ഓ ആയി അപ്ലോഡ് ചെയ്യുക.',
    subject: 'Computer Science',
    subjectMl: 'കമ്പ്യൂട്ടർ സയൻസ്',
    className: 'Class 10-A',
    classId: 'cls-10a',
    teacherId: 'tch-04',
    teacherName: 'Anil K. Varma',
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    maxMarks: 30,
    attachments: [],
    status: 'ACTIVE',
    submissionCount: 15,
    gradedCount: 10,
    totalStudents: 32,
    allowLateSubmission: true,
    createdAt: '2026-10-10T14:00:00Z',
  },
];

// Initial Submissions
export const INITIAL_SUBMISSIONS: HomeworkSubmission[] = [
  {
    id: 'sub-001',
    assignmentId: 'asg-001',
    studentId: 'std-14',
    studentName: 'Rahul Sharma',
    studentRollNo: '14',
    className: 'Class 10-A',
    classId: 'cls-10a',
    submissionDate: '2026-10-10T16:42:00Z',
    isLate: false,
    files: [
      {
        id: 'file-101',
        name: 'Maths_HW_Page1_Quadratic.png',
        fileType: 'IMAGE',
        url: SAMPLE_NOTEBOOK_PAGE_SVG,
        sizeBytes: 420000,
        uploadedAt: '2026-10-10T16:40:00Z',
      },
      {
        id: 'file-102',
        name: 'Graph_Discriminant_Worksheet.pdf',
        fileType: 'PDF',
        url: SAMPLE_NOTEBOOK_PAGE_SVG,
        sizeBytes: 850000,
        uploadedAt: '2026-10-10T16:42:00Z',
      },
    ],
    studentNotes: 'Sir, I have drawn the parabola graph on page 2. Please check question 4 calculation.',
    status: 'GRADED',
    grade: 19,
    maxMarks: 20,
    feedback: 'Excellent step-by-step factorization! Graph labeling is clean and accurate. Keep up the high standard.',
    gradedAt: '2026-10-11T09:15:00Z',
    gradedByName: 'Suresh Kumar',
  },
  {
    id: 'sub-002',
    assignmentId: 'asg-002',
    studentId: 'std-03',
    studentName: 'Ananya Nair',
    studentRollNo: '03',
    className: 'Class 10-A',
    classId: 'cls-10a',
    submissionDate: '2026-10-11T11:20:00Z',
    isLate: false,
    files: [
      {
        id: 'file-201',
        name: 'Physics_Lens_Ray_Diagram.png',
        fileType: 'IMAGE',
        url: SAMPLE_PHYSICS_NOTEBOOK_SVG,
        sizeBytes: 520000,
        uploadedAt: '2026-10-11T11:20:00Z',
      },
    ],
    studentNotes: 'Drawn using compass and millimeter scale as demonstrated in class.',
    status: 'SUBMITTED',
    maxMarks: 25,
  },
  {
    id: 'sub-003',
    assignmentId: 'asg-003',
    studentId: 'std-22',
    studentName: 'Fathima Zehra',
    studentRollNo: '22',
    className: 'Class 10-A',
    classId: 'cls-10a',
    submissionDate: '2026-10-11T08:30:00Z',
    isLate: false,
    files: [
      {
        id: 'file-301',
        name: 'Malayalam_Paristhithi_Essay.png',
        fileType: 'IMAGE',
        url: SAMPLE_MALAYALAM_ESSAY_SVG,
        sizeBytes: 610000,
        uploadedAt: '2026-10-11T08:30:00Z',
      },
    ],
    studentNotes: 'മാഷ് പറഞ്ഞതുപോലെ 300 വാക്കുകളിൽ പൂർത്തിയാക്കിയിട്ടുണ്ട്.',
    status: 'GRADED',
    grade: 19,
    maxMarks: 20,
    feedback: 'വളരെ മികച്ച ശൈലി. ആശയം കൃത്യമായി അവതരിപ്പിച്ചിരിക്കുന്നു. കയ്യക്ഷരവും വൃത്തിയും പ്രശംസനീയം.',
    gradedAt: '2026-10-11T10:00:00Z',
    gradedByName: 'P. Balakrishnan Master',
  },
];

// -------------------------------------------------------------
// Realistic Model MCQ Quizzes with Timer & Auto-Grading
// -------------------------------------------------------------

export const INITIAL_QUIZZES: MCQQuiz[] = [
  {
    id: 'quiz-001',
    title: 'SSLC Model Examination 2026: General Science & Physics',
    titleMl: 'എസ്.എസ്.എൽ.സി മാതൃകാ പരീക്ഷ 2026 - ശാസ്ത്രം & ഫിസിക്സ്',
    description: 'Timed online model examination covering Optics, Electricity, Mechanics, and Energy. Marks are calculated instantly upon submission.',
    descriptionMl: 'ടൈമർ ഉള്ള മോഡൽ പരീക്ഷ. സമർപ്പിക്കുമ്പോൾ തന്നെ മാർക്കുകൾ തത്സമയം കാൽക്കുലേറ്റ് ചെയ്യപ്പെടുന്നു.',
    subject: 'General Science',
    subjectMl: 'ശാസ്ത്രം',
    className: 'Class 10-A',
    classId: 'cls-10a',
    durationMinutes: 10,
    totalMarks: 20,
    passPercentage: 60,
    instructions: [
      'Each question carries specific marks as indicated.',
      'Timer will count down from 10 minutes. Test will auto-submit when timer expires.',
      'Select one option for each question.',
      'Instant mark sheet and full solutions review will appear right after submission.',
    ],
    instructionsMl: [
      '10 മിനിറ്റ് കൗണ്ട്ഡൗൺ ടൈമർ ഉണ്ട്. സമയം അവസാനിക്കുമ്പോൾ ഓട്ടോമാറ്റിക് ആയി സബ്മിറ്റ് ആകും.',
      'സബ്മിറ്റ് ചെയ്യുമ്പോൾ തന്നെ മാർക്കുകളും വിശദമായ ഉത്തരങ്ങളും ഉടൻ ലഭ്യമാകും.',
    ],
    questions: [
      {
        id: 'q-101',
        questionText: 'What is the SI unit of electrical resistance?',
        questionTextMl: 'വൈദ്യുത പ്രതിരോധത്തിന്റെ എസ്.ഐ (SI) യൂണിറ്റ് ഏതാണ്?',
        options: [
          { id: 'A', text: 'Volt (വോൾട്ട്)', textMl: 'വോൾട്ട്' },
          { id: 'B', text: 'Ohm (ഓം)', textMl: 'ഓം' },
          { id: 'C', text: 'Ampere (ആമ്പിയർ)', textMl: 'ആമ്പിയർ' },
          { id: 'D', text: 'Watt (വാട്ട്)', textMl: 'വാട്ട്' },
        ],
        correctOptionId: 'B',
        explanation: 'The SI unit of electrical resistance is the Ohm (symbol: Ω), named after German physicist Georg Simon Ohm.',
        explanationMl: 'വൈദ്യുത പ്രതിരോധത്തിന്റെ അളവ് ഓം (Ω) ആണ്.',
        marks: 3,
        subjectCategory: 'Electricity',
      },
      {
        id: 'q-102',
        questionText: 'In photosynthesis, solar energy is converted into which form of energy?',
        questionTextMl: 'പ്രകാശസംശ്ലേഷണത്തിൽ സൗരോർജ്ജം ഏത് ഊർജ്ജരൂപമായാണ് മാറ്റപ്പെടുന്നത്?',
        options: [
          { id: 'A', text: 'Mechanical Energy (യാന്ത്രികോർജ്ജം)', textMl: 'യാന്ത്രികോർജ്ജം' },
          { id: 'B', text: 'Nuclear Energy (ന്യൂക്ലിയർ ഊർജ്ജം)', textMl: 'ന്യൂക്ലിയർ ഊർജ്ജം' },
          { id: 'C', text: 'Chemical Energy (രാസോർജ്ജം)', textMl: 'രാസോർജ്ജം' },
          { id: 'D', text: 'Thermal Energy (താപോർജ്ജം)', textMl: 'താപോർജ്ജം' },
        ],
        correctOptionId: 'C',
        explanation: 'Photosynthesis converts light energy into stored chemical energy in the form of glucose/starch molecules.',
        explanationMl: 'പ്രകാശോർജ്ജം ഗ്ലൂക്കോസ് രൂപത്തിലുള്ള രാസോർജ്ജമായി മാറ്റപ്പെടുന്നു.',
        marks: 3,
        subjectCategory: 'Biology',
      },
      {
        id: 'q-103',
        questionText: 'Which optical phenomenon is responsible for the working of Optical Fiber cables?',
        questionTextMl: 'ഒപ്റ്റിക്കൽ ഫൈബറുകളുടെ പ്രവർത്തനത്തിന് ആധാരമായ പ്രകാശ പ്രതിഭാസം ഏതാണ്?',
        options: [
          { id: 'A', text: 'Refraction (അപവർത്തനം)', textMl: 'അപവർത്തനം' },
          { id: 'B', text: 'Total Internal Reflection (പൂർണ്ണ ആന്തര പ്രതിഫലനം)', textMl: 'പൂർണ്ണ ആന്തര പ്രതിഫലനം' },
          { id: 'C', text: 'Diffraction (വിഭംഗനം)', textMl: 'വിഭംഗനം' },
          { id: 'D', text: 'Dispersion (പ്രകീർണ്ണനം)', textMl: 'പ്രകീർണ്ണനം' },
        ],
        correctOptionId: 'B',
        explanation: 'Optical fibers transmit light signals over long distances via Total Internal Reflection inside the glass core without significant loss.',
        explanationMl: 'പൂർണ്ണ ആന്തര പ്രതിഫലനം (Total Internal Reflection) വഴിയാണ് പ്രകാശ സിഗ്നലുകൾ ഫൈബറിലൂടെ പ്രസരിക്കുന്നത്.',
        marks: 4,
        subjectCategory: 'Optics',
      },
      {
        id: 'q-104',
        questionText: 'Through which of the following media can sound NOT propagate?',
        questionTextMl: 'താഴെ പറയുന്നവയിൽ ഏതിലൂടെയാണ് ശബ്ദത്തിന് സഞ്ചരിക്കാൻ കഴിയാത്തത്?',
        options: [
          { id: 'A', text: 'Water (വെള്ളം)', textMl: 'വെള്ളം' },
          { id: 'B', text: 'Steel rod (സ്റ്റീൽ ദണ്ഡ്)', textMl: 'സ്റ്റീൽ ദണ്ഡ്' },
          { id: 'C', text: 'Vacuum (ശൂന്യത)', textMl: 'ശൂന്യത' },
          { id: 'D', text: 'Air (വായു)', textMl: 'വായു' },
        ],
        correctOptionId: 'C',
        explanation: 'Sound is a mechanical wave requiring a material medium for particle vibrations; it cannot propagate through vacuum.',
        explanationMl: 'ശബ്ദം യാന്ത്രിക തരംഗമായതിനാൽ സഞ്ചരിക്കാൻ മാധ്യമം ആവശ്യമാണ്; ശൂന്യതയിലൂടെ ശബ്ദത്തിന് സഞ്ചരിക്കാനാവില്ല.',
        marks: 3,
        subjectCategory: 'Acoustics',
      },
      {
        id: 'q-105',
        questionText: 'What is the normal human body temperature in degrees Celsius?',
        questionTextMl: 'മനുഷ്യശരീരത്തിലെ സാധാരണ ഊഷ്മാവ് എത്ര ഡിഗ്രി സെൽഷ്യസ് ആണ്?',
        options: [
          { id: 'A', text: '35°C', textMl: '35°C' },
          { id: 'B', text: '37°C', textMl: '37°C' },
          { id: 'C', text: '39°C', textMl: '39°C' },
          { id: 'D', text: '42°C', textMl: '42°C' },
        ],
        correctOptionId: 'B',
        explanation: 'Average human body temperature is approximately 37°C (98.6°F).',
        explanationMl: 'മനുഷ്യശരീരത്തിലെ സാധാരണ ഊഷ്മാവ് 37°C (98.6°F) ആണ്.',
        marks: 3,
        subjectCategory: 'Human Biology',
      },
      {
        id: 'q-106',
        questionText: 'Which law states that "For every action, there is an equal and opposite reaction"?',
        questionTextMl: '"ഏതൊരു പ്രവർത്തനത്തിനും തുല്യവും വിപരീതവുമായ ഒരു പ്രതിപ്രവർത്തനം ഉണ്ടായിരിക്കും" - ഏത് നിയമമാണിത്?',
        options: [
          { id: 'A', text: "Newton's First Law (ന്യൂട്ടന്റെ ഒന്നാം ചലനനിയമം)", textMl: 'ന്യൂട്ടന്റെ ഒന്നാം ചലനനിയമം' },
          { id: 'B', text: "Newton's Second Law (ന്യൂട്ടന്റെ രണ്ടാം ചലനനിയമം)", textMl: 'ന്യൂട്ടന്റെ രണ്ടാം ചലനനിയമം' },
          { id: 'C', text: "Newton's Third Law (ന്യൂട്ടന്റെ മൂന്നാം ചലനനിയമം)", textMl: 'ന്യൂട്ടന്റെ മൂന്നാം ചലനനിയമം' },
          { id: 'D', text: "Law of Conservation of Energy (ഊർജ്ജസംരക്ഷണ നിയമം)", textMl: 'ഊർജ്ജസംരക്ഷണ നിയമം' },
        ],
        correctOptionId: 'C',
        explanation: "Newton's Third Law of Motion states that whenever one body exerts a force on a second body, the second body exerts an equal and opposite force on the first.",
        explanationMl: 'ന്യൂട്ടന്റെ മൂന്നാം ചലനനിയമമാണിത്.',
        marks: 4,
        subjectCategory: 'Mechanics',
      },
    ],
    status: 'ACTIVE',
    totalAttempts: 42,
    createdAt: '2026-10-10T08:00:00Z',
  },
  {
    id: 'quiz-002',
    title: 'Class 10 Mathematics: Real Numbers & Polynomials Sprint',
    titleMl: 'പത്താം ക്ലാസ് ഗണിതം: വാസ്തവിക സംഖ്യകളും പോളിനോമിയലുകളും',
    description: 'Rapid 8-minute MCQ model test to evaluate core arithmetic and algebra foundations.',
    descriptionMl: '8 മിനിറ്റിൽ വേഗത്തിൽ പൂർത്തിയാക്കാവുന്ന മാതൃകാ ഗണിത ക്വിസ്.',
    subject: 'Mathematics',
    subjectMl: 'കണക്ക്',
    className: 'Class 10-A',
    classId: 'cls-10a',
    durationMinutes: 8,
    totalMarks: 15,
    passPercentage: 60,
    instructions: [
      '5 multiple choice questions.',
      'Timer duration: 8 minutes.',
      'Negative marks: None.',
      'Auto-evaluated immediately on submit.',
    ],
    instructionsMl: [
      '5 ചോദ്യങ്ങൾ, 8 മിനിറ്റ് സമയം.',
      'നെഗറ്റീവ് മാർക്ക് ഇല്ല.',
      'തത്സമയ ഓട്ടോമാറ്റിക് മൂല്യനിർണ്ണയം.',
    ],
    questions: [
      {
        id: 'qm-01',
        questionText: 'What are the roots of the quadratic equation x² - 5x + 6 = 0?',
        questionTextMl: 'x² - 5x + 6 = 0 എന്ന സമവാക്യത്തിന്റെ റൂട്ടുകൾ (പരിഹാരങ്ങൾ) ഏവ?',
        options: [
          { id: 'A', text: 'x = 2, 3', textMl: 'x = 2, 3' },
          { id: 'B', text: 'x = -2, -3', textMl: 'x = -2, -3' },
          { id: 'C', text: 'x = 1, 6', textMl: 'x = 1, 6' },
          { id: 'D', text: 'x = -1, 6', textMl: 'x = -1, 6' },
        ],
        correctOptionId: 'A',
        explanation: 'Factoring (x - 2)(x - 3) = 0 gives roots x = 2 and x = 3.',
        explanationMl: '(x - 2)(x - 3) = 0 =&gt; x = 2, 3.',
        marks: 3,
      },
      {
        id: 'qm-02',
        questionText: 'In trigonometry, what is the value of sin²θ + cos²θ for any angle θ?',
        questionTextMl: 'ത്രികോണമിതിയിൽ ഏത് കോണളവിലും sin²θ + cos²θ ന്റെ വില എത്രയാണ്?',
        options: [
          { id: 'A', text: '0', textMl: '0' },
          { id: 'B', text: '1', textMl: '1' },
          { id: 'C', text: '2', textMl: '2' },
          { id: 'D', text: 'tan θ', textMl: 'tan θ' },
        ],
        correctOptionId: 'B',
        explanation: 'sin²θ + cos²θ = 1 is the fundamental Pythagorean identity.',
        explanationMl: 'sin²θ + cos²θ = 1 അടിസ്ഥാന ത്രികോണമിതി ഐഡന്റിറ്റിയാണ്.',
        marks: 3,
      },
      {
        id: 'qm-03',
        questionText: 'If the radius of a circle is doubled, by what factor does its area increase?',
        questionTextMl: 'ഒരു വൃത്തത്തിന്റെ ആരം ഇരട്ടിയാക്കിയാൽ അതിന്റെ പരപ്പളവ് എത്ര മടങ്ങായി വർദ്ധിക്കും?',
        options: [
          { id: 'A', text: '2 times (2 മടങ്ങ്)', textMl: '2 മടങ്ങ്' },
          { id: 'B', text: '4 times (4 മടങ്ങ്)', textMl: '4 മടങ്ങ്' },
          { id: 'C', text: '8 times (8 മടങ്ങ്)', textMl: '8 മടങ്ങ്' },
          { id: 'D', text: 'Remains same (മാറ്റമില്ല)', textMl: 'മാറ്റമില്ല' },
        ],
        correctOptionId: 'B',
        explanation: 'Area = πr². If radius becomes 2r, new area = π(2r)² = 4πr², which is 4 times.',
        explanationMl: 'പരപ്പളവ് = πr². ആരം 2r ആയാൽ, പരപ്പളവ് = 4(πr²). അതായത് 4 മടങ്ങ്.',
        marks: 3,
      },
      {
        id: 'qm-04',
        questionText: 'What is the maximum possible value of the probability of an event?',
        questionTextMl: 'ഒരു സംഭവത്തിന്റെ പ്രൊബബിലിറ്റിയുടെ (സാധ്യത) പരമാവധി മൂല്യം എത്രയാണ്?',
        options: [
          { id: 'A', text: '0', textMl: '0' },
          { id: 'B', text: '0.5', textMl: '0.5' },
          { id: 'C', text: '1', textMl: '1' },
          { id: 'D', text: '100', textMl: '100' },
        ],
        correctOptionId: 'C',
        explanation: 'Probability is always bounded between 0 (impossible event) and 1 (certain event).',
        explanationMl: 'പ്രൊബബിലിറ്റിയുടെ പരിധി 0 മുതൽ 1 വരെയാണ്. പരമാവധി മൂല്യം 1.',
        marks: 3,
      },
      {
        id: 'qm-05',
        questionText: 'The common difference of the arithmetic progression (AP) 4, 9, 14, 19... is:',
        questionTextMl: '4, 9, 14, 19... എന്ന സമാന്തര ശ്രേണിയുടെ പൊതുവ്യത്യാസം എത്രയാണ്?',
        options: [
          { id: 'A', text: '4', textMl: '4' },
          { id: 'B', text: '5', textMl: '5' },
          { id: 'C', text: '9', textMl: '9' },
          { id: 'D', text: '-5', textMl: '-5' },
        ],
        correctOptionId: 'B',
        explanation: 'Common difference d = 9 - 4 = 14 - 9 = 5.',
        explanationMl: 'പൊതുവ്യത്യാസം d = 9 - 4 = 5.',
        marks: 3,
      },
    ],
    status: 'ACTIVE',
    totalAttempts: 38,
    createdAt: '2026-10-09T11:00:00Z',
  },
];

// Initial Quiz Attempts (to show analytics & leaderboard)
export const INITIAL_ATTEMPTS: QuizAttempt[] = [
  {
    id: 'att-901',
    quizId: 'quiz-001',
    quizTitle: 'SSLC Model Examination 2026: General Science & Physics',
    quizTitleMl: 'എസ്.എസ്.എൽ.സി മാതൃകാ പരീക്ഷ 2026 - ശാസ്ത്രം & ഫിസിക്സ്',
    subject: 'General Science',
    studentId: 'std-14',
    studentName: 'Rahul Sharma',
    classId: 'cls-10a',
    startedAt: '2026-10-11T10:00:00Z',
    submittedAt: '2026-10-11T10:07:45Z',
    timeSpentSeconds: 465,
    answers: {
      'q-101': 'B',
      'q-102': 'C',
      'q-103': 'B',
      'q-104': 'C',
      'q-105': 'B',
      'q-106': 'C',
    },
    score: 20,
    totalMarks: 20,
    percentage: 100,
    passed: true,
    breakdown: [
      { questionId: 'q-101', selectedOptionId: 'B', correctOptionId: 'B', isCorrect: true, marksAwarded: 3, explanation: 'The SI unit of electrical resistance is the Ohm (Ω).' },
      { questionId: 'q-102', selectedOptionId: 'C', correctOptionId: 'C', isCorrect: true, marksAwarded: 3, explanation: 'Photosynthesis converts solar energy to chemical energy.' },
      { questionId: 'q-103', selectedOptionId: 'B', correctOptionId: 'B', isCorrect: true, marksAwarded: 4, explanation: 'Optical fibers operate on Total Internal Reflection.' },
      { questionId: 'q-104', selectedOptionId: 'C', correctOptionId: 'C', isCorrect: true, marksAwarded: 3, explanation: 'Sound cannot travel through vacuum.' },
      { questionId: 'q-105', selectedOptionId: 'B', correctOptionId: 'B', isCorrect: true, marksAwarded: 3, explanation: 'Normal body temperature is 37°C.' },
      { questionId: 'q-106', selectedOptionId: 'C', correctOptionId: 'C', isCorrect: true, marksAwarded: 4, explanation: "Action and reaction are equal and opposite (Newton's 3rd Law)." },
    ],
  },
  {
    id: 'att-902',
    quizId: 'quiz-001',
    quizTitle: 'SSLC Model Examination 2026: General Science & Physics',
    subject: 'General Science',
    studentId: 'std-03',
    studentName: 'Ananya Nair',
    classId: 'cls-10a',
    startedAt: '2026-10-11T10:15:00Z',
    submittedAt: '2026-10-11T10:23:10Z',
    timeSpentSeconds: 490,
    answers: {
      'q-101': 'B',
      'q-102': 'C',
      'q-103': 'B',
      'q-104': 'A', // wrong choice
      'q-105': 'B',
      'q-106': 'C',
    },
    score: 17,
    totalMarks: 20,
    percentage: 85,
    passed: true,
    breakdown: [
      { questionId: 'q-101', selectedOptionId: 'B', correctOptionId: 'B', isCorrect: true, marksAwarded: 3, explanation: 'SI unit of resistance is Ohm.' },
      { questionId: 'q-102', selectedOptionId: 'C', correctOptionId: 'C', isCorrect: true, marksAwarded: 3, explanation: 'Chemical energy.' },
      { questionId: 'q-103', selectedOptionId: 'B', correctOptionId: 'B', isCorrect: true, marksAwarded: 4, explanation: 'Total Internal Reflection.' },
      { questionId: 'q-104', selectedOptionId: 'A', correctOptionId: 'C', isCorrect: false, marksAwarded: 0, explanation: 'Sound can travel through water, but cannot travel through vacuum.' },
      { questionId: 'q-105', selectedOptionId: 'B', correctOptionId: 'B', isCorrect: true, marksAwarded: 3, explanation: '37°C.' },
      { questionId: 'q-106', selectedOptionId: 'C', correctOptionId: 'C', isCorrect: true, marksAwarded: 4, explanation: "Newton's Third Law." },
    ],
  },
];

// Helper functions for LocalStorage persistence
const STORAGE_KEYS = {
  ASSIGNMENTS: 'krypton_lms_assignments_v1',
  SUBMISSIONS: 'krypton_lms_submissions_v1',
  QUIZZES: 'krypton_lms_quizzes_v1',
  ATTEMPTS: 'krypton_lms_attempts_v1',
};

function safeGet<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function safeSet<T>(key: string, val: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.error('Storage error:', e);
  }
}

export const LMSStore = {
  getAssignments(): Assignment[] {
    return safeGet<Assignment[]>(STORAGE_KEYS.ASSIGNMENTS, INITIAL_ASSIGNMENTS);
  },

  createAssignment(newAsg: Omit<Assignment, 'id' | 'createdAt' | 'submissionCount' | 'gradedCount'>): Assignment {
    const list = this.getAssignments();
    const created: Assignment = {
      ...newAsg,
      id: `asg-${Date.now()}`,
      submissionCount: 0,
      gradedCount: 0,
      createdAt: new Date().toISOString(),
    };
    const updated = [created, ...list];
    safeSet(STORAGE_KEYS.ASSIGNMENTS, updated);
    return created;
  },

  getSubmissions(assignmentId?: string): HomeworkSubmission[] {
    const list = safeGet<HomeworkSubmission[]>(STORAGE_KEYS.SUBMISSIONS, INITIAL_SUBMISSIONS);
    if (assignmentId) {
      return list.filter((s) => s.assignmentId === assignmentId);
    }
    return list;
  },

  submitHomework(submission: {
    assignmentId: string;
    studentId: string;
    studentName: string;
    studentRollNo: string;
    className: string;
    classId: string;
    files: SubmissionFile[];
    studentNotes?: string;
  }): HomeworkSubmission {
    const list = this.getSubmissions();
    const assignments = this.getAssignments();
    const asg = assignments.find((a) => a.id === submission.assignmentId);

    const newSub: HomeworkSubmission = {
      id: `sub-${Date.now()}`,
      assignmentId: submission.assignmentId,
      studentId: submission.studentId,
      studentName: submission.studentName,
      studentRollNo: submission.studentRollNo,
      className: submission.className,
      classId: submission.classId,
      submissionDate: new Date().toISOString(),
      isLate: asg ? new Date() > new Date(asg.dueDate) : false,
      files: submission.files,
      studentNotes: submission.studentNotes,
      status: 'SUBMITTED',
      maxMarks: asg?.maxMarks || 20,
    };

    // Update assignment submission count
    if (asg) {
      asg.submissionCount += 1;
      safeSet(STORAGE_KEYS.ASSIGNMENTS, assignments);
    }

    const updated = [newSub, ...list];
    safeSet(STORAGE_KEYS.SUBMISSIONS, updated);
    return newSub;
  },

  gradeSubmission(submissionId: string, grade: number, feedback: string, teacherName: string): HomeworkSubmission | null {
    const list = this.getSubmissions();
    const sub = list.find((s) => s.id === submissionId);
    if (!sub) return null;

    sub.status = 'GRADED';
    sub.grade = grade;
    sub.feedback = feedback;
    sub.gradedAt = new Date().toISOString();
    sub.gradedByName = teacherName;

    // Update assignment gradedCount
    const assignments = this.getAssignments();
    const asg = assignments.find((a) => a.id === sub.assignmentId);
    if (asg) {
      asg.gradedCount = list.filter((s) => s.assignmentId === asg.id && s.status === 'GRADED').length;
      safeSet(STORAGE_KEYS.ASSIGNMENTS, assignments);
    }

    safeSet(STORAGE_KEYS.SUBMISSIONS, list);
    return sub;
  },

  // Quizzes API
  getQuizzes(): MCQQuiz[] {
    return safeGet<MCQQuiz[]>(STORAGE_KEYS.QUIZZES, INITIAL_QUIZZES);
  },

  createQuiz(newQuiz: Omit<MCQQuiz, 'id' | 'createdAt' | 'totalAttempts'>): MCQQuiz {
    const list = this.getQuizzes();
    const created: MCQQuiz = {
      ...newQuiz,
      id: `quiz-${Date.now()}`,
      totalAttempts: 0,
      createdAt: new Date().toISOString(),
    };
    const updated = [created, ...list];
    safeSet(STORAGE_KEYS.QUIZZES, updated);
    return created;
  },

  getAttempts(quizId?: string): QuizAttempt[] {
    const list = safeGet<QuizAttempt[]>(STORAGE_KEYS.ATTEMPTS, INITIAL_ATTEMPTS);
    if (quizId) {
      return list.filter((a) => a.quizId === quizId);
    }
    return list;
  },

  // Instant Automated Quiz Grading Calculation Engine!
  submitQuizAttempt(
    quizId: string,
    studentInfo: { studentId: string; studentName: string; classId: string },
    answers: Record<string, string>,
    timeSpentSeconds: number
  ): QuizAttempt {
    const quizzes = this.getQuizzes();
    const quiz = quizzes.find((q) => q.id === quizId);
    if (!quiz) throw new Error('Quiz not found');

    let totalScore = 0;
    const breakdown: QuestionBreakdown[] = [];

    quiz.questions.forEach((q) => {
      const selected = answers[q.id] || '';
      const isCorrect = selected === q.correctOptionId;
      const marksAwarded = isCorrect ? q.marks : 0;
      totalScore += marksAwarded;

      breakdown.push({
        questionId: q.id,
        selectedOptionId: selected,
        correctOptionId: q.correctOptionId,
        isCorrect,
        marksAwarded,
        explanation: q.explanation,
        explanationMl: q.explanationMl,
      });
    });

    const percentage = Math.round((totalScore / quiz.totalMarks) * 100);
    const passed = percentage >= quiz.passPercentage;

    const attempt: QuizAttempt = {
      id: `att-${Date.now()}`,
      quizId: quiz.id,
      quizTitle: quiz.title,
      quizTitleMl: quiz.titleMl,
      subject: quiz.subject,
      studentId: studentInfo.studentId,
      studentName: studentInfo.studentName,
      classId: studentInfo.classId,
      startedAt: new Date(Date.now() - timeSpentSeconds * 1000).toISOString(),
      submittedAt: new Date().toISOString(),
      timeSpentSeconds,
      answers,
      score: totalScore,
      totalMarks: quiz.totalMarks,
      percentage,
      passed,
      breakdown,
    };

    // Increment quiz attempts count
    quiz.totalAttempts += 1;
    safeSet(STORAGE_KEYS.QUIZZES, quizzes);

    const attempts = this.getAttempts();
    safeSet(STORAGE_KEYS.ATTEMPTS, [attempt, ...attempts]);

    return attempt;
  },

  getOverviewStats(): LMSOverviewStats {
    const assignments = this.getAssignments();
    const submissions = this.getSubmissions();
    const quizzes = this.getQuizzes();
    const attempts = this.getAttempts();

    const pendingSubs = submissions.filter((s) => s.status === 'SUBMITTED').length;
    const gradedSubs = submissions.filter((s) => s.status === 'GRADED').length;
    const avgScore = attempts.length
      ? Math.round(attempts.reduce((sum, a) => sum + a.percentage, 0) / attempts.length)
      : 80;

    return {
      totalAssignments: assignments.length,
      activeAssignments: assignments.filter((a) => a.status === 'ACTIVE').length,
      pendingSubmissionsCount: pendingSubs,
      gradedSubmissionsCount: gradedSubs,
      totalQuizzes: quizzes.length,
      activeQuizzes: quizzes.filter((q) => q.status === 'ACTIVE').length,
      totalQuizAttempts: attempts.length,
      avgQuizScorePercentage: avgScore,
    };
  },
};
