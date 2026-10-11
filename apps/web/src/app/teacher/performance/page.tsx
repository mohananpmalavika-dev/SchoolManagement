'use client';

import { useState, useEffect } from 'react';
import { Card, Button, Badge, LoadingSpinner, Alert } from '@/components/ui';

interface ClassPerformance {
  classId: string;
  className: string;
  stream: string;
  studentCount: number;
  averageAttendance: number;
  averageGrade: number;
  topPerformers: StudentSummary[];
  atRiskStudents: StudentSummary[];
  attendanceTrend: 'improving' | 'declining' | 'stable';
  gradeTrend: 'improving' | 'declining' | 'stable';
}

interface StudentSummary {
  id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  attendancePercentage: number;
  averageGrade: number;
  recentAbsences: number;
  improvementRate: number;
}

interface PerformanceMetrics {
  totalStudents: number;
  averageAttendance: number;
  averageGrade: number;
  studentsAtRisk: number;
  studentsExcelling: number;
  attendanceImprovement: number;
  gradeImprovement: number;
}

export default function PerformancePage() {
  const [classPerformance, setClassPerformance] = useState<ClassPerformance[]>([]);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'term'>('month');

  useEffect(() => {
    fetchPerformanceData();
  }, [timeRange]);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch class performance data
      const classResponse = await fetch(
        `http://localhost:3001/api/performance/teacher?timeRange=${timeRange}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!classResponse.ok) throw new Error('Failed to fetch performance data');
      const classData = await classResponse.json();
      setClassPerformance(classData);

      // Calculate overall metrics
      const totalStudents = classData.reduce((sum: number, c: ClassPerformance) => sum + c.studentCount, 0);
      const avgAttendance = classData.reduce((sum: number, c: ClassPerformance) => 
        sum + (c.averageAttendance * c.studentCount), 0) / totalStudents;
      const avgGrade = classData.reduce((sum: number, c: ClassPerformance) => 
        sum + (c.averageGrade * c.studentCount), 0) / totalStudents;
      
      const atRisk = classData.reduce((sum: number, c: ClassPerformance) => 
        sum + c.atRiskStudents.length, 0);
      const excelling = classData.reduce((sum: number, c: ClassPerformance) => 
        sum + c.topPerformers.length, 0);

      setMetrics({
        totalStudents,
        averageAttendance: Math.round(avgAttendance * 10) / 10,
        averageGrade: Math.round(avgGrade * 10) / 10,
        studentsAtRisk: atRisk,
        studentsExcelling: excelling,
        attendanceImprovement: 2.3, // Mock data - would come from API
        gradeImprovement: 1.5, // Mock data - would come from API
      });

      // Auto-select first class
      if (classData.length > 0 && !selectedClassId) {
        setSelectedClassId(classData[0].classId);
      }
    } catch (err) {
      setError('Failed to load performance data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend: 'improving' | 'declining' | 'stable') => {
    if (trend === 'improving') return '📈';
    if (trend === 'declining') return '📉';
    return '➡️';
  };

  const getTrendColor = (trend: 'improving' | 'declining' | 'stable') => {
    if (trend === 'improving') return 'text-green-600';
    if (trend === 'declining') return 'text-red-600';
    return 'text-gray-600';
  };

  const getPerformanceColor = (value: number, type: 'attendance' | 'grade') => {
    if (type === 'attendance') {
      if (value >= 95) return 'text-green-600';
      if (value >= 85) return 'text-yellow-600';
      return 'text-red-600';
    } else {
      if (value >= 80) return 'text-green-600';
      if (value >= 60) return 'text-yellow-600';
      return 'text-red-600';
    }
  };

  const getImprovementBadge = (rate: number) => {
    if (rate > 5) return <Badge variant="success">High Growth</Badge>;
    if (rate > 0) return <Badge variant="warning">Improving</Badge>;
    if (rate < -5) return <Badge variant="danger">Declining</Badge>;
    return <Badge variant="default">Stable</Badge>;
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

  const selectedClass = classPerformance.find(c => c.classId === selectedClassId);

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-4">
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Performance Analytics</h1>
          <p className="text-gray-600 mt-1">Track student progress and identify trends</p>
        </div>

        {/* Time Range Filter */}
        <div className="flex space-x-2 mb-6">
          <Button
            size="sm"
            variant={timeRange === 'week' ? 'primary' : 'outline'}
            onClick={() => setTimeRange('week')}
          >
            This Week
          </Button>
          <Button
            size="sm"
            variant={timeRange === 'month' ? 'primary' : 'outline'}
            onClick={() => setTimeRange('month')}
          >
            This Month
          </Button>
          <Button
            size="sm"
            variant={timeRange === 'term' ? 'primary' : 'outline'}
            onClick={() => setTimeRange('term')}
          >
            This Term
          </Button>
        </div>

        {/* Overall Metrics */}
        {metrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
            <Card className="text-center">
              <div className="text-sm text-gray-600 mb-1">Total Students</div>
              <div className="text-2xl font-bold text-gray-900">{metrics.totalStudents}</div>
            </Card>
            
            <Card className="text-center">
              <div className="text-sm text-gray-600 mb-1">Avg. Attendance</div>
              <div className={`text-2xl font-bold ${getPerformanceColor(metrics.averageAttendance, 'attendance')}`}>
                {metrics.averageAttendance}%
              </div>
            </Card>
            
            <Card className="text-center">
              <div className="text-sm text-gray-600 mb-1">Avg. Grade</div>
              <div className={`text-2xl font-bold ${getPerformanceColor(metrics.averageGrade, 'grade')}`}>
                {metrics.averageGrade}%
              </div>
            </Card>
            
            <Card className="text-center">
              <div className="text-sm text-gray-600 mb-1">At Risk</div>
              <div className="text-2xl font-bold text-red-600">{metrics.studentsAtRisk}</div>
            </Card>
            
            <Card className="text-center">
              <div className="text-sm text-gray-600 mb-1">Excelling</div>
              <div className="text-2xl font-bold text-green-600">{metrics.studentsExcelling}</div>
            </Card>
            
            <Card className="text-center">
              <div className="text-sm text-gray-600 mb-1">Attendance Δ</div>
              <div className="text-2xl font-bold text-green-600">+{metrics.attendanceImprovement}%</div>
            </Card>
            
            <Card className="text-center">
              <div className="text-sm text-gray-600 mb-1">Grade Δ</div>
              <div className="text-2xl font-bold text-green-600">+{metrics.gradeImprovement}%</div>
            </Card>
          </div>
        )}

        {/* Class Performance Cards */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Class Performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classPerformance.map((classItem) => (
              <Card
                key={classItem.classId}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  selectedClassId === classItem.classId ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setSelectedClassId(classItem.classId)}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">
                      {classItem.className} {classItem.stream}
                    </h3>
                    <p className="text-sm text-gray-600">{classItem.studentCount} students</p>
                  </div>
                </div>

                <div className="space-y-2 mb-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Attendance:</span>
                    <div className="flex items-center space-x-2">
                      <span className={`font-semibold ${getPerformanceColor(classItem.averageAttendance, 'attendance')}`}>
                        {classItem.averageAttendance}%
                      </span>
                      <span className={getTrendColor(classItem.attendanceTrend)}>
                        {getTrendIcon(classItem.attendanceTrend)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Avg. Grade:</span>
                    <div className="flex items-center space-x-2">
                      <span className={`font-semibold ${getPerformanceColor(classItem.averageGrade, 'grade')}`}>
                        {classItem.averageGrade}%
                      </span>
                      <span className={getTrendColor(classItem.gradeTrend)}>
                        {getTrendIcon(classItem.gradeTrend)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between text-sm pt-3 border-t border-gray-200">
                  <div className="text-center">
                    <div className="font-semibold text-red-600">{classItem.atRiskStudents.length}</div>
                    <div className="text-xs text-gray-600">At Risk</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-green-600">{classItem.topPerformers.length}</div>
                    <div className="text-xs text-gray-600">Top Performers</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Detailed Class View */}
        {selectedClass && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* At-Risk Students */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  At-Risk Students ({selectedClass.atRiskStudents.length})
                </h3>
                <Badge variant="danger">Needs Attention</Badge>
              </div>

              {selectedClass.atRiskStudents.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No at-risk students identified</p>
                  <p className="text-sm text-green-600 mt-2">Great job! Keep up the good work.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedClass.atRiskStudents.map((student) => (
                    <div
                      key={student.id}
                      className="p-3 bg-red-50 border border-red-200 rounded-lg"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="font-semibold text-gray-900">
                            {student.firstName} {student.lastName}
                          </div>
                          <div className="text-sm text-gray-600">{student.admissionNumber}</div>
                        </div>
                        {getImprovementBadge(student.improvementRate)}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                        <div>
                          <span className="text-gray-600">Attendance: </span>
                          <span className={`font-semibold ${getPerformanceColor(student.attendancePercentage, 'attendance')}`}>
                            {student.attendancePercentage}%
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Grade: </span>
                          <span className={`font-semibold ${getPerformanceColor(student.averageGrade, 'grade')}`}>
                            {student.averageGrade}%
                          </span>
                        </div>
                      </div>

                      {student.recentAbsences > 0 && (
                        <div className="text-xs text-red-700 mb-2">
                          ⚠️ {student.recentAbsences} absences in the last week
                        </div>
                      )}

                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" className="text-xs">
                          View Profile
                        </Button>
                        <Button size="sm" variant="outline" className="text-xs">
                          Contact Guardian
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Top Performers */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Top Performers ({selectedClass.topPerformers.length})
                </h3>
                <Badge variant="success">Excellence</Badge>
              </div>

              {selectedClass.topPerformers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No top performers yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedClass.topPerformers.map((student, index) => (
                    <div
                      key={student.id}
                      className="p-3 bg-green-50 border border-green-200 rounded-lg"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">
                              {student.firstName} {student.lastName}
                            </div>
                            <div className="text-sm text-gray-600">{student.admissionNumber}</div>
                          </div>
                        </div>
                        {getImprovementBadge(student.improvementRate)}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-600">Attendance: </span>
                          <span className="font-semibold text-green-600">
                            {student.attendancePercentage}%
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Grade: </span>
                          <span className="font-semibold text-green-600">
                            {student.averageGrade}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Action Buttons */}
        <Card className="mt-6">
          <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-3">
            <Button variant="primary">
              <span className="mr-2">📊</span>
              Export Report
            </Button>
            <Button variant="outline">
              <span className="mr-2">📧</span>
              Send Progress Updates
            </Button>
            <Button variant="outline">
              <span className="mr-2">📞</span>
              Schedule Parent Meetings
            </Button>
            <Button variant="outline">
              <span className="mr-2">📝</span>
              Create Intervention Plan
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
