export type BadgeCategory = 'ACADEMIC' | 'SPORTS' | 'ARTS' | 'LEADERSHIP' | 'STEM' | 'COMMUNITY';
export type BadgeRarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';

export interface StudentBadge {
  id: string;
  code: string;
  name: string;
  nameMl: string;
  description: string;
  descriptionMl: string;
  category: BadgeCategory;
  icon: string;
  rarity: BadgeRarity;
  points: number;
  unlockedAt: string;
  awardedBy: string;
}

export type AchievementCategory = 'ARTS_CULTURE' | 'SPORTS_ATHLETICS' | 'STEM_PROJECTS' | 'ACADEMIC_OLYMPIAD' | 'COMMUNITY_SERVICE';
export type AchievementLevel = 'SCHOOL' | 'SUB_DISTRICT' | 'DISTRICT' | 'STATE' | 'NATIONAL' | 'INTERNATIONAL';
export type AchievementPosition = 'FIRST' | 'SECOND' | 'THIRD' | 'PARTICIPATION' | 'GOLD_MEDAL' | 'SPECIAL_RECOGNITION';

export interface PortfolioAchievement {
  id: string;
  studentId: string;
  title: string;
  titleMl: string;
  category: AchievementCategory;
  academicYear: string;
  date: string;
  level: AchievementLevel;
  position: AchievementPosition;
  description: string;
  descriptionMl?: string;
  organizer: string;
  evidenceUrl?: string;
  certificateNumber?: string;
  isVerified: boolean;
  verifiedBy?: string;
}

export interface PortfolioProject {
  id: string;
  studentId: string;
  title: string;
  titleMl?: string;
  subject: string;
  academicYear: string;
  completionDate: string;
  description: string;
  skillsAcquired: string[];
  projectUrl?: string;
  scoreOrGrade: string;
  teacherFeedback: string;
  featured: boolean;
}

export interface PortfolioCertificate {
  id: string;
  title: string;
  titleMl?: string;
  issueDate: string;
  certNumber: string;
  type: string;
  issuer: string;
  verificationHash: string;
}

export interface StudentDigitalPortfolio {
  studentId: string;
  name: string;
  nameMl: string;
  admissionNumber: string;
  className: string;
  rollNo: string;
  academicYear: string;
  avatarUrl?: string;
  bio: string;
  bioMl?: string;
  careerAspirations: string;
  totalPoints: number;
  attendanceRate: number;
  academicAverage: number;
  badges: StudentBadge[];
  achievements: PortfolioAchievement[];
  projects: PortfolioProject[];
  certificates: PortfolioCertificate[];
}
