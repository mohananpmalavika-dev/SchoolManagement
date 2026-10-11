import {
  StudentDigitalPortfolio,
  StudentBadge,
  PortfolioAchievement,
  PortfolioProject,
  PortfolioCertificate,
} from '@krypton/types';

const STORAGE_KEY = 'school_student_portfolios_v1';

export const BADGE_LIBRARY: Omit<StudentBadge, 'id' | 'unlockedAt' | 'awardedBy'>[] = [
  {
    code: 'SCIENCE_FAIR_GOLD',
    name: 'Science & Innovation Champion',
    nameMl: 'ശാസ്ത്ര ഇന്നൊവേഷൻ ജേതാവ്',
    description: 'Awarded for securing top prize in State / District Science Exhibition',
    descriptionMl: 'സംസ്ഥാന/ജില്ലാ ശാസ്ത്ര മേളയിൽ ഒന്നാം സ്ഥാനം നേടിയതിന്',
    category: 'STEM',
    icon: '🔬',
    rarity: 'LEGENDARY',
    points: 150,
  },
  {
    code: 'ATTENDANCE_100',
    name: '100% Attendance Star',
    nameMl: 'പൂർണ്ണ ഹാജർ താരം',
    description: 'Zero unauthorized absences across the academic academic term',
    descriptionMl: 'ടേമിൽ ഒരു ദിവസം പോലും മുടങ്ങാതെ ക്ലാസിൽ പങ്കെടുത്തതിന്',
    category: 'LEADERSHIP',
    icon: '⭐',
    rarity: 'EPIC',
    points: 100,
  },
  {
    code: 'MATH_OLYMPIAD',
    name: 'Mathematics Olympiad Laureate',
    nameMl: 'മാത്തമാറ്റിക്സ് ഒളിമ്പ്യാഡ് ജേതാവ്',
    description: 'Scored distinction in International or Regional Math Olympiad',
    descriptionMl: 'റീജിയണൽ കണക്ക് ഒളിമ്പ്യാഡിൽ വിശിഷ്ട വിജയം',
    category: 'ACADEMIC',
    icon: '📐',
    rarity: 'EPIC',
    points: 120,
  },
  {
    code: 'KALA_PRATHIBHA',
    name: 'Kala Prathibha (Arts Master)',
    nameMl: 'കലാപ്രതിഭ പുരസ്കാരം',
    description: 'Outstanding mastery across Classical Music, Elocution & Dramatics',
    descriptionMl: 'യുവജനോത്സവത്തിൽ പ്രസംഗം, നാടകം, സംഗീതം എന്നിവയിലെ സമഗ്ര മികവ്',
    category: 'ARTS',
    icon: '🎭',
    rarity: 'LEGENDARY',
    points: 160,
  },
  {
    code: 'SPORTS_CAPTAIN',
    name: 'Athletics & Sports Champion',
    nameMl: 'കായിക പ്രതിഭ',
    description: 'Gold medal in 400m Track & Relay or Inter-School Football Trophy',
    descriptionMl: 'സ്കൂൾ കായികമേളയിൽ സ്വർണ്ണമെഡൽ നേടിയതിന്',
    category: 'SPORTS',
    icon: '🏆',
    rarity: 'RARE',
    points: 100,
  },
  {
    code: 'CODING_ROBOTICS',
    name: 'AI & Robotics Builder',
    nameMl: 'റോബോട്ടിക്സ് & കോഡിംഗ് വിദഗ്ദ്ധൻ',
    description: 'Created functional autonomous Arduino robot and Python web portal',
    descriptionMl: 'റോബോട്ടിക്സ് ലാബിൽ പ്രവർത്തനക്ഷമമായ പ്രോജക്റ്റ് നിർമ്മിച്ചതിന്',
    category: 'STEM',
    icon: '🤖',
    rarity: 'RARE',
    points: 90,
  },
  {
    code: 'COMMUNITY_SEVA',
    name: 'Eco-Warrior & Community Lead',
    nameMl: 'പരിസ്ഥിതി സംരക്ഷണ സേവകൻ',
    description: 'Organized campus afforestation & plastic cleanup drive',
    descriptionMl: 'ക്യാമ്പസ് വൃക്ഷത്തൈ നടീലും ശുചീകരണവും വിജയകരമായി നയിച്ചതിന്',
    category: 'COMMUNITY',
    icon: '🌱',
    rarity: 'COMMON',
    points: 60,
  },
  {
    code: 'PEER_MENTOR',
    name: 'Academic Peer Tutor',
    nameMl: 'സഹപാഠി മാർഗ്ഗദർശി',
    description: 'Conducted after-school peer math and science study circles',
    descriptionMl: 'സഹപാഠികളെ പഠനത്തിൽ സഹായിച്ചതിനും മാർഗ്ഗനിർദ്ദേശം നൽകിയതിനും',
    category: 'LEADERSHIP',
    icon: '🤝',
    rarity: 'RARE',
    points: 80,
  },
];

