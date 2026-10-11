'use client';

import { useState, useEffect } from 'react';
import { Card, Button, Badge, LoadingSpinner, Alert } from '@/components/ui';

interface TimetableEntry {
  id: string;
  dayOfWeek: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY';
  period: number;
  startTime: string;
  endTime: string;
  subject: string;
  className: string;
  stream: string;
  room: string;
  topic?: string;
}

interface DaySchedule {
  day: string;
  date: string;
  isToday: boolean;
  entries: TimetableEntry[];
}

const DAYS_OF_WEEK = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
const DAY_LABELS = {
  MONDAY: 'Monday',
  TUESDAY: 'Tuesday',
  WEDNESDAY: 'Wednesday',
  THURSDAY: 'Thursday',
  FRIDAY: 'Friday',
};

const PERIODS = [
  { period: 1, time: '8:00 - 8:40' },
  { period: 2, time: '8:40 - 9:20' },
  { period: 3, time: '9:20 - 10:00' },
  { period: 4, time: '10:20 - 11:00' }, // After break
  { period: 5, time: '11:00 - 11:40' },
  { period: 6, time: '11:40 - 12:20' },
  { period: 7, time: '12:20 - 1:00' },
  { period: 8, time: '2:00 - 2:40' }, // After lunch
  { period: 9, time: '2:40 - 3:20' },
];

