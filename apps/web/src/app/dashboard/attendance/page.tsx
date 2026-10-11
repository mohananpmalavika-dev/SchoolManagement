'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import {
  Card,
  CardHeader,
  CardContent,
  Badge,
  LoadingSpinner,
  Alert,
} from '@/components/ui';
import { StudentSelector } from '@/components/StudentSelector';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, subMonths } from 'date-fns';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  admissionNumber: string;
  class: { name: string };
  stream: { name: string };
}

interface AttendanceRecord {
  id: string;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  remarks?: string;
}

interface AttendanceSummary {
  totalDays: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  attendanceRate: number;
}

export default function AttendancePage() {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (selectedStudent) {
      loadAttendanceData();
    }
  }, [selectedStudent, currentMonth]);

  const loadAttendanceData = async () => {
    if (!selectedStudent) return;

    setIsLoading(true);
    setError('');

    try {
      const startDate = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

      const [attendanceData, summaryData] = await Promise.all([
        api.getStudentAttendance(selectedStudent.id, startDate, endDate),
        api.getStudentAttendanceReport(selectedStudent.id, startDate, endDate),
      ]);

      setAttendance(attendanceData);
      setSummary(summaryData);
    } catch (err: any) {
      console.error('Failed to load attendance:', err);
      setError('Failed to load attendance information');
    } finally {
      setIsLoading(false);
    }
  };

  const getAttendanceForDate = (date: Date): AttendanceRecord | undefined => {
    return attendance.find((record) =>
      isSameDay(new Date(record.date), date)
    );
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    const nextMonth = subMonths(currentMonth, -1);
    // Don't go beyond current month
    if (nextMonth <= new Date()) {
      setCurrentMonth(nextMonth);
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
      <StudentSelector
        selectedStudent={selectedStudent}
        onSelectStudent={setSelectedStudent}
      />

      {error && <Alert variant="danger">{error}</Alert>}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" message="Loading attendance..." />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Card padding="lg">
                <p className="text-xs text-gray-500 mb-2">Attendance Rate</p>
                <p className="text-2xl font-bold text-primary-600">
                  {summary.attendanceRate.toFixed(1)}%
                </p>
              </Card>
              <Card padding="lg">
                <p className="text-xs text-gray-500 mb-2">Present</p>
                <p className="text-2xl font-bold text-success-600">
                  {summary.presentCount}
                </p>
              </Card>
              <Card padding="lg">
                <p className="text-xs text-gray-500 mb-2">Absent</p>
                <p className="text-2xl font-bold text-danger-600">
                  {summary.absentCount}
                </p>
              </Card>
              <Card padding="lg">
                <p className="text-xs text-gray-500 mb-2">Late</p>
                <p className="text-2xl font-bold text-warning-600">
                  {summary.lateCount}
                </p>
              </Card>
              <Card padding="lg">
                <p className="text-xs text-gray-500 mb-2">Excused</p>
                <p className="text-2xl font-bold text-gray-600">
                  {summary.excusedCount}
                </p>
              </Card>
            </div>
          )}

          {/* Calendar View */}
          <Card>
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  {format(currentMonth, 'MMMM yyyy')}
                </h2>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handlePreviousMonth}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors tap-area"
                  >
                    <svg
                      className="w-5 h-5 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={handleNextMonth}
                    disabled={subMonths(currentMonth, -1) > new Date()}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors tap-area disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg
                      className="w-5 h-5 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <CardContent>
              <AttendanceCalendar
                month={currentMonth}
                getAttendanceForDate={getAttendanceForDate}
              />
            </CardContent>
          </Card>

          {/* Attendance Legend */}
          <Card>
            <CardHeader title="Legend" />
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-success-500 rounded"></div>
                  <span className="text-sm text-gray-700">Present</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-danger-500 rounded"></div>
                  <span className="text-sm text-gray-700">Absent</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-warning-500 rounded"></div>
                  <span className="text-sm text-gray-700">Late</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-gray-400 rounded"></div>
                  <span className="text-sm text-gray-700">Excused</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Records */}
          <Card>
            <CardHeader
              title="Detailed Records"
              subtitle={`Attendance records for ${format(currentMonth, 'MMMM yyyy')}`}
            />
            <CardContent className="p-0">
              {attendance.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {attendance
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((record) => (
                      <div
                        key={record.id}
                        className="p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              {format(new Date(record.date), 'EEEE, MMMM dd, yyyy')}
                            </p>
                            {record.remarks && (
                              <p className="text-sm text-gray-500 mt-1">
                                {record.remarks}
                              </p>
                            )}
                          </div>
                          <AttendanceStatusBadge status={record.status} />
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="p-8 text-center text-gray-500">
                  No attendance records for this month
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function AttendanceCalendar({
  month,
  getAttendanceForDate,
}: {
  month: Date;
  getAttendanceForDate: (date: Date) => AttendanceRecord | undefined;
}) {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get the day of week for the first day (0 = Sunday)
  const firstDayOfWeek = monthStart.getDay();

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div>
      {/* Week day headers */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-gray-500 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {/* Empty cells for days before month starts */}
        {Array.from({ length: firstDayOfWeek }).map((_, index) => (
          <div key={`empty-${index}`} className="aspect-square"></div>
        ))}

        {/* Days of the month */}
        {daysInMonth.map((date) => {
          const record = getAttendanceForDate(date);
          const isToday = isSameDay(date, new Date());
          const isFuture = date > new Date();

          return (
            <div
              key={date.toString()}
              className={`aspect-square flex flex-col items-center justify-center rounded-lg border ${
                isToday
                  ? 'border-primary-500 border-2'
                  : 'border-gray-200'
              } ${isFuture ? 'bg-gray-50' : 'bg-white'}`}
            >
              <span
                className={`text-sm ${
                  isToday
                    ? 'font-bold text-primary-600'
                    : 'text-gray-700'
                }`}
              >
                {format(date, 'd')}
              </span>
              {record && !isFuture && (
                <div
                  className={`w-2 h-2 rounded-full mt-1 ${getStatusColor(
                    record.status
                  )}`}
                  title={record.status}
                ></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AttendanceStatusBadge({ status }: { status: string }) {
  const variants: Record<string, 'success' | 'danger' | 'warning' | 'default'> = {
    PRESENT: 'success',
    ABSENT: 'danger',
    LATE: 'warning',
    EXCUSED: 'default',
  };

  return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PRESENT: 'bg-success-500',
    ABSENT: 'bg-danger-500',
    LATE: 'bg-warning-500',
    EXCUSED: 'bg-gray-400',
  };

  return colors[status] || 'bg-gray-300';
}
