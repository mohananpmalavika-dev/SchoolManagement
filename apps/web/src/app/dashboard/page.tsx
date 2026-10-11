'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import { Card, CardHeader, CardContent, Badge, LoadingSpinner, Alert } from '@/components/ui';
import { StudentSelector } from '@/components/StudentSelector';
import { format } from 'date-fns';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  admissionNumber: string;
  class: { name: string };
  stream: { name: string };
}

interface DashboardData {
  feeBalance: number;
  totalFees: number;
  paidFees: number;
  attendanceRate: number;
  presentDays: number;
  totalDays: number;
  recentGrades: Array<{
    id: string;
    subject: { name: string };
    marks: number;
    grade: string;
    examName: string;
  }>;
  upcomingEvents: Array<{
    id: string;
    title: string;
    date: string;
    type: string;
  }>;
  recentPayments: Array<{
    id: string;
    amount: number;
    paymentDate: string;
    receiptNumber: string;
  }>;
}

export default function DashboardPage() {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (selectedStudent) {
      loadDashboardData();
    }
  }, [selectedStudent]);

  const loadDashboardData = async () => {
    if (!selectedStudent) return;

    setIsLoading(true);
    setError('');

    try {
      // Load all dashboard data in parallel
      const [invoices, attendance, grades, payments] = await Promise.all([
        api.getStudentInvoices(selectedStudent.id),
        api.getStudentAttendanceReport(selectedStudent.id),
        api.getStudentGrades(selectedStudent.id),
        api.getStudentPayments(selectedStudent.id),
      ]);

      // Calculate fee totals
      const totalFees = invoices.reduce((sum: number, inv: any) => sum + inv.amount, 0);
      const paidFees = invoices.reduce((sum: number, inv: any) => sum + inv.paidAmount, 0);
      const feeBalance = totalFees - paidFees;

      // Get recent payments (last 3)
      const recentPayments = payments.slice(0, 3);

      // Get recent grades (last 5)
      const recentGrades = grades.slice(0, 5);

      setDashboardData({
        feeBalance,
        totalFees,
        paidFees,
        attendanceRate: attendance.attendanceRate || 0,
        presentDays: attendance.presentCount || 0,
        totalDays: attendance.totalDays || 0,
        recentGrades,
        upcomingEvents: [], // TODO: Fetch from calendar API when available
        recentPayments,
      });
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!selectedStudent) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <StudentSelector onSelectStudent={setSelectedStudent} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Student Selector */}
      <StudentSelector
        selectedStudent={selectedStudent}
        onSelectStudent={setSelectedStudent}
      />

      {error && <Alert variant="danger">{error}</Alert>}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" message="Loading dashboard..." />
        </div>
      ) : dashboardData ? (
        <>
          {/* Welcome Section */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white">
            <h1 className="text-2xl font-bold mb-2">
              Welcome back!
            </h1>
            <p className="text-primary-100">
              Here's an overview of {selectedStudent.firstName}'s academic progress
            </p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Fee Balance */}
            <Card padding="lg" hover>
              <a href="/dashboard/fees" className="block">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Fee Balance</p>
                    <p className={`text-3xl font-bold ${
                      dashboardData.feeBalance > 0 ? 'text-danger-600' : 'text-success-600'
                    }`}>
                      KES {(dashboardData.feeBalance / 100).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      Paid: KES {(dashboardData.paidFees / 100).toLocaleString()} of{' '}
                      {(dashboardData.totalFees / 100).toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 bg-warning-50 rounded-lg">
                    <svg
                      className="w-6 h-6 text-warning-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                      />
                    </svg>
                  </div>
                </div>
                {dashboardData.feeBalance > 0 && (
                  <div className="mt-4">
                    <span className="text-sm text-primary-600 font-medium hover:text-primary-700">
                      Pay now with M-Pesa →
                    </span>
                  </div>
                )}
              </a>
            </Card>

            {/* Attendance */}
            <Card padding="lg" hover>
              <a href="/dashboard/attendance" className="block">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Attendance Rate</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {dashboardData.attendanceRate.toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      {dashboardData.presentDays} of {dashboardData.totalDays} days
                    </p>
                  </div>
                  <div className="p-3 bg-success-50 rounded-lg">
                    <svg
                      className="w-6 h-6 text-success-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-sm text-primary-600 font-medium hover:text-primary-700">
                    View details →
                  </span>
                </div>
              </a>
            </Card>

            {/* Recent Grade */}
            <Card padding="lg" hover>
              <a href="/dashboard/grades" className="block">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Latest Grade</p>
                    {dashboardData.recentGrades.length > 0 ? (
                      <>
                        <p className="text-3xl font-bold text-gray-900">
                          {dashboardData.recentGrades[0].grade}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          {dashboardData.recentGrades[0].subject.name}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-gray-500">No grades yet</p>
                    )}
                  </div>
                  <div className="p-3 bg-primary-50 rounded-lg">
                    <svg
                      className="w-6 h-6 text-primary-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-sm text-primary-600 font-medium hover:text-primary-700">
                    View all grades →
                  </span>
                </div>
              </a>
            </Card>
          </div>

          {/* Recent Activity Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Grades */}
            <Card>
              <CardHeader
                title="Recent Grades"
                action={
                  <a
                    href="/dashboard/grades"
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    View all
                  </a>
                }
              />
              <CardContent>
                {dashboardData.recentGrades.length > 0 ? (
                  <div className="space-y-3">
                    {dashboardData.recentGrades.map((grade) => (
                      <div
                        key={grade.id}
                        className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {grade.subject.name}
                          </p>
                          <p className="text-xs text-gray-500">{grade.examName}</p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-sm text-gray-600">
                            {grade.marks}%
                          </span>
                          <Badge
                            variant={
                              grade.grade === 'A'
                                ? 'success'
                                : grade.grade === 'B'
                                ? 'info'
                                : grade.grade === 'C'
                                ? 'warning'
                                : 'danger'
                            }
                          >
                            Grade {grade.grade}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-8">
                    No grades available yet
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Recent Payments */}
            <Card>
              <CardHeader
                title="Recent Payments"
                action={
                  <a
                    href="/dashboard/fees"
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    View all
                  </a>
                }
              />
              <CardContent>
                {dashboardData.recentPayments.length > 0 ? (
                  <div className="space-y-3">
                    {dashboardData.recentPayments.map((payment) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            KES {(payment.amount / 100).toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(payment.paymentDate), 'MMM dd, yyyy')}
                          </p>
                        </div>
                        <Badge variant="success">Paid</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-8">
                    No payments recorded yet
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader title="Quick Actions" />
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <QuickAction
                  href="/dashboard/fees"
                  icon="wallet"
                  label="Pay Fees"
                  color="primary"
                />
                <QuickAction
                  href="/dashboard/attendance"
                  icon="calendar"
                  label="Attendance"
                  color="success"
                />
                <QuickAction
                  href="/dashboard/grades"
                  icon="book"
                  label="View Grades"
                  color="warning"
                />
                <QuickAction
                  href="/dashboard/notifications"
                  icon="bell"
                  label="Notifications"
                  color="danger"
                />
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}

function QuickAction({
  href,
  icon,
  label,
  color,
}: {
  href: string;
  icon: string;
  label: string;
  color: 'primary' | 'success' | 'warning' | 'danger';
}) {
  const colors = {
    primary: 'bg-primary-50 text-primary-600 hover:bg-primary-100',
    success: 'bg-success-50 text-success-600 hover:bg-success-100',
    warning: 'bg-warning-50 text-warning-600 hover:bg-warning-100',
    danger: 'bg-danger-50 text-danger-600 hover:bg-danger-100',
  };

  const icons: Record<string, React.ReactNode> = {
    wallet: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
        />
      </svg>
    ),
    calendar: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    ),
    book: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
        />
      </svg>
    ),
    bell: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>
    ),
  };

  return (
    <a
      href={href}
      className={`flex flex-col items-center justify-center p-4 rounded-xl transition-colors tap-area ${colors[color]}`}
    >
      {icons[icon]}
      <span className="text-sm font-medium mt-2">{label}</span>
    </a>
  );
}
