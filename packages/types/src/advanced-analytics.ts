export interface AnalyticsMetrics {
  students: number;
  assessedStudents: number;
  assessmentCount: number;
  averageScore: number | null;
  passRate: number | null;
  attendanceRate: number | null;
  attendanceDays: number;
  attendanceStudents: number;
  billed: number;
  receipts: number;
  invoiceSettlementRate: number | null;
  outstanding: number;
  overdue: number;
}
export interface AnalyticsGroup extends AnalyticsMetrics { id: string; name: string }
export interface AnalyticsTrend { date: string; averageScore: number | null; assessmentCount: number; attendanceRate: number | null; attendanceDays: number; receipts: number }
export interface AnalyticsInsight { kind: 'positive' | 'attention' | 'information'; title: string; detail: string; href: string }
export interface ExecutiveAnalyticsReport {
  generatedAt: string; currency: string; schoolName: string;
  period: { from: string; to: string; previousFrom: string; previousTo: string };
  filters: { classId: string | null; subjectId: string | null };
  current: AnalyticsMetrics; previous: AnalyticsMetrics;
  classes: AnalyticsGroup[]; subjects: AnalyticsGroup[]; trend: AnalyticsTrend[];
  insights: AnalyticsInsight[]; methodology: string[];
}
export interface AdvancedAnalyticsOptions {
  classes: { id: string; name: string }[]; subjects: { id: string; name: string }[];
  terms: { id: string; name: string; startDate: string; endDate: string; isCurrent: boolean }[];
  defaults: { from: string; to: string };
}
export interface SchoolBenchmark extends AnalyticsMetrics { id: string; name: string; currency: string; status: string }
export interface SchoolBenchmarkReport {
  generatedAt: string; period: { from: string; to: string }; schools: SchoolBenchmark[];
  page: number; pageSize: number; total: number; methodology: string[];
}