const INITIAL_PORTFOLIOS: StudentDigitalPortfolio[] = [
  {
    studentId: 'std-14',
    name: 'Rahul Sharma',
    nameMl: 'രാഹുൽ ശർമ്മ',
    admissionNumber: 'ADM-2024-0014',
    className: 'Class 10-A',
    rollNo: '14',
    academicYear: '2025-2026',
    bio: 'Passionate aspiring aerospace engineer and school debate captain. Enjoys physics simulation modeling and robotics club leadership.',
    bioMl: 'എയ്റോസ്പേസ് എൻജിനീയറിംഗിലും റോബോട്ടിക്സിലും അഭിരുചിയുള്ള പത്താം ക്ലാസ് വിദ്യാർത്ഥി.',
    careerAspirations: 'Aerospace Engineering & Computational Physics',
    totalPoints: 630,
    attendanceRate: 98.4,
    academicAverage: 92.5,
    badges: [
      {
        id: 'bdg-1',
        code: 'SCIENCE_FAIR_GOLD',
        name: 'Science & Innovation Champion',
        nameMl: 'ശാസ്ത്ര ഇന്നൊവേഷൻ ജേതാവ്',
        description: 'First Prize with A-Grade in State School Science Fair (Working Model)',
        descriptionMl: 'സംസ്ഥാന സ്കൂൾ ശാസ്ത്രമേളയിൽ വർക്കിംഗ് മോഡലിൽ ഒന്നാം സ്ഥാനം',
        category: 'STEM',
        icon: '🔬',
        rarity: 'LEGENDARY',
        points: 150,
        unlockedAt: '2026-01-18',
        awardedBy: 'Dr. K. N. Radhakrishnan (State Science Officer)',
      },
      {
        id: 'bdg-2',
        code: 'ATTENDANCE_100',
        name: '100% Attendance Star',
        nameMl: 'പൂർണ്ണ ഹാജർ താരം',
        description: 'Zero unauthorized absences across Term 1 & 2',
        descriptionMl: 'ഒരു ദിവസം പോലും മുടങ്ങാതെ ക്ലാസിൽ ഹാജരായതിന്',
        category: 'LEADERSHIP',
        icon: '⭐',
        rarity: 'EPIC',
        points: 100,
        unlockedAt: '2025-12-20',
        awardedBy: 'Principal Sarah Jenkins',
      },
      {
        id: 'bdg-3',
        code: 'MATH_OLYMPIAD',
        name: 'Mathematics Olympiad Laureate',
        nameMl: 'മാത്തമാറ്റിക്സ് ഒളിമ്പ്യാഡ് ജേതാവ്',
        description: 'District Rank 2 in National Cyber & Math Olympiad',
        descriptionMl: 'മാത്തമാറ്റിക്സ് ഒളിമ്പ്യാഡിൽ ജില്ലാ തലത്തിൽ രണ്ടാം റാങ്ക്',
        category: 'ACADEMIC',
        icon: '📐',
        rarity: 'EPIC',
        points: 120,
        unlockedAt: '2025-11-10',
        awardedBy: 'Mathematics Department Head',
      },
      {
        id: 'bdg-4',
        code: 'CODING_ROBOTICS',
        name: 'AI & Robotics Builder',
        nameMl: 'റോബോട്ടിക്സ് & കോഡിംഗ് വിദഗ്ദ്ധൻ',
        description: 'Autonomous line-follower and obstacle avoidance robot',
        descriptionMl: 'സ്വയം നിയന്ത്രിത റോബോട്ട് നിർമ്മിച്ചതിന്',
        category: 'STEM',
        icon: '🤖',
        rarity: 'RARE',
        points: 90,
        unlockedAt: '2025-09-14',
        awardedBy: 'Computer Science Faculty',
      },
      {
        id: 'bdg-5',
        code: 'PEER_MENTOR',
        name: 'Academic Peer Tutor',
        nameMl: 'സഹപാഠി മാർഗ്ഗദർശി',
        description: 'Helped 6 students improve trigonometry and physics scores',
        descriptionMl: 'സഹപാഠികൾക്ക് ഫിസിക്സിലും കണക്കിലും പഠനസഹായം നൽകിയതിന്',
        category: 'LEADERSHIP',
        icon: '🤝',
        rarity: 'RARE',
        points: 80,
        unlockedAt: '2026-02-05',
        awardedBy: 'Class Teacher Mr. Vinod',
      },
    ],
    achievements: [
      {
        id: 'ach-1',
        studentId: 'std-14',
        title: 'State Science Fair - 1st Prize (Solar Tracking Reflector)',
        titleMl: 'സംസ്ഥാന ശാസ്ത്രമേള - ഒന്നാം സ്ഥാനം (സോളാർ ട്രാക്കിംഗ് റിഫ്ലക്ടർ)',
        category: 'STEM_PROJECTS',
        academicYear: '2025-2026',
        date: '2026-01-18',
        level: 'STATE',
        position: 'FIRST',
        description: 'Built dual-axis solar tracking parabolic reflector using microcontrollers, increasing photo-voltaic yield by 38%.',
        descriptionMl: 'സോളാർ പാനലുകളുടെ ഉൽപ്പാദനക്ഷമത 38% വർദ്ധിപ്പിക്കുന്ന ഡ്യുവൽ-ആക്സിസ് ട്രാക്കിംഗ് മോഡൽ.',
        organizer: 'State Department of General Education',
        certificateNumber: 'STATE-SCI-2026-9921',
        isVerified: true,
        verifiedBy: 'Vice Principal K. Menon',
      },
      {
        id: 'ach-2',
        studentId: 'std-14',
        title: 'Inter-School Youth Festival - English Elocution 1st Prize',
        titleMl: 'ഇന്റർ-സ്കൂൾ യൂത്ത് ഫെസ്റ്റിവൽ - ഇംഗ്ലീഷ് പ്രസംഗം ഒന്നാം സ്ഥാനം',
        category: 'ARTS_CULTURE',
        academicYear: '2025-2026',
        date: '2025-10-24',
        level: 'DISTRICT',
        position: 'FIRST',
        description: 'Topic: "Artificial Intelligence and Ethics in 21st Century Classrooms". Scored 98/100.',
        descriptionMl: 'ആർട്ടിഫിഷ്യൽ ഇന്റലിജൻസും ക്ലാസ്റൂം എത്തിക്സും എന്ന വിഷയത്തിൽ ഉജ്ജ്വല പ്രസംഗം.',
        organizer: 'Sahodaya School Complex',
        certificateNumber: 'SAH-ELO-2025-412',
        isVerified: true,
        verifiedBy: 'Debate Club Coordinator',
      },
      {
        id: 'ach-3',
        studentId: 'std-14',
        title: 'District Athletics Meet - 400m Silver Medal',
        titleMl: 'ജില്ലാ അത്‌ലറ്റിക്സ് മീറ്റ് - 400 മീറ്റർ വെള്ളി മെഡൽ',
        category: 'SPORTS_ATHLETICS',
        academicYear: '2024-2025',
        date: '2024-11-12',
        level: 'DISTRICT',
        position: 'SECOND',
        description: 'Clocked 54.2 seconds in Sub-Junior boys 400-meter dash.',
        descriptionMl: 'ജില്ലാ തലത്തിൽ 400 മീറ്റർ ഓട്ടത്തിൽ രണ്ടാം സ്ഥാനം.',
        organizer: 'District Sports Council',
        certificateNumber: 'DSC-ATH-2024-771',
        isVerified: true,
        verifiedBy: 'Physical Education Director',
      },
    ],
    projects: [
      {
        id: 'prj-1',
        studentId: 'std-14',
        title: 'Smart Agricultural IoT Soil Moisture Sentinel',
        titleMl: 'സ്മാർട്ട് അഗ്രികൾച്ചറൽ സോയിൽ മോയിസ്ചർ സെന്റിനൽ',
        subject: 'Integrated Science & Computing',
        academicYear: '2025-2026',
        completionDate: '2026-02-10',
        description: 'Constructed ESP32 low-power moisture sensor array with automated drip-irrigation trigger and dashboard alert.',
        skillsAcquired: ['C++', 'IoT Sensor Calibration', 'Telemetry', 'Sustainable Agronomy'],
        scoreOrGrade: 'A+ (100/100)',
        teacherFeedback: 'Outstanding technical rigor and clear societal application. Ready for district patent filing demonstration.',
        featured: true,
      },
      {
        id: 'prj-2',
        studentId: 'std-14',
        title: 'Computational Parabolic Trajectory Simulator',
        titleMl: 'കംപ്യൂട്ടേഷണൽ പാരബോളിക് ട്രജക്ടറി സിമുലേറ്റർ',
        subject: 'Physics & Advanced Mathematics',
        academicYear: '2024-2025',
        completionDate: '2025-01-22',
        description: 'Interactive browser canvas illustrating quadratic drag mechanics and aerodynamic projectile paths.',
        skillsAcquired: ['Vector Calculus', 'Kinematic Modeling', 'JavaScript Physics Engine'],
        scoreOrGrade: 'A+ (98/100)',
        teacherFeedback: 'Exceptional visual demonstration connecting quadratic algebra with classical Newtonian mechanics.',
        featured: false,
      },
    ],
    certificates: [
      {
        id: 'cert-1',
        title: 'Official Bonafide Conduct & Academic Excellence Certificate',
        titleMl: 'ബോണഫൈഡ് പെരുമാറ്റ സർട്ടിഫിക്കറ്റ്',
        issueDate: '2026-02-01',
        certNumber: 'CERT-BF-2026-0041',
        type: 'BONAFIDE',
        issuer: 'Al-Ameen International Academy',
        verificationHash: 'SHA256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
      },
      {
        id: 'cert-2',
        title: 'Certificate of Meritorious Character & Leadership',
        titleMl: 'നല്ല പെരുമാറ്റവും നേതൃത്വ ഗുണവും സാക്ഷ്യപ്പെടുത്തുന്ന സർട്ടിഫിക്കറ്റ്',
        issueDate: '2025-12-15',
        certNumber: 'CERT-CH-2025-0188',
        type: 'CHARACTER',
        issuer: 'Al-Ameen International Academy',
        verificationHash: 'SHA256:3b94a21d8b765431bc89a65ef94b6201a44e59f2a9d8e7b6134bca89d1204123',
      },
    ],
  },
  {
    studentId: 'std-03',
    name: 'Ananya Nair',
    nameMl: 'അനന്യ നായർ',
    admissionNumber: 'ADM-2024-0003',
    className: 'Class 10-B',
    rollNo: '03',
    academicYear: '2025-2026',
    bio: 'Classical Mohiniyattam dancer, visual artist, and biology enthusiast. Passionate about genetics and environmental ecology.',
    bioMl: 'ക്ലാസിക്കൽ നർത്തകിയും ചിത്രകാരിയുമായ പത്താം ക്ലാസ് വിദ്യാർത്ഥിനി.',
    careerAspirations: 'Biotechnology & Visual Arts',
    totalPoints: 590,
    attendanceRate: 99.1,
    academicAverage: 94.0,
    badges: [
      {
        id: 'bdg-11',
        code: 'KALA_PRATHIBHA',
        name: 'Kala Prathibha (Arts Master)',
        nameMl: 'കലാപ്രതിഭ പുരസ്കാരം',
        description: 'First Prize in Classical Mohiniyattam & Bharatanatyam',
        descriptionMl: 'സംസ്ഥാന സ്കൂൾ കലോത്സവത്തിൽ എ ഗ്രേഡും ഒന്നാം സ്ഥാനവും',
        category: 'ARTS',
        icon: '🎭',
        rarity: 'LEGENDARY',
        points: 160,
        unlockedAt: '2026-01-08',
        awardedBy: 'District Youth Cultural Board',
      },
      {
        id: 'bdg-12',
        code: 'COMMUNITY_SEVA',
        name: 'Eco-Warrior & Community Lead',
        nameMl: 'പരിസ്ഥിതി സംരക്ഷണ സേവകൻ',
        description: 'Planted 120 medicinal saplings and founded nature club newsletter',
        descriptionMl: 'പരിസ്ഥിതി ക്ലബ്ബ് മാഗസിൻ തയ്യാറാക്കുകയും വൃക്ഷത്തൈകൾ നടുകയും ചെയ്തു',
        category: 'COMMUNITY',
        icon: '🌱',
        rarity: 'COMMON',
        points: 60,
        unlockedAt: '2025-11-20',
        awardedBy: 'Nature Club Teacher Coordinator',
      },
      {
        id: 'bdg-13',
        code: 'ATTENDANCE_100',
        name: '100% Attendance Star',
        nameMl: 'പൂർണ്ണ ഹാജർ താരം',
        description: 'Consistent daily presence with zero late arrivals',
        descriptionMl: 'കൃത്യനിഷ്ഠയും നൂറ് ശതമാനം ഹാജരും',
        category: 'LEADERSHIP',
        icon: '⭐',
        rarity: 'EPIC',
        points: 100,
        unlockedAt: '2025-12-22',
        awardedBy: 'Principal Sarah Jenkins',
      },
    ],
    achievements: [
      {
        id: 'ach-11',
        studentId: 'std-03',
        title: 'State School Youth Festival - Mohiniyattam A-Grade 1st Prize',
        titleMl: 'സംസ്ഥാന സ്കൂൾ കലോത്സവം - മോഹിനിയാട്ടം എ ഗ്രേഡ് (ഒന്നാം സ്ഥാനം)',
        category: 'ARTS_CULTURE',
        academicYear: '2025-2026',
        date: '2026-01-08',
        level: 'STATE',
        position: 'FIRST',
        description: 'Evaluated by State Sangeetha Nataka Akademi jury with highest artistic score.',
        descriptionMl: 'സംസ്ഥാന തലത്തിൽ മോഹിനിയാട്ടത്തിൽ ഏറ്റവും ഉയർന്ന സ്കോറോടെ ഒന്നാം സ്ഥാനം.',
        organizer: 'General Education Department, Kerala',
        certificateNumber: 'KERALA-KALO-2026-1184',
        isVerified: true,
        verifiedBy: 'Cultural Club Incharge',
      },
    ],
    projects: [
      {
        id: 'prj-11',
        studentId: 'std-03',
        title: 'Western Ghats Flora & Biodiversity Digital Herbarium',
        titleMl: 'പശ്ചിമഘട്ട സസ്യസമ്പത്ത് ഡിജിറ്റൽ ഹെർബേറിയം',
        subject: 'Biology & Environmental Science',
        academicYear: '2025-2026',
        completionDate: '2026-01-30',
        description: 'Cataloged 60 endemic botanical specimens with high-resolution microscopy and medicinal taxonomy.',
        skillsAcquired: ['Botanical Taxonomy', 'Microscopy', 'Scientific Illustration', 'Field Ecology'],
        scoreOrGrade: 'A+ (99/100)',
        teacherFeedback: 'Museum-grade documentation of native biodiversity. Exemplary artistic and scientific fusion.',
        featured: true,
      },
    ],
    certificates: [
      {
        id: 'cert-11',
        title: 'Bonafide Certificate of Cultural Distinction',
        titleMl: 'കലാപരമായ മികവ് സാക്ഷ്യപ്പെടുത്തുന്ന ബോണഫൈഡ് സർട്ടിഫിക്കറ്റ്',
        issueDate: '2026-01-12',
        certNumber: 'CERT-BF-2026-0092',
        type: 'BONAFIDE',
        issuer: 'Al-Ameen International Academy',
        verificationHash: 'SHA256:d9b238a1f73620394857b29a1d48c90327f12e9b0485961d234857218390b12a',
      },
    ],
  },
];