export default function TimetablePage() {
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'week' | 'today'>('week');
  const [currentDay, setCurrentDay] = useState<string>('');

  useEffect(() => {
    // Get current day
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
    setCurrentDay(today);
    fetchTimetable();
  }, []);

  const fetchTimetable = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/timetable/teacher', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch timetable');
      const data = await response.json();
      setTimetable(data);
    } catch (err) {
      setError('Failed to load timetable');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getDaySchedule = (): DaySchedule[] => {
    return DAYS_OF_WEEK.map((day) => {
      const entries = timetable.filter((entry) => entry.dayOfWeek === day);
      const dayDate = getDateForDay(day);
      
      return {
        day: DAY_LABELS[day as keyof typeof DAY_LABELS],
        date: dayDate,
        isToday: day === currentDay,
        entries: entries.sort((a, b) => a.period - b.period),
      };
    });
  };

  const getDateForDay = (day: string): string => {
    const today = new Date();
    const currentDayIndex = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const targetDayIndex = DAYS_OF_WEEK.indexOf(day) + 1; // +1 because DAYS_OF_WEEK starts with Monday
    
    const diff = targetDayIndex - currentDayIndex;
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + diff);
    
    return targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getTodaySchedule = (): TimetableEntry[] => {
    return timetable
      .filter((entry) => entry.dayOfWeek === currentDay)
      .sort((a, b) => a.period - b.period);
  };

  const getCurrentPeriod = (): number => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    for (const period of PERIODS) {
      const [start] = period.time.split(' - ');
      const [startHour, startMin] = start.split(':').map(Number);
      const periodStartTime = startHour * 60 + startMin;
      
      if (currentTime < periodStartTime + 40) {
        return period.period;
      }
    }
    
    return 0; // No current period
  };

  const getSubjectColor = (subject: string): string => {
    const colors: { [key: string]: string } = {
      'Mathematics': 'bg-blue-100 text-blue-700 border-blue-300',
      'English': 'bg-green-100 text-green-700 border-green-300',
      'Science': 'bg-purple-100 text-purple-700 border-purple-300',
      'Kiswahili': 'bg-yellow-100 text-yellow-700 border-yellow-300',
      'Social Studies': 'bg-orange-100 text-orange-700 border-orange-300',
      'Physical Education': 'bg-red-100 text-red-700 border-red-300',
      'Creative Arts': 'bg-pink-100 text-pink-700 border-pink-300',
    };
    
    return colors[subject] || 'bg-gray-100 text-gray-700 border-gray-300';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <Alert variant="danger">{error}</Alert>
      </div>
    );
  }

  const daySchedules = getDaySchedule();
  const todaySchedule = getTodaySchedule();
  const currentPeriod = getCurrentPeriod();

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-4">
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">My Timetable</h1>
          <p className="text-gray-600 mt-1">View your teaching schedule</p>
        </div>

        {/* View Toggle */}
        <div className="flex space-x-2 mb-6">
          <Button
            variant={viewMode === 'week' ? 'primary' : 'outline'}
            onClick={() => setViewMode('week')}
          >
            Week View
          </Button>
          <Button
            variant={viewMode === 'today' ? 'primary' : 'outline'}
            onClick={() => setViewMode('today')}
          >
            Today
          </Button>
        </div>

        {/* Today View */}
        {viewMode === 'today' && (
          <Card>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {DAY_LABELS[currentDay as keyof typeof DAY_LABELS] || 'Today'}
              </h2>
              <p className="text-sm text-gray-600">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>

            {todaySchedule.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No classes scheduled for today</p>
              </div>
            ) : (
              <div className="space-y-4">
                {todaySchedule.map((entry) => {
                  const isCurrentPeriod = entry.period === currentPeriod;
                  
                  return (
                    <div
                      key={entry.id}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        isCurrentPeriod
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <div className="flex flex-col items-center">
                            <span className="text-2xl font-bold text-gray-900">
                              {entry.period}
                            </span>
                            <span className="text-xs text-gray-500">Period</span>
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg text-gray-900">
                              {entry.subject}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {entry.className} {entry.stream}
                            </p>
                          </div>
                        </div>
                        {isCurrentPeriod && (
                          <Badge variant="success">Current</Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Time:</span>
                          <span className="ml-2 font-medium text-gray-900">
                            {entry.startTime} - {entry.endTime}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Room:</span>
                          <span className="ml-2 font-medium text-gray-900">
                            {entry.room}
                          </span>
                        </div>
                      </div>

                      {entry.topic && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Topic:</span> {entry.topic}
                          </p>
                        </div>
                      )}

                      <div className="mt-3 flex space-x-2">
                        <Button size="sm" variant="outline">
                          Mark Attendance
                        </Button>
                        <Button size="sm" variant="outline">
                          View Class
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        )}

        {/* Week View */}
        {viewMode === 'week' && (
          <>
            {/* Desktop Week Grid */}
            <div className="hidden lg:block">
              <Card className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b border-r">
                        Period
                      </th>
                      {daySchedules.map((schedule) => (
                        <th
                          key={schedule.day}
                          className={`px-4 py-3 text-left text-sm font-semibold border-b ${
                            schedule.isToday ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                          }`}
                        >
                          <div>{schedule.day}</div>
                          <div className="text-xs font-normal text-gray-500">
                            {schedule.date}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {PERIODS.map((period) => (
                      <tr key={period.period} className="border-b">
                        <td className="px-4 py-3 border-r bg-gray-50">
                          <div className="font-semibold text-gray-900">
                            Period {period.period}
                          </div>
                          <div className="text-xs text-gray-500">{period.time}</div>
                        </td>
                        {daySchedules.map((schedule) => {
                          const entry = schedule.entries.find(
                            (e) => e.period === period.period
                          );
                          const isCurrentCell =
                            schedule.isToday && period.period === currentPeriod;

                          return (
                            <td
                              key={`${schedule.day}-${period.period}`}
                              className={`px-2 py-2 ${
                                schedule.isToday ? 'bg-blue-50' : ''
                              } ${isCurrentCell ? 'ring-2 ring-blue-500' : ''}`}
                            >
                              {entry ? (
                                <div
                                  className={`p-2 rounded border ${getSubjectColor(
                                    entry.subject
                                  )}`}
                                >
                                  <div className="font-semibold text-sm mb-1">
                                    {entry.subject}
                                  </div>
                                  <div className="text-xs">
                                    {entry.className} {entry.stream}
                                  </div>
                                  <div className="text-xs opacity-75 mt-1">
                                    Room {entry.room}
                                  </div>
                                </div>
                              ) : (
                                <div className="text-center text-gray-400 text-sm py-4">
                                  Free
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </div>

            {/* Mobile/Tablet Day Cards */}
            <div className="lg:hidden space-y-4">
              {daySchedules.map((schedule) => (
                <Card
                  key={schedule.day}
                  className={schedule.isToday ? 'ring-2 ring-blue-500' : ''}
                >
                  <div className="flex items-center justify-between mb-4 pb-3 border-b">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">
                        {schedule.day}
                      </h3>
                      <p className="text-sm text-gray-600">{schedule.date}</p>
                    </div>
                    {schedule.isToday && <Badge variant="success">Today</Badge>}
                  </div>

                  {schedule.entries.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                      No classes scheduled
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {schedule.entries.map((entry) => (
                        <div
                          key={entry.id}
                          className={`p-3 rounded-lg border ${getSubjectColor(
                            entry.subject
                          )}`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="font-semibold text-gray-900">
                                {entry.subject}
                              </div>
                              <div className="text-sm opacity-90">
                                {entry.className} {entry.stream}
                              </div>
                            </div>
                            <Badge variant="default">P{entry.period}</Badge>
                          </div>
                          <div className="text-sm opacity-75">
                            <span>{entry.startTime} - {entry.endTime}</span>
                            <span className="mx-2">•</span>
                            <span>Room {entry.room}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </>
        )}

        {/* Summary Stats */}
        <Card className="mt-6">
          <h3 className="font-semibold text-gray-900 mb-4">Weekly Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {timetable.length}
              </div>
              <div className="text-sm text-gray-600">Total Periods</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {new Set(timetable.map((e) => e.className)).size}
              </div>
              <div className="text-sm text-gray-600">Classes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {new Set(timetable.map((e) => e.subject)).size}
              </div>
              <div className="text-sm text-gray-600">Subjects</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {todaySchedule.length}
              </div>
              <div className="text-sm text-gray-600">Today's Classes</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
