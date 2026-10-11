'use client';

import { useState, useEffect } from 'react';
import { Card, Button, Input, Badge, LoadingSpinner, Alert } from '@/components/ui';

interface Class {
  id: string;
  name: string;
  stream: string;
  level: string;
  studentCount: number;
  subjects: string[];
  classTeacher?: string;
  averageAttendance: number;
  averageGrade: number;
}

interface Student {
  id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  gender: 'MALE' | 'FEMALE';
  dateOfBirth: string;
  status: 'ACTIVE' | 'INACTIVE' | 'GRADUATED' | 'WITHDRAWN';
  attendancePercentage: number;
  averageGrade: number;
  feesBalance: number;
  guardianPhone: string;
  guardianName: string;
  recentAbsences: number;
}

export default function ClassesPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'attendance' | 'grade'>('name');

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchStudents(selectedClass.id);
    }
  }, [selectedClass]);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/classes/teacher', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch classes');
      const data = await response.json();
      setClasses(data);
      
      // Auto-select first class if available
      if (data.length > 0 && !selectedClass) {
        setSelectedClass(data[0]);
      }
    } catch (err) {
      setError('Failed to load classes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async (classId: string) => {
    try {
      setStudentsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/classes/${classId}/students`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch students');
      const data = await response.json();
      setStudents(data);
    } catch (err) {
      setError('Failed to load students');
      console.error(err);
    } finally {
      setStudentsLoading(false);
    }
  };

  const getFilteredAndSortedStudents = () => {
    let filtered = students;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(student =>
        student.firstName.toLowerCase().includes(query) ||
        student.lastName.toLowerCase().includes(query) ||
        student.admissionNumber.toLowerCase().includes(query)
      );
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(student => student.status === filterStatus);
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'name') {
        return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
      } else if (sortBy === 'attendance') {
        return b.attendancePercentage - a.attendancePercentage;
      } else if (sortBy === 'grade') {
        return b.averageGrade - a.averageGrade;
      }
      return 0;
    });

    return sorted;
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

  const getStatusBadgeVariant = (status: string): 'success' | 'warning' | 'danger' | 'default' => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'INACTIVE': return 'warning';
      case 'WITHDRAWN': return 'danger';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error && classes.length === 0) {
    return (
      <div className="p-4">
        <Alert variant="danger">{error}</Alert>
      </div>
    );
  }

  const filteredStudents = getFilteredAndSortedStudents();

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-4">
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">My Classes</h1>
          <p className="text-gray-600 mt-1">Manage your assigned classes and students</p>
        </div>

        {/* Classes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {classes.map((classItem) => (
            <Card
              key={classItem.id}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                selectedClass?.id === classItem.id ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => setSelectedClass(classItem)}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">
                    {classItem.name} {classItem.stream}
                  </h3>
                  <p className="text-sm text-gray-600">{classItem.level}</p>
                </div>
                <Badge variant="default">{classItem.studentCount} students</Badge>
              </div>

              <div className="space-y-2 mb-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Avg. Attendance:</span>
                  <span className={`font-semibold ${getPerformanceColor(classItem.averageAttendance, 'attendance')}`}>
                    {classItem.averageAttendance}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Avg. Grade:</span>
                  <span className={`font-semibold ${getPerformanceColor(classItem.averageGrade, 'grade')}`}>
                    {classItem.averageGrade}%
                  </span>
                </div>
              </div>

              {classItem.subjects.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {classItem.subjects.slice(0, 3).map((subject, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded"
                    >
                      {subject}
                    </span>
                  ))}
                  {classItem.subjects.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                      +{classItem.subjects.length - 3} more
                    </span>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* Student List Section */}
        {selectedClass && (
          <Card className="mb-6">
            <div className="border-b border-gray-200 pb-4 mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedClass.name} {selectedClass.stream} Students
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {filteredStudents.length} of {students.length} students
              </p>
            </div>

            {/* Filters and Search */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="md:col-span-2">
                <Input
                  type="text"
                  placeholder="Search by name or admission number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>

              <div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="GRADUATED">Graduated</option>
                  <option value="WITHDRAWN">Withdrawn</option>
                </select>
              </div>

              <div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'name' | 'attendance' | 'grade')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="name">Sort by Name</option>
                  <option value="attendance">Sort by Attendance</option>
                  <option value="grade">Sort by Grade</option>
                </select>
              </div>
            </div>

            {/* Students Table */}
            {studentsLoading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No students found</p>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Adm. No
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Student Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Gender
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Attendance
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Avg. Grade
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Guardian
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredStudents.map((student) => (
                        <tr key={student.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {student.admissionNumber}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                                <span className="text-blue-600 font-semibold text-sm">
                                  {student.firstName[0]}{student.lastName[0]}
                                </span>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {student.firstName} {student.lastName}
                                </div>
                                {student.recentAbsences > 3 && (
                                  <div className="text-xs text-red-600">
                                    {student.recentAbsences} recent absences
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                            {student.gender}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className={`text-sm font-semibold ${getPerformanceColor(student.attendancePercentage, 'attendance')}`}>
                              {student.attendancePercentage}%
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className={`text-sm font-semibold ${getPerformanceColor(student.averageGrade, 'grade')}`}>
                              {student.averageGrade}%
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <Badge variant={getStatusBadgeVariant(student.status)}>
                              {student.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{student.guardianName}</div>
                            <div className="text-xs text-gray-500">{student.guardianPhone}</div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm">
                            <div className="flex space-x-2">
                              <button
                                className="text-blue-600 hover:text-blue-900"
                                title="View Details"
                              >
                                View
                              </button>
                              <button
                                className="text-green-600 hover:text-green-900"
                                title="Contact Guardian"
                              >
                                Contact
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4">
                  {filteredStudents.map((student) => (
                    <Card key={student.id} className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                            <span className="text-blue-600 font-semibold">
                              {student.firstName[0]}{student.lastName[0]}
                            </span>
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">
                              {student.firstName} {student.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{student.admissionNumber}</div>
                          </div>
                        </div>
                        <Badge variant={getStatusBadgeVariant(student.status)}>
                          {student.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Attendance</div>
                          <div className={`font-semibold ${getPerformanceColor(student.attendancePercentage, 'attendance')}`}>
                            {student.attendancePercentage}%
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Avg. Grade</div>
                          <div className={`font-semibold ${getPerformanceColor(student.averageGrade, 'grade')}`}>
                            {student.averageGrade}%
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Gender</div>
                          <div className="text-sm text-gray-900">{student.gender}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Guardian</div>
                          <div className="text-sm text-gray-900">{student.guardianName}</div>
                        </div>
                      </div>

                      {student.recentAbsences > 3 && (
                        <Alert variant="warning" className="mb-3 text-xs">
                          {student.recentAbsences} recent absences
                        </Alert>
                      )}

                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" className="flex-1">
                          View Details
                        </Button>
                        <Button size="sm" variant="primary" className="flex-1">
                          Contact
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </>
            )}

            {/* Quick Actions */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex flex-wrap gap-3">
                <Button variant="primary">
                  <span className="mr-2">📊</span>
                  Class Report
                </Button>
                <Button variant="outline">
                  <span className="mr-2">📝</span>
                  Mark Attendance
                </Button>
                <Button variant="outline">
                  <span className="mr-2">📚</span>
                  Enter Grades
                </Button>
                <Button variant="outline">
                  <span className="mr-2">📧</span>
                  Send Message
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