export const PortfolioStore = {
  getPortfolios(): StudentDigitalPortfolio[] {
    if (typeof window === 'undefined') return INITIAL_PORTFOLIOS;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_PORTFOLIOS));
        return INITIAL_PORTFOLIOS;
      }
      return JSON.parse(raw);
    } catch {
      return INITIAL_PORTFOLIOS;
    }
  },

  getPortfolioByStudentId(studentId: string): StudentDigitalPortfolio | null {
    const list = this.getPortfolios();
    return list.find(p => p.studentId === studentId) || list[0] || null;
  },

  awardBadge(studentId: string, badgeCode: string, teacherName: string, customReason?: string): StudentBadge | null {
    const list = this.getPortfolios();
    const portfolio = list.find(p => p.studentId === studentId);
    if (!portfolio) return null;

    const template = BADGE_LIBRARY.find(b => b.code === badgeCode);
    if (!template) return null;

    const newBadge: StudentBadge = {
      ...template,
      id: `bdg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      unlockedAt: new Date().toISOString().split('T')[0],
      awardedBy: teacherName || 'Class Teacher',
      description: customReason || template.description,
    };

    portfolio.badges.unshift(newBadge);
    portfolio.totalPoints += newBadge.points;

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    }
    return newBadge;
  },

  addAchievement(
    studentId: string,
    achievement: Omit<PortfolioAchievement, 'id' | 'isVerified'>
  ): PortfolioAchievement | null {
    const list = this.getPortfolios();
    const portfolio = list.find(p => p.studentId === studentId);
    if (!portfolio) return null;

    const newAch: PortfolioAchievement = {
      ...achievement,
      id: `ach-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      isVerified: true,
    };

    portfolio.achievements.unshift(newAch);
    portfolio.totalPoints += 50;

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    }
    return newAch;
  },

  addProject(studentId: string, project: Omit<PortfolioProject, 'id'>): PortfolioProject | null {
    const list = this.getPortfolios();
    const portfolio = list.find(p => p.studentId === studentId);
    if (!portfolio) return null;

    const newProj: PortfolioProject = {
      ...project,
      id: `prj-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    };

    portfolio.projects.unshift(newProj);
    portfolio.totalPoints += 40;

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    }
    return newProj;
  },
};
