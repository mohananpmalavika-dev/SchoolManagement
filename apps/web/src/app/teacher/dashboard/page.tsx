'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardContent, Badge, LoadingSpinner, Alert } from '@/components/ui';
import { format } from 'date-fns';

interface TeacherClass {
  id: string;
  name: string;
  stream: string;
  studentCount: number;
  subject?: string;
}

interface TodaySchedule {
  id: string;
  period: number;
  startTime: string;
  endTime: string;
  subject: string;
  class: string;
  room: string;
}

interface PendingTask {
  id: string;
  type: 'GRADE_ENTRY' | 'ATTENDANCE' | 'REPORT';
  title: string;
  dueDate: string;
  class: string;
}

export default function TeacherDashboardPage() {
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [schedule, setSchedule] = useState<TodaySchedule[]>([]);
  const [pendingTasks, setPendingTasks] = useState<PendingTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Mock data - replace with actual API calls
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setClasses([
        { id: '1', name: 'Grade 5', stream: 'A', studentCount: 32, subject: 'Mathematics' },
        { id: '2', name: 'Grade 5', stream: 'B', studentCount: 30, subject: 'Mathematics' },
        { id: '3', name: 'Grade 6', stream: 'A', studentCount: 28, subject: 'Mathematics' },
      ]);

      setSchedule([
        { id: '1', period: 1, startTime: '08:00', endTime: '08:45', subject: 'Mathematics', class: 'Grade 5A', room: 'Room 101' },
        { id: '2', period: 3, startTime: '10:00', endTime: '10:45', subject: 'Mathematics', class: 'Grade 5B', room: 'Room 101' },
        { id: '3', period: 6, startTime: '13:00', endTime: '13:45', subject: 'Mathematics', class: 'Grade 6A', room: 'Room 102' },
      ]);

      setPendingTasks([
        { id: '1', type: 'GRADE_ENTRY', title: 'Mid-term exam grades', dueDate: '2024-01-25', class: 'Grade 5A' },
        { id: '2', type: 'ATTENDANCE', title: "Today's attendance", dueDate: '2024-01-20', class: 'All Classes' },
        { id: '3', type: 'REPORT', title: 'Term report comments', dueDate: '2024-01-30', class: 'Grade 5A' },
      ]);
    } catch (err: any) {
      console.error('Failed to load dashboard:', err);
      setError('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" message="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {error && <Alert variant="danger">{error}</Alert>}

      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          Good {getGreeting()}, Teacher!
        </h1>
        <p className="text-indigo-100">
          You have {schedule.length} classes today and {pendingTasks.length} pending tasks
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          label="My Classes"
          value={classes.length.toString()}
          icon="users"
          color="indigo"
        />
        <StatCard
          label="Total Students"
          value={classes.reduce((sum, c) => sum + c.studentCount, 0).toString()}
          icon="user-group"
          color="blue"
        />
        <StatCard
          label="Today's Classes"
          value={schedule.length.toString()}
          icon="calendar"
          color="green"
        />
        <StatCard
          label="Pending Tasks"
          value={pendingTasks.length.toString()}
          icon="clipboard"
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <Card>
          <CardHeader
            title="Today's Schedule"
            subtitle={format(new Date(), 'EEEE, MMMM dd')}
          />
          <CardContent className="p-0">
            {schedule.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {schedule.map((item) => (
                  <div key={item.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <Badge variant="info">Period {item.period}</Badge>
                          <span className="text-sm font-medium text-gray-900">
                            {item.startTime} - {item.endTime}
                          </span>
                        </div>
                        <p className="font-semibold text-gray-900">{item.subject}</p>
                        <p className="text-sm text-gray-600">
                          {item.class} • {item.room}
                        </p>
                      </div>
                      <a
                        href={`/teacher/attendance?class=${item.class}`}
                        className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                      >
                        Mark Attendance →
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                No classes scheduled for today
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Tasks */}
        <Card>
          <CardHeader title="Pending Tasks" subtitle="Things that need your attention" />
          <CardContent className="p-0">
            {pendingTasks.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {pendingTasks.map((task) => (
                  <div key={task.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <TaskBadge type={task.type} />
                        </div>
                        <p className="font-medium text-gray-900">{task.title}</p>
                        <p className="text-sm text-gray-600">
                          {task.class} • Due {format(new Date(task.dueDate), 'MMM dd')}
                        </p>
                      </div>
                      <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                        Complete →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
                  <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-gray-500">All caught up!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* My Classes */}
      <Card>
        <CardHeader
          title="My Classes"
          action={
            <a
              href="/teacher/classes"
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              View All
            </a>
          }
        />
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {classes.map((cls) => (
              <a
                key={cls.id}
                href={`/teacher/classes/${cls.id}`}
                className="block bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-indigo-300 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">
                      {cls.name} {cls.stream}
                    </h3>
                    <p className="text-sm text-gray-600">{cls.subject}</p>
                  </div>
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    {cls.studentCount} students
                  </span>
                  <span className="text-sm text-indigo-600 font-medium">
                    View class →
                  </span>
                </div>
              </a>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader title="Quick Actions" />
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <QuickAction
              href="/teacher/attendance"
              icon="check"
              label="Mark Attendance"
              color="green"
            />
            <QuickAction
              href="/teacher/grades"
              icon="edit"
              label="Enter Grades"
              color="blue"
            />
            <QuickAction
              href="/teacher/timetable"
              icon="calendar"
              label="View Schedule"
              color="purple"
            />
            <QuickAction
              href="/teacher/classes"
              icon="users"
              label="Manage Classes"
              color="orange"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: string;
  color: string;
}) {
  const colors: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-600',
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
  };

  return (
    <Card padding="lg">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colors[color]}`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </div>
      </div>
    </Card>
  );
}

function TaskBadge({ type }: { type: string }) {
  const config: Record<string, { variant: 'danger' | 'warning' | 'info'; label: string }> = {
    GRADE_ENTRY: { variant: 'warning', label: 'Grade Entry' },
    ATTENDANCE: { variant: 'danger', label: 'Attendance' },
    REPORT: { variant: 'info', label: 'Report' },
  };

  const { variant, label } = config[type] || { variant: 'info', label: type };

  return <Badge variant={variant}>{label}</Badge>;
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
  color: string;
}) {
  const colors: Record<string, string> = {
    green: 'bg-green-50 text-green-600 hover:bg-green-100',
    blue: 'bg-blue-50 text-blue-600 hover:bg-blue-100',
    purple: 'bg-purple-50 text-purple-600 hover:bg-purple-100',
    orange: 'bg-orange-50 text-orange-600 hover:bg-orange-100',
  };

  return (
    <a
      href={href}
      className={`flex flex-col items-center justify-center p-4 rounded-xl transition-colors tap-area ${colors[color]}`}
    >
      <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span className="text-sm font-medium text-center">{label}</span>
    </a>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Morning';
  if (hour < 18) return 'Afternoon';
  return 'Evening';
}
